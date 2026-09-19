from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional
import numpy as np
import cv2
import base64
from app.services.privacy_engine import privacy_engine

router = APIRouter()

class PrivacyConfigRequest(BaseModel):
    enabled: Optional[bool] = None
    blur_mode: Optional[str] = "GAUSSIAN"  # "GAUSSIAN" | "PIXELATE" | "BLACKOUT"
    blur_intensity: Optional[int] = 45

@router.get("/status")
def get_privacy_status():
    """
    Returns the current privacy engine telemetry, total faces redacted,
    blur mode, and DPDP Act 2023 compliance status.
    """
    return privacy_engine.get_status()

@router.post("/config")
def update_privacy_config(req: PrivacyConfigRequest):
    """
    Updates the privacy engine configuration (toggle on/off, change blur style, change intensity).
    """
    return privacy_engine.update_config(
        enabled=req.enabled,
        blur_mode=req.blur_mode,
        blur_intensity=req.blur_intensity
    )

@router.post("/anonymize")
async def anonymize_uploaded_image(
    file: UploadFile = File(...),
    blur_mode: Optional[str] = Form("GAUSSIAN"),
    burn_badge: Optional[bool] = Form(True)
):
    """
    Directly tests face redaction on an uploaded image, returning the sanitized image in base64.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file format")

    if blur_mode and blur_mode.upper() in ("GAUSSIAN", "PIXELATE", "BLACKOUT"):
        privacy_engine.blur_mode = blur_mode.upper()

    sanitized, metrics = privacy_engine.anonymize_frame(img, force_blur=True, burn_privacy_badge=burn_badge)
    
    _, buffer = cv2.imencode('.jpg', sanitized, [cv2.IMWRITE_JPEG_QUALITY, 85])
    b64_str = base64.b64encode(buffer).decode('utf-8')

    return {
        "success": True,
        "metrics": metrics,
        "filename": file.filename,
        "anonymized_b64": f"data:image/jpeg;base64,{b64_str}"
    }
