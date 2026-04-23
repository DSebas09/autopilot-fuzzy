"""
main.py
-------
FastAPI server exposing a WebSocket endpoint for the fuzzy autopilot simulator.

WebSocket endpoint: ws://localhost:8000/ws/sim

Message protocol
----------------
Server → Client  (~every TICK_INTERVAL seconds):
    { "type": "state", "time": ..., "position": {...}, ... }

Client → Server  (commands):
    { "type": "reset" }
    { "type": "turbulence_pulse", "intensity": "low" | "medium" | "high" }
    { "type": "pause", "value": true | false }

Run with:
    uvicorn main:app --reload
"""

import asyncio
import json
import logging
from typing import Literal, Annotated, Union

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import TypeAdapter, BaseModel, Field, ValidationError

from simulation import AircraftSimulation, DT, TurbulenceIntensity


class ResetCommand(BaseModel):
    type: Literal["reset"]


class TurbulencePulseCommand(BaseModel):
    type: Literal["turbulence_pulse"]
    intensity: TurbulenceIntensity = "medium"


class PauseCommand(BaseModel):
    type: Literal["pause"]
    value: bool


# Discriminated union — Pydantic uses the "type" field to route
# each incoming message to the correct model automatically.
WsCommand = Annotated[
    Union[ResetCommand, TurbulencePulseCommand, PauseCommand],
    Field(discriminator="type"),
]

logging.basicConfig(level=logging.INFO)
_log = logging.getLogger(__name__)

TICK_INTERVAL: float = DT          # Keeps main.py in sync with simulation.py
COMMAND_QUEUE_SIZE: int = 32       # Max buffered commands before dropping oldest

# Built once at module load. TypeAdapter is reusable and construction is not free
_COMMAND_ADAPTER: TypeAdapter[WsCommand] = TypeAdapter(WsCommand)

ALLOWED_ORIGINS: list[str] = [
    "http://localhost:5173",       # Vite dev server
]

app = FastAPI(
    title="Fuzzy Autopilot",
    description="Aircraft autopilot simulator using Mamdani fuzzy logic — AI Course Project",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "message": "Fuzzy autopilot online"}


@app.websocket("/ws/sim")
async def websocket_simulation(websocket: WebSocket) -> None:
    """
    Manages a single WebSocket connection with one client.

    Runs two concurrent tasks per connection:
    - _command_receiver: listens for incoming JSON commands and enqueues them.
    - _simulation_loop: ticks the simulation every TICK_INTERVAL seconds,
     drains any queued commands, and pushes the new state to the client.

    Both tasks share a Queue[str] as the only communication channel,
    keeping them fully decoupled.
    """
    await websocket.accept()
    _log.info("Client connected: %s", websocket.client)

    sim = AircraftSimulation()
    queue: asyncio.Queue[str] = asyncio.Queue(maxsize=COMMAND_QUEUE_SIZE)

    receiver_task = asyncio.create_task(
        _command_receiver(websocket, queue),
        name="command-receiver",
    )
    loop_task = asyncio.create_task(
        _simulation_loop(websocket, sim, queue),
        name="simulation-loop",
    )

    try:
        # Block until either task finishes (disconnect or error)
        done, pending = await asyncio.wait(
            {receiver_task, loop_task},
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass
    finally:
        _log.info("Client disconnected: %s", websocket.client)


async def _command_receiver(
    websocket: WebSocket,
    queue: asyncio.Queue[str],
) -> None:
    """
    Reads incoming text frames and enqueues them for the simulation loop.

    Exits on any connection-level error so the parent can cancel the
    paired simulation task and close cleanly.

    Error surface:
    - WebSocketDisconnect : clean close or code-1006 abrupt drop
      (Starlette converts OSError → WebSocketDisconnect internally)
    - RuntimeError        : send/receive on an already-closed socket
                            (Starlette raises this on bad state transitions)
    """
    try:
        async for raw in websocket.iter_text():
            if queue.full():
                queue.get_nowait()  # Drop oldest to make room
            await queue.put(raw)
    except (WebSocketDisconnect, RuntimeError):
        pass  # Signal exit to asyncio.wait()

async def _simulation_loop(
    websocket: WebSocket,
    sim: AircraftSimulation,
    queue: asyncio.Queue[str],
) -> None:
    """
    Ticks the simulation at TICK_INTERVAL and pushes state to the client.

    Each tick:
    1. Drain all pending commands from the queue and apply them.
    2. Advance the simulation by one step.
    3. Serialize and send the new state to the client.
    4. Sleep until the next tick.

    Error surface (send_text):
    - WebSocketDisconnect : connection closed while we were about to send
    - RuntimeError        : state machine violation (e.g. already disconnected)

    json.dumps() is intentionally left unguarded: a serialization failure
    on SimulationState.to_dict() is a programming error, not a runtime one,
    and should surface loudly as an unhandled exception.
    """
    try:
        while True:
            _drain_commands(sim, queue)

            state = sim.step()
            await websocket.send_text(json.dumps(state.to_dict()))

            await asyncio.sleep(TICK_INTERVAL)
    except (WebSocketDisconnect, RuntimeError):
        pass  # Signal exit to asyncio.wait()


def _drain_commands(sim: AircraftSimulation, queue: asyncio.Queue[str]) -> None:
    """
    Applies all currently queued commands to the simulation in FIFO order.
    Non-blocking: only processes commands that are already in the queue.
    """
    while not queue.empty():
        try:
            raw = queue.get_nowait()
            _handle_command(sim, raw)
        except asyncio.QueueEmpty:
            break


def _handle_command(sim: AircraftSimulation, raw: str) -> None:
    """
    Deserializes, validates, and dispatches a single JSON command.

    Pydantic handles three concerns in one call:
    - JSON parsing (replaces manual json.loads + JSONDecodeError guard)
    - Type coercion  (e.g. "value" is guaranteed to be bool)
    - Value validation (intensity must be one of the Literal options)

    Unknown 'type' values and malformed JSON are silently ignored —
    the client is not expected to receive error feedback for bad messages.
    """
    try:
        command = _COMMAND_ADAPTER.validate_json(raw)
    except (ValidationError, ValueError):
        return

    match command:
        case ResetCommand():
            sim.reset()
        case TurbulencePulseCommand():
            sim.trigger_pulse(command.intensity)
        case PauseCommand():
            sim.set_paused(command.value)
        case _:
            pass  # Unknown command type. Ignore silently