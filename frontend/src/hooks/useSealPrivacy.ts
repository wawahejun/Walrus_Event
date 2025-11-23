/**
 * React Hook for Seal Privacy Features
 * Provides easy-to-use privacy operations using official @mysten/seal SDK
 */
import { useState, useCallback } from 'react';
import sealService, { SealEncryptResult } from '../services/sealService';
import { SessionKey } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';

export const useSealPrivacy = () => {
    const [isEncrypting, setIsEncrypting] = useState(false);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);

    /**
     * Encrypt JSON data before submission
     */
    const encryptData = useCallback(async (
        data: any,
        packageId: string,
        objectId: string,
        threshold: number = 2
    ): Promise<SealEncryptResult | null> => {
        setIsEncrypting(true);
        setLastError(null);

        try {
            const result = await sealService.encryptJSON(data, packageId, objectId, threshold);
            return result;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Encryption failed';
            setLastError(errorMsg);
            console.error('Data encryption failed:', error);
            return null;
        } finally {
            setIsEncrypting(false);
        }
    }, []);

    /**
     * Decrypt JSON data
     */
    const decryptData = useCallback(async (
        encryptedBytes: Uint8Array,
        sessionKey: SessionKey,
        approvalTx: Transaction
    ): Promise<any | null> => {
        setIsDecrypting(true);
        setLastError(null);

        try {
            const decrypted = await sealService.decryptJSON(encryptedBytes, sessionKey, approvalTx);
            return decrypted;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Decryption failed';
            setLastError(errorMsg);
            console.error('Data decryption failed:', error);
            return null;
        } finally {
            setIsDecrypting(false);
        }
    }, []);

    /**
     * Create and sign session key for decryption
     */
    const createSessionKey = useCallback(async (
        address: string,
        packageId: string,
        signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>,
        ttlMin: number = 10
    ): Promise<SessionKey | null> => {
        setLastError(null);

        try {
            // Create session key
            const sessionKey = await sealService.createSessionKey(address, packageId, ttlMin);

            // Sign with wallet
            await sealService.signSessionKey(sessionKey, signPersonalMessage);

            return sessionKey;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Session key creation failed';
            setLastError(errorMsg);
            console.error('Session key creation failed:', error);
            return null;
        }
    }, []);

    /**
     * Upload encrypted data to Walrus
     */
    const uploadToWalrus = useCallback(async (encryptedBytes: Uint8Array): Promise<string | null> => {
        try {
            const blobId = await sealService.uploadToWalrus(encryptedBytes);
            return blobId;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Upload failed';
            setLastError(errorMsg);
            console.error('Walrus upload failed:', error);
            return null;
        }
    }, []);

    /**
     * Download encrypted data from Walrus
     */
    const downloadFromWalrus = useCallback(async (blobId: string): Promise<Uint8Array | null> => {
        try {
            const data = await sealService.downloadFromWalrus(blobId);
            return data;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Download failed';
            setLastError(errorMsg);
            console.error('Walrus download failed:', error);
            return null;
        }
    }, []);

    /**
     * Create approval transaction for access control
     */
    const createApprovalTx = useCallback((
        packageId: string,
        moduleName: string,
        eventId: string,
        userAddress: string
    ): Transaction => {
        return sealService.createApprovalTransaction(packageId, moduleName, eventId, userAddress);
    }, []);

    /**
     * Full workflow: Encrypt and upload to Walrus
     */
    const encryptAndUpload = useCallback(async (
        data: any,
        packageId: string,
        objectId: string,
        threshold: number = 2
    ): Promise<{ blobId: string; backupKey: Uint8Array } | null> => {
        try {
            // Encrypt
            const encrypted = await encryptData(data, packageId, objectId, threshold);
            if (!encrypted) return null;

            // Upload to Walrus
            const blobId = await uploadToWalrus(encrypted.encryptedBytes);
            if (!blobId) return null;

            return {
                blobId,
                backupKey: encrypted.backupKey,
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Encrypt and upload failed';
            setLastError(errorMsg);
            console.error('Encrypt and upload failed:', error);
            return null;
        }
    }, [encryptData, uploadToWalrus]);

    /**
     * Full workflow: Download and decrypt from Walrus
     */
    const downloadAndDecrypt = useCallback(async (
        blobId: string,
        sessionKey: SessionKey,
        approvalTx: Transaction
    ): Promise<any | null> => {
        try {
            // Download from Walrus
            const encryptedBytes = await downloadFromWalrus(blobId);
            if (!encryptedBytes) return null;

            // Decrypt
            const decrypted = await decryptData(encryptedBytes, sessionKey, approvalTx);
            return decrypted;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Download and decrypt failed';
            setLastError(errorMsg);
            console.error('Download and decrypt failed:', error);
            return null;
        }
    }, [downloadFromWalrus, decryptData]);

    /**
     * Clear all session keys
     */
    const clearSessionKeys = useCallback(() => {
        sealService.clearSessionKeys();
    }, []);

    return {
        // State
        isEncrypting,
        isDecrypting,
        lastError,

        // Core operations
        encryptData,
        decryptData,
        createSessionKey,

        // Walrus operations
        uploadToWalrus,
        downloadFromWalrus,

        // Utilities
        createApprovalTx,

        // Workflows
        encryptAndUpload,
        downloadAndDecrypt,

        // Management
        clearSessionKeys,
    };
};

