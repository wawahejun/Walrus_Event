"""
Privacy Service - High-level privacy protection operations
Provides user profile encryption, preference management, and GDPR compliance
"""
from typing import Dict, Any, Optional, List
from datetime import datetime
import logging

from app.core.seal_client import get_seal_client
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)


class PrivacyService:
    """Service for managing user privacy and data protection"""
    
    def __init__(self):
        self.seal_client = get_seal_client()
    
    async def encrypt_user_profile(
        self,
        user_id: str,
        profile_data: Dict[str, Any]
    ) -> str:
        """
        Encrypt user profile data
        
        Args:
            user_id: User identifier
            profile_data: Profile data to encrypt (email, phone, etc.)
            
        Returns:
            Encrypted profile string
        """
        try:
            # Add metadata
            enriched_data = {
                "user_id": user_id,
                "data": profile_data,
                "encrypted_at": datetime.utcnow().isoformat(),
                "version": "1.0"
            }
            
            # Encrypt using Seal
            encrypted = await self.seal_client.encrypt_user_data(enriched_data)
            
            logger.info(f"Encrypted profile for user {user_id}")
            return encrypted
            
        except Exception as e:
            logger.error(f"Profile encryption failed for user {user_id}: {e}")
            raise
    
    async def decrypt_user_profile(
        self,
        encrypted_profile: str
    ) -> Dict[str, Any]:
        """
        Decrypt user profile data
        
        Args:
            encrypted_profile: Encrypted profile string
            
        Returns:
            Decrypted profile data
        """
        try:
            decrypted = await self.seal_client.decrypt_user_data(encrypted_profile)
            
            # Extract actual profile data
            profile_data = decrypted.get("data", {})
            
            logger.info("Decrypted user profile")
            return profile_data
            
        except Exception as e:
            logger.error(f"Profile decryption failed: {e}")
            raise
    
    async def protect_participation_history(
        self,
        user_id: str,
        event_ids: List[str]
    ) -> str:
        """
        Encrypt user's event participation history
        
        Args:
            user_id: User identifier
            event_ids: List of event IDs user participated in
            
        Returns:
            Encrypted history
        """
        try:
            history_data = {
                "user_id": user_id,
                "events": event_ids,
                "count": len(event_ids),
                "last_updated": datetime.utcnow().isoformat()
            }
            
            encrypted = await self.seal_client.encrypt_user_data(history_data)
            
            logger.info(f"Protected participation history for user {user_id}")
            return encrypted
            
        except Exception as e:
            logger.error(f"History protection failed: {e}")
            raise
    
    async def generate_anonymous_identity(
        self,
        user_id: str,
        event_id: str
    ) -> str:
        """
        Generate anonymous identity for event participation
        
        Args:
            user_id: Real user ID
            event_id: Event to participate in
            
        Returns:
            Anonymous credential
        """
        try:
            attributes = {
                "event_id": event_id,
                "can_attend": True,
                "credential_type": "anonymous_participant"
            }
            
            credential = await self.seal_client.generate_anonymous_credential(
                user_id=user_id,
                attributes=attributes
            )
            
            logger.info(f"Generated anonymous identity for user {user_id} at event {event_id}")
            return credential
            
        except Exception as e:
            logger.error(f"Anonymous identity generation failed: {e}")
            raise
    
    async def verify_attendance_proof(
        self,
        zk_proof: Dict[str, Any],
        event_id: str
    ) -> bool:
        """
        Verify ZK proof of attendance without revealing identity
        
        Args:
            zk_proof: Zero-knowledge proof
            event_id: Event ID to verify
            
        Returns:
            True if proof is valid
        """
        try:
            public_inputs = {"event_id": event_id}
            
            is_valid = await self.seal_client.verify_zk_proof(
                proof=zk_proof,
                public_inputs=public_inputs
            )
            
            logger.info(f"Attendance proof verification: {is_valid}")
            return is_valid
            
        except Exception as e:
            logger.error(f"Proof verification failed: {e}")
            return False
    
    async def anonymize_user_data(
        self,
        data: Dict[str, Any],
        fields_to_anonymize: List[str]
    ) -> Dict[str, Any]:
        """
        Anonymize specific fields in user data (GDPR compliance)
        
        Args:
            data: Original data
            fields_to_anonymize: List of field names to anonymize
            
        Returns:
            Anonymized data
        """
        try:
            anonymized = data.copy()
            
            for field in fields_to_anonymize:
                if field in anonymized:
                    # Replace with anonymized value
                    if isinstance(anonymized[field], str):
                        anonymized[field] = "[REDACTED]"
                    elif isinstance(anonymized[field], (int, float)):
                        anonymized[field] = 0
                    else:
                        anonymized[field] = None
            
            logger.info(f"Anonymized {len(fields_to_anonymize)} fields")
            return anonymized
            
        except Exception as e:
            logger.error(f"Anonymization failed: {e}")
            raise
    
    async def export_user_data(
        self,
        user_id: str,
        encrypted_profile: Optional[str] = None,
        encrypted_history: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Export all user data (GDPR right to data portability)
        
        Args:
            user_id: User identifier
            encrypted_profile: Encrypted profile (if available)
            encrypted_history: Encrypted history (if available)
            
        Returns:
            Exported data package
        """
        try:
            export_package = {
                "user_id": user_id,
                "exported_at": datetime.utcnow().isoformat(),
                "data": {}
            }
            
            # Decrypt and include profile
            if encrypted_profile:
                profile = await self.decrypt_user_profile(encrypted_profile)
                export_package["data"]["profile"] = profile
            
            # Decrypt and include history
            if encrypted_history:
                history = await self.seal_client.decrypt_user_data(encrypted_history)
                export_package["data"]["participation_history"] = history
            
            logger.info(f"Exported data for user {user_id}")
            return export_package
            
        except Exception as e:
            logger.error(f"Data export failed: {e}")
            raise
    
    async def delete_user_data(
        self,
        user_id: str
    ) -> bool:
        """
        Delete all user data (GDPR right to be forgotten)
        
        Args:
            user_id: User identifier
            
        Returns:
            True if successful
        """
        try:
            # Note: Actual deletion should be handled in the database layer
            # This is a placeholder for privacy-related cleanup
            
            logger.info(f"Initiated data deletion for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Data deletion failed: {e}")
            return False
    
    async def create_privacy_audit_log(
        self,
        user_id: str,
        action: str,
        details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create audit log entry for privacy-related actions
        
        Args:
            user_id: User identifier
            action: Action performed (e.g., "data_encrypted", "proof_verified")
            details: Additional details
            
        Returns:
            Audit log entry
        """
        try:
            log_entry = {
                "user_id": user_id,
                "action": action,
                "timestamp": datetime.utcnow().isoformat(),
                "details": details or {}
            }
            
            # In production, save to audit log database
            logger.info(f"Privacy audit: {action} for user {user_id}")
            return log_entry
            
        except Exception as e:
            logger.error(f"Audit log creation failed: {e}")
            raise


# Singleton instance
_privacy_service: Optional[PrivacyService] = None


def get_privacy_service() -> PrivacyService:
    """Get privacy service singleton instance"""
    global _privacy_service
    if _privacy_service is None:
        _privacy_service = PrivacyService()
    return _privacy_service
