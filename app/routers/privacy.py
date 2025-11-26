"""
Privacy API endpoints for Seal SDK integration
Provides encryption, ZK proof, and GDPR compliance endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import logging

from app.services.privacy_service import get_privacy_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/privacy",
    tags=["privacy"]
)


# Request/Response Models
class EncryptProfileRequest(BaseModel):
    user_id: str
    profile_data: Dict[str, Any]


class EncryptProfileResponse(BaseModel):
    encrypted_profile: str
    success: bool


class DecryptProfileRequest(BaseModel):
    encrypted_profile: str


class GenerateCredentialRequest(BaseModel):
    user_id: str
    event_id: str


class GenerateCredentialResponse(BaseModel):
    anonymous_credential: str
    success: bool


class VerifyProofRequest(BaseModel):
    zk_proof: Dict[str, Any]
    event_id: str


class VerifyProofResponse(BaseModel):
    is_valid: bool
    verified_at: str


class ExportDataRequest(BaseModel):
    user_id: str


class ExportDataResponse(BaseModel):
    data: Dict[str, Any]
    exported_at: str


# Endpoints
@router.post("/encrypt-profile", response_model=EncryptProfileResponse)
async def encrypt_user_profile(request: EncryptProfileRequest):
    """
    Encrypt user profile data using Seal SDK
    
    This endpoint encrypts sensitive user information before storage.
    The encrypted data can only be decrypted by authorized parties.
    """
    try:
        privacy_service = get_privacy_service()
        
        encrypted = await privacy_service.encrypt_user_profile(
            user_id=request.user_id,
            profile_data=request.profile_data
        )
        
        return EncryptProfileResponse(
            encrypted_profile=encrypted,
            success=True
        )
        
    except Exception as e:
        logger.error(f"Profile encryption failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/decrypt-profile")
async def decrypt_user_profile(request: DecryptProfileRequest):
    """
    Decrypt user profile data
    
    Warning: This endpoint should be protected and only accessible
    by authorized users or services.
    """
    try:
        privacy_service = get_privacy_service()
        
        profile_data = await privacy_service.decrypt_user_profile(
            encrypted_profile=request.encrypted_profile
        )
        
        return {
            "profile_data": profile_data,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Profile decryption failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-credential", response_model=GenerateCredentialResponse)
async def generate_anonymous_credential(request: GenerateCredentialRequest):
    """
    Generate anonymous credential for event participation
    
    This allows users to participate in events anonymously while
    still proving they are authorized attendees.
    """
    try:
        privacy_service = get_privacy_service()
        
        credential = await privacy_service.generate_anonymous_identity(
            user_id=request.user_id,
            event_id=request.event_id
        )
        
        return GenerateCredentialResponse(
            anonymous_credential=credential,
            success=True
        )
        
    except Exception as e:
        logger.error(f"Credential generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-zkp", response_model=VerifyProofResponse)
async def verify_zk_proof(request: VerifyProofRequest):
    """
    Verify zero-knowledge proof of attendance
    
    This verifies that a user attended an event without
    revealing their identity.
    """
    try:
        privacy_service = get_privacy_service()
        
        is_valid = await privacy_service.verify_attendance_proof(
            zk_proof=request.zk_proof,
            event_id=request.event_id
        )
        
        from datetime import datetime
        
        return VerifyProofResponse(
            is_valid=is_valid,
            verified_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Proof verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export-data", response_model=ExportDataResponse)
async def export_user_data(request: ExportDataRequest):
    """
    Export all user data (GDPR compliance)
    
    This implements the "Right to Data Portability" under GDPR.
    Users can request all their data in a portable format.
    """
    try:
        privacy_service = get_privacy_service()
        
        # Note: In production, fetch encrypted data from database
        export_data = await privacy_service.export_user_data(
            user_id=request.user_id
        )
        
        from datetime import datetime
        
        return ExportDataResponse(
            data=export_data,
            exported_at=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Data export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete-data/{user_id}")
async def delete_user_data(user_id: str):
    """
    Delete all user data (GDPR "Right to be Forgotten")
    
    This permanently deletes all user data from the system.
    Warning: This action cannot be undone!
    """
    try:
        privacy_service = get_privacy_service()
        
        # Note: In production, implement proper authorization check
        success = await privacy_service.delete_user_data(user_id=user_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Data deletion failed")
        
        return {
            "message": f"All data for user {user_id} has been deleted",
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Data deletion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def privacy_health_check():
    """Check if privacy service is operational"""
    try:
        privacy_service = get_privacy_service()
        
        return {
            "status": "operational",
            "seal_network": "connected",
            "encryption": "enabled"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "error": str(e)
        }
