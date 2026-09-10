import asyncio
import json
from typing import List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.storage.mock_database import store

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        dead_connections = []
        payload = json.dumps(message)
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception:
                dead_connections.append(connection)

        for dc in dead_connections:
            self.disconnect(dc)

manager = ConnectionManager()

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial snapshot immediately
        initial_payload = {
            "type": "SNAPSHOT",
            "metrics": store.get_metrics(),
            "fleet": store.fleet_nodes,
            "clusters": store.get_clusters(),
            "incidents": store.get_incidents(),
            "audit_logs": store.audit_logs[:10]
        }
        await websocket.send_text(json.dumps(initial_payload))

        while True:
            # Wait for client messages (e.g. mobile dashcam ingests or heartbeat ping)
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "INGEST":
                    ingest_data = msg.get("payload", {})
                    result = store.add_ingest(ingest_data)
                    # Broadcast updated clusters and metrics to all clients
                    await manager.broadcast({
                        "type": "INGEST_BROADCAST",
                        "metrics": store.get_metrics(),
                        "clusters": store.get_clusters(),
                        "latest_log": store.audit_logs[0] if store.audit_logs else None,
                        "ingest_result": result
                    })
                elif msg.get("type") == "INCIDENT":
                    incident_data = msg.get("payload", {})
                    new_inc = store.add_incident(incident_data)
                    await manager.broadcast({
                        "type": "INCIDENT_ALERT",
                        "incident": new_inc,
                        "metrics": store.get_metrics(),
                        "latest_log": store.audit_logs[0] if store.audit_logs else None
                    })
                elif msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

async def simulation_loop():
    """Background task advancing buses and broadcasting 5Hz telemetry pings."""
    while True:
        await asyncio.sleep(2.0)
        if manager.active_connections:
            store.step_simulation()
            await manager.broadcast({
                "type": "TELEMETRY_TICK",
                "fleet": store.fleet_nodes,
                "metrics": store.get_metrics(),
                "latest_log": store.audit_logs[0] if store.audit_logs else None
            })
