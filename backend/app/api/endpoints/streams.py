from fastapi import APIRouter, Response, HTTPException
from fastapi.responses import StreamingResponse
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
    """Returns all active real zero-hardware bus camera & telematics streams."""
    return stream_manager.get_streams()

@router.post("/configure")
def configure_stream(req: ConfigureStreamRequest):
    """Registers and connects to a live RTSP / IP / Webcam feed in real-time."""
    res = stream_manager.configure_stream(
        bus_id=req.bus_id,
        stream_type=req.stream_type,
        video_url=req.video_url,
        ais140_url=req.ais140_url or "mqtt://ais140.transport.tn.gov.in:1883",
        sampling_fps=req.sampling_fps or 30.0
    )
    return res

@router.get("/live/{bus_id}")
def get_live_mjpeg_stream(bus_id: str):
    """
    Direct Real-Time MJPEG Stream for zero-plugin HTML <img> and <video> browser playback.
    Streams directly from the background RTSP worker thread.
    """
    return StreamingResponse(
        stream_manager.generate_mjpeg_stream(bus_id),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/snapshot/{bus_id}")
def get_live_snapshot(bus_id: str):
    """Returns latest captured pristine JPEG frame from the active RTSP feed."""
    jpeg_bytes = stream_manager.get_snapshot(bus_id)
    return Response(content=jpeg_bytes, media_type="image/jpeg")

@router.post("/analyze/{bus_id}")
def analyze_live_keyframe(bus_id: str):
    """
    Captures live frame from RTSP stream and executes instant YOLO AI perception.
    Returns detected defects, bounding boxes, and IRC:35 road audit compliance.
    """
    return stream_manager.analyze_live_keyframe(bus_id)

