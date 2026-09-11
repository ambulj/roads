from fastapi import APIRouter, Response, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import os
import shutil
import uuid
from pathlib import Path
from app.services.stream_manager import stream_manager

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

class ConfigureStreamRequest(BaseModel):
    bus_id: str
    stream_type: str = "RTSP_IP_CAMERA"
    video_url: str
    ais140_url: Optional[str] = "mqtt://ais140.transport.tn.gov.in:1883"
    sampling_fps: Optional[float] = 30.0
    dvr_channels: Optional[int] = 4
    dvr_ip: Optional[str] = None

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
        sampling_fps=req.sampling_fps or 30.0,
        dvr_channels=req.dvr_channels or 4,
        dvr_ip=req.dvr_ip
    )
    return res

@router.post("/upload")
async def upload_stream_media(
    file: UploadFile = File(...),
    bus_id: str = Form("BUS-TN01-1042"),
    channel: int = Form(1),
    auto_ingest: bool = Form(True)
):
    """
    Uploads a video or photo file to replace the camera feed.
    The system processes ONLY this file for the selected bus & channel,
    running real computer vision detection on the actual pixels,
    looping the video continuously or serving the photo continuously.
    """
    filename = file.filename or "upload"
    ext = os.path.splitext(filename)[1].lower()
    
    video_exts = {".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"}
    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    
    if ext in video_exts:
        media_type = "video"
    elif ext in image_exts:
        media_type = "image"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Supported video formats: MP4, MOV, AVI, WEBM. Supported images: JPG, PNG, WEBP."
        )

    file_id = uuid.uuid4().hex[:8]
    safe_name = f"{file_id}_{filename.replace(' ', '_')}"
    target_path = UPLOAD_DIR / safe_name
    
    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    result = stream_manager.configure_uploaded_media(
        bus_id=bus_id,
        file_path=str(target_path),
        media_type=media_type,
        channel=channel,
        auto_ingest=auto_ingest
    )
    return result

@router.post("/reset/{bus_id}")
def reset_stream(bus_id: str, channel: int = 1):
    """Reverts an uploaded video or photo feed back to the standard RTSP/IP camera feed."""
    return stream_manager.reset_stream(bus_id, channel=channel)

@router.get("/detections/{bus_id}")
def get_stream_detections(bus_id: str, channel: int = 1):
    """Returns the live CV road hazard detections identified on the active frame."""
    return stream_manager.get_detections(bus_id, channel=channel)

@router.get("/live/{bus_id}")
def get_live_mjpeg_stream(bus_id: str, channel: int = 1):
    """
    Direct Real-Time MJPEG Stream for zero-plugin HTML <img> and <video> browser playback.
    Streams directly from the background RTSP worker thread for specified channel (CH1 to CH4).
    """
    return StreamingResponse(
        stream_manager.generate_mjpeg_stream(bus_id, channel=channel),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/snapshot/{bus_id}")
def get_live_snapshot(bus_id: str, channel: int = 1):
    """Returns latest captured pristine JPEG frame from the active RTSP feed for specified channel."""
    jpeg_bytes = stream_manager.get_snapshot(bus_id, channel=channel)
    return Response(content=jpeg_bytes, media_type="image/jpeg")

@router.post("/analyze/{bus_id}")
def analyze_live_keyframe(bus_id: str, channel: int = 1):
    """
    Captures live frame from RTSP stream channel and executes instant YOLO AI perception.
    Returns detected defects, bounding boxes, and IRC:35 road audit compliance.
    """
    return stream_manager.analyze_live_keyframe(bus_id, channel=channel)

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


