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

@router.get("/probe")
def probe_stream(url: str):
    """Diagnoses an RTSP / IP stream URL for TCP reachability, credentials, and video decoding."""
    import socket
    import cv2
    from urllib.parse import urlparse
    
    clean_url = url.strip()
    if clean_url.isdigit():
        cap = cv2.VideoCapture(int(clean_url))
        opened = cap.isOpened()
        if opened:
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()
            return {"reachable": True, "resolution": f"{w}x{h}", "message": f"Local video device {clean_url} is active and ready."}
        return {"reachable": False, "message": f"Local video device {clean_url} is busy or not found."}

    parsed = urlparse(clean_url)
    host = parsed.hostname
    port = parsed.port or 554

    if host:
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(2.5)
            res = sock.connect_ex((host, port))
            sock.close()
            if res != 0:
                return {
                    "reachable": False,
                    "tcp_port_open": False,
                    "message": f"Could not reach {host}:{port}. Verify that your PC and DVR/Camera are on the SAME local network, and TCP Port {port} is enabled."
                }
        except Exception as e:
            return {"reachable": False, "message": f"Network resolution error for {host}: {e}"}

    try:
        cap = cv2.VideoCapture(clean_url)
        if cap.isOpened():
            ret, frame = cap.read()
            w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()
            if ret:
                return {
                    "reachable": True,
                    "tcp_port_open": True,
                    "resolution": f"{w}x{h}",
                    "message": f"Connection verified! Live stream resolution: {w}x{h}."
                }
            else:
                return {
                    "reachable": False,
                    "tcp_port_open": True,
                    "message": "Connected to port 554, but failed to decode video frames. Check username/password authentication or channel number (try subtype=1)."
                }
        else:
            return {
                "reachable": False,
                "tcp_port_open": True,
                "message": "Port 554 open, but RTSP authentication failed. Verify username and password."
            }
    except Exception as e:
        return {"reachable": False, "message": f"RTSP handshake error: {e}"}


