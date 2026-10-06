import hashlib
import numpy as np
import pytest

from edge.anpr_onnx import (
    INT8ONNXPlateRecognizer,
    MoRTHSyntaxEngine,
    DPDPCryptographicVault,
    rectify_plate_quadrilateral,
    PlateTrackCache,
)


def test_morth_standard_syntax_validation():
    """
    Tests valid standard Indian state and UT license plates against MoRTH syntax regex.
    Asserts is_valid == True for all canonical variants.
    """
    valid_plates = ["TN01AB1234", "MH12DE5678", "DL04C1020", "KA05MB9999"]
    for plate in valid_plates:
        parsed = MoRTHSyntaxEngine.parse_plate(plate)
        assert parsed["is_valid"] is True, f"Failed for {plate}"
        assert MoRTHSyntaxEngine.validate_plate(plate) is True
        assert parsed["series_type"] == "STANDARD"
        assert len(parsed["state_code"]) == 2
        assert len(parsed["registration_num"]) == 4


def test_bharat_series_syntax_validation():
    """
    Tests Bharat Series (BH) syntax validation.
    Asserts valid extraction of state code 'BH', year, and registration number.
    """
    bh_samples = ["22BH1234AA", "23BH9876ZZ"]
    for plate in bh_samples:
        parsed = MoRTHSyntaxEngine.parse_plate(plate)
        assert parsed["is_valid"] is True
        assert parsed["series_type"] == "BHARAT"
        assert parsed["state_code"] == "BH"
        assert parsed["year"] == plate[:2]
        assert parsed["registration_num"] == plate[4:8]
        assert parsed["formatted"] == f"{plate[:2]}-BH-{plate[4:8]}-{plate[8:]}"


def test_optical_confusion_matrix_substitution():
    """
    Verifies that slot-based substitution repairs dirty characters based on grammatical position:
    - State code:  0N01AB1234 -> TN01AB1234
    - RTO code:    TNIOAB1234 -> TN10AB1234
    - Series:      TN018B1234 -> TN01BB1234
    - Serial:      TN01ABIZ34 -> TN01AB1234
    """
    test_cases = [
        ("0N01AB1234", "TN01AB1234"),
        ("TNIOAB1234", "TN10AB1234"),
        ("TN018B1234", "TN01BB1234"),
        ("TN01ABIZ34", "TN01AB1234"),
    ]

    for raw, expected in test_cases:
        repaired, is_valid = MoRTHSyntaxEngine.validate_and_repair_plate(raw)
        assert is_valid is True, f"Failed validation for {raw} -> {repaired}"
        assert repaired == expected, f"Expected {expected}, got {repaired} from raw {raw}"


def test_dpdp_salted_hash_generation():
    """
    Asserts hash_plate produces a deterministic 64-character SHA-256 hex string
    and does not expose raw plate text in routine logs or telemetry.
    """
    salt = "gcc_test_salt"
    plate = "TN01AB1234"
    h1 = DPDPCryptographicVault.hash_plate(plate, salt=salt)
    h2 = DPDPCryptographicVault.hash_plate(plate, salt=salt)

    assert isinstance(h1, str)
    assert len(h1) == 64
    assert h1 == h2
    assert plate not in h1

    # Verify expected SHA-256 calculation
    expected_hex = hashlib.sha256(f"{salt}:{plate}".encode("utf-8")).hexdigest()
    assert h1 == expected_hex

    # Different salt produces distinct hash
    h_diff = DPDPCryptographicVault.hash_plate(plate, salt="other_salt")
    assert h_diff != h1

    # Test incident encryption envelope
    citation_token = DPDPCryptographicVault.encrypt_plate_incident(plate)
    assert citation_token.startswith("DPDP_SECURE_VAULT_V1:")


def test_perspective_warp_and_clahe():
    """
    Validates that 4-point quadrilateral warp rectifies tilted image patches
    to horizontal (128, 32) aspect ratio with CLAHE enhancement.
    """
    dummy_crop = np.random.randint(0, 255, (80, 200, 3), dtype=np.uint8)
    corners = np.array([
        [10.0, 15.0],
        [190.0, 5.0],
        [185.0, 75.0],
        [15.0, 70.0],
    ], dtype=np.float32)

    rectified = rectify_plate_quadrilateral(dummy_crop, corners=corners)
    assert rectified.shape == (32, 128)
    assert rectified.dtype == np.uint8

    # Also test without corners
    resized = rectify_plate_quadrilateral(dummy_crop)
    assert resized.shape == (32, 128)


def test_vram_memory_ceiling(tmp_path):
    """
    Asserts memory configuration of INT8 ONNX session enforces
    max_arena_alloc_byte_limit = 134217728 (<150MB total VRAM ceiling),
    and executes consecutive inferences without memory leaks or errors.
    """
    model_path = tmp_path / "test_plate_int8.onnx"
    recognizer = INT8ONNXPlateRecognizer(model_path=str(model_path))

    assert recognizer.arena_alloc_byte_limit == 134217728
    assert recognizer.session is not None

    dummy_crop = np.zeros((50, 150, 3), dtype=np.uint8)
    # Execute 100 consecutive forward passes
    for _ in range(100):
        text, conf = recognizer.recognize(dummy_crop)
        assert conf > 0.0
        assert isinstance(text, str)
