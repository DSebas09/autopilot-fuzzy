import asyncio
import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from simulation import AircraftSimulation

app = FastAPI(
    title="Diffuse Autopilot",
    description="Fuzzy Logic Autopilot Simulator (Mamdani) - AI Project",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Online diffuse autopilot ✈"}


@app.websocket("/ws/sim")
async def websocket_simulation(websocket: WebSocket):
    await websocket.accept()

    sim = AircraftSimulation()

    try:
        while True:
            try:
                raw = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=0.001
                )
                _handle_command(sim, raw)

            except asyncio.TimeoutError:
                pass

            state = sim.step()

            await websocket.send_text(json.dumps(state.to_dict()))
            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        # Client closed the connection? Normal end, not an error
        pass


def _handle_command(sim: AircraftSimulation, raw: str) -> None:
    try:
        msg = json.loads(raw)
    except json.JSONDecodeError:
        return

    msg_type = msg.get("type")

    if msg_type == "reset":
        sim.reset()

    elif msg_type == "turbulence_pulse":
        intensity = msg.get("intensity", "medium")
        if intensity in ("low", "medium", "high"):
            sim.trigger_pulse(intensity)

    elif msg_type == "pause":
        value = msg.get("value", False)
        sim.set_paused(bool(value))