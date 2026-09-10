from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.stream_manager import stream_manager

router = APIRouter()

class ConfigureStreamRequest(BaseModel):
    bus_id: str
    stream_type: str = "RTSP_IP_CAMERA"
    video_url: str
    ais140_url: Optional[str] = "mqtt://ais140.transport.tn.gov.in:1883"
    sampling_fps: Optional[float] = 30.0

@router.get("/")
def get_active_streams():
    """Returns all active zero-hardware bus camera & telematics streams."""
    return stream_manager.get_streams()

@router.post("/configure")
def configure_stream(req: ConfigureStreamRequest):
    """Registers a live RTSP / HTTP video feed and AIS-140 telematics source."""
    res = stream_manager.configure_stream(
        bus_id=req.bus_id,
        stream_type=req.stream_type,
        video_url=req.video_url,
        ais140_url=req.ais140_url or "mqtt://ais140.transport.tn.gov.in:1883",
        sampling_fps=req.sampling_fps or 30.0
    )
    return res
