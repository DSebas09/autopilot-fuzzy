import asyncio
import json
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from simulation import AircraftSimulation, DT

logging.basicConfig(level=logging.INFO)
_log = logging.getLogger(__name__)

TICK_INTERVAL: float = DT          # Keeps main.py in sync with simulation.py
COMMAND_QUEUE_SIZE: int = 32       # Max buffered commands before dropping oldest

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
    return {"status": "ok", "message": "Fuzzy autopilot online ✈"}


@app.websocket("/ws/sim")
async def websocket_simulation(websocket: WebSocket) -> None:
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
    try:
        while True:
            _drain_commands(sim, queue)

            state = sim.step()
            await websocket.send_text(json.dumps(state.to_dict()))

            await asyncio.sleep(TICK_INTERVAL)
    except (WebSocketDisconnect, RuntimeError):
        pass  # Signal exit to asyncio.wait()


def _drain_commands(sim: AircraftSimulation, queue: asyncio.Queue[str]) -> None:
    while not queue.empty():
        try:
            raw = queue.get_nowait()
            _handle_command(sim, raw)
        except asyncio.QueueEmpty:
            break


def _handle_command(sim: AircraftSimulation, raw: str) -> None:
    try:
        msg = json.loads(raw)
    except json.JSONDecodeError:
        return

    match msg.get("type"):
        case "reset":
            sim.reset()
        case "turbulence_pulse":
            intensity = msg.get("intensity", "medium")
            if intensity in ("low", "medium", "high"):
                sim.trigger_pulse(intensity)
        case "pause":
            sim.set_paused(bool(msg.get("value", False)))