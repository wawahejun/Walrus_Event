/**
 * Seal SDK Service for Frontend
 * Client-side encryption using @mysten/seal with Sui-based access control
 * 
 * Based on official Seal documentation: https://seal-docs.wal.app/
 */
import { SealClient, SessionKey } from '@mysten/seal';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

// Types
export interface SealEncryptResult {
    encryptedBytes: Uint8Array;
    backupKey: Uint8Array;
}

export interface SealConfig {
    threshold: number;
    packageId: string;
    serverObjectIds: string[];
}

/**
 * Seal Service for decentralized encryption and access control
 * 
 * Features:
 * - Client-side encryption before sending to storage
 * - Sui-based programmable access control
 * - Threshold-based decryption with key servers
 */
class SealService {
    private sealClient: SealClient | null = null;
    private suiClient: SuiClient;
    private sessionKeys: Map<string, SessionKey> = new Map();

    // ⭐ Deployed Seal Contract Configuration ⭐
    // Package ID from deployment: 0x8b15cd618e98808d2bb3b915e4cfe78d406dfd9e2d345cf0a4d208ac04556680
    public readonly SEAL_CONTRACT = {
        packageId: '0x8b15cd618e98808d2bb3b915e4cfe78d406dfd9e2d345cf0a4d208ac04556680',
        moduleName: 'seal_access',
        network: 'testnet' as const,
        explorerUrl: 'https://suiexplorer.com/object/0x8b15cd618e98808d2bb3b915e4cfe78d406dfd9e2d345cf0a4d208ac04556680?network=testnet'
    };

    // Default Seal key server object IDs for testnet
    // Replace with official verified servers from https://seal-docs.wal.app/Pricing/#verified-key-servers
    private readonly DEFAULT_TESTNET_SERVERS = [
        '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
        '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8'
    ];

    constructor() {
        // Initialize Sui client for testnet
        this.suiClient = new SuiClient({
            url: import.meta.env.VITE_SUI_NETWORK_URL || getFullnodeUrl('testnet')
        });

        console.log('🔐 Seal Service initialized');
        console.log(`   Package ID: ${this.SEAL_CONTRACT.packageId}`);
        console.log(`   Network: ${this.SEAL_CONTRACT.network}`);
    }

    /**
     * Initialize Seal client with key servers
     */
    private async initSealClient(serverObjectIds?: string[]): Promise<void> {
        if (this.sealClient) return;

        const servers = serverObjectIds || this.DEFAULT_TESTNET_SERVERS;

        this.sealClient = new SealClient({
            suiClient: this.suiClient,
            serverConfigs: servers.map(id => ({
                objectId: id,
                weight: 1, // Equal weight for all servers
            })),
            verifyKeyServers: false, // Set to true in production
        });

        console.log('✅ Seal client initialized with', servers.length, 'key servers');
    }

    /**
     * Encrypt data using Seal
     * 
     * @param data - Data to encrypt (as Uint8Array)
     * @param packageId - Sui package ID for access control
     * @param objectId - Object ID for access policy
     * @param threshold - Number of key servers needed for decryption (default: 2)
     */
    async encryptData(
        data: Uint8Array,
        packageId: string,
        objectId: string,
        threshold: number = 2
    ): Promise<SealEncryptResult> {
        try {
            await this.initSealClient();

            if (!this.sealClient) {
                throw new Error('Seal client not initialized');
            }

            // Encrypt using Seal SDK
            const result = await this.sealClient.encrypt({
                threshold,
                packageId, // Seal SDK expects hex string
                id: objectId, // Seal SDK expects hex string
                data,
            });

            console.log('✅ Data encrypted with Seal');
            console.log(`   Threshold: ${threshold}, Package: ${packageId.substring(0, 10)}...`);

            return {
                encryptedBytes: result.encryptedObject,
                backupKey: result.key,
            };
        } catch (error) {
            console.error('❌ Seal encryption failed:', error);
            throw error;
        }
    }

    /**
     * Encrypt text data (convenience method)
     */
    async encryptText(
        text: string,
        packageId: string,
        objectId: string,
        threshold: number = 2
    ): Promise<SealEncryptResult> {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        return this.encryptData(data, packageId, objectId, threshold);
    }

    /**
     * Encrypt JSON object (convenience method)
     */
    async encryptJSON(
        obj: any,
        packageId: string,
        objectId: string,
        threshold: number = 2
    ): Promise<SealEncryptResult> {
        const jsonString = JSON.stringify(obj);
        return this.encryptText(jsonString, packageId, objectId, threshold);
    }

    /**
     * Create session key for decryption
     * 
     * @param address - Sui wallet address
     * @param packageId - Package ID for access control
     * @param ttlMin - Time-to-live in minutes (default: 10)
     */
    async createSessionKey(
        address: string,
        packageId: string,
        ttlMin: number = 10
    ): Promise<SessionKey> {
        try {
            // Check if we already have a valid session key
            const existingKey = this.sessionKeys.get(packageId);
            if (existingKey) {
                console.log('♻️ Using existing session key for package', packageId.substring(0, 10) + '...');
                return existingKey;
            }

            // Create new session key
            const sessionKey = await SessionKey.create({
                address,
                packageId, // Seal SDK expects hex string
                ttlMin,
                suiClient: this.suiClient,
            });

            // Store for reuse
            this.sessionKeys.set(packageId, sessionKey);

            console.log('✅ Session key created');
            console.log(`   Address: ${address.substring(0, 10)}...`);
            console.log(`   TTL: ${ttlMin} minutes`);

            return sessionKey;
        } catch (error) {
            console.error('❌ Session key creation failed:', error);
            throw error;
        }
    }

    /**
     * Sign session key with wallet
     * 
     * @param sessionKey - Session key to sign
     * @param signPersonalMessage - Function to sign message with wallet
     */
    async signSessionKey(
        sessionKey: SessionKey,
        signPersonalMessage: (message: Uint8Array) => Promise<{ signature: string }>
    ): Promise<void> {
        try {
            const message = sessionKey.getPersonalMessage();
            const { signature } = await signPersonalMessage(message);
            sessionKey.setPersonalMessageSignature(signature);

            console.log('✅ Session key signed by user wallet');
        } catch (error) {
            console.error('❌ Session key signing failed:', error);
            throw error;
        }
    }

    /**
     * Decrypt data using Seal with access control validation
     * 
     * @param encryptedBytes - Encrypted data
     * @param sessionKey - Initialized and signed session key
     * @param approvalTx - Sui transaction that calls seal_approve function
     */
    async decryptData(
        encryptedBytes: Uint8Array,
        sessionKey: SessionKey,
        approvalTx: Transaction
    ): Promise<Uint8Array> {
        try {
            await this.initSealClient();

            if (!this.sealClient) {
                throw new Error('Seal client not initialized');
            }

            // Build transaction bytes for access control validation
            const txBytes = await approvalTx.build({
                client: this.suiClient,
                onlyTransactionKind: true,
            });

            // Decrypt with Seal (validates access control on-chain)
            const decryptedBytes = await this.sealClient.decrypt({
                data: encryptedBytes,
                sessionKey,
                txBytes,
            });

            console.log('✅ Data decrypted successfully');
            return decryptedBytes;
        } catch (error) {
            console.error('❌ Seal decryption failed:', error);
            throw error;
        }
    }

    /**
     * Decrypt text data (convenience method)
     */
    async decryptText(
        encryptedBytes: Uint8Array,
        sessionKey: SessionKey,
        approvalTx: Transaction
    ): Promise<string> {
        const decryptedBytes = await this.decryptData(encryptedBytes, sessionKey, approvalTx);
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBytes);
    }

    /**
     * Decrypt JSON object (convenience method)
     */
    async decryptJSON(
        encryptedBytes: Uint8Array,
        sessionKey: SessionKey,
        approvalTx: Transaction
    ): Promise<any> {
        const decryptedText = await this.decryptText(encryptedBytes, sessionKey, approvalTx);
        return JSON.parse(decryptedText);
    }

    /**
     * Create approval transaction for event access
     * 
     * This should call your Move package's seal_approve function
     * 
     * @param packageId - Your Sui package ID
     * @param moduleName - Module name (e.g., "event_access")
     * @param eventId - Event ID to check access for
     * @param userAddress - User's Sui address
     */
    createApprovalTransaction(
        packageId: string,
        moduleName: string,
        eventId: string,
        userAddress: string
    ): Transaction {
        const tx = new Transaction();

        // Call your seal_approve function in Move
        // Example: package::module::seal_approve(event_id, user_address)
        tx.moveCall({
            target: `${packageId}::${moduleName}::seal_approve`,
            arguments: [
                tx.pure.string(eventId),
                tx.pure.address(userAddress),
            ],
        });

        return tx;
    }

    /**
     * Upload encrypted data to Walrus storage
     * 
     * @param encryptedBytes - Encrypted data to upload
     * @returns Blob ID from Walrus
     */
    async uploadToWalrus(encryptedBytes: Uint8Array): Promise<string> {
        try {
            const walrusUrl = import.meta.env.VITE_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';

            // Convert Uint8Array to proper format for fetch
            const blob = new Blob([new Uint8Array(encryptedBytes)], {
                type: 'application/octet-stream'
            });

            const response = await fetch(`${walrusUrl}/v1/store`, {
                method: 'PUT',
                body: blob,
            });

            if (!response.ok) {
                throw new Error(`Walrus upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            const blobId = result.newlyCreated?.blobObject?.blobId || result.alreadyCertified?.blobId;

            console.log('✅ Encrypted data uploaded to Walrus');
            console.log(`   Blob ID: ${blobId}`);

            return blobId;
        } catch (error) {
            console.error('❌ Walrus upload failed:', error);
            throw error;
        }
    }

    /**
     * Download encrypted data from Walrus
     */
    async downloadFromWalrus(blobId: string): Promise<Uint8Array> {
        try {
            const walrusUrl = import.meta.env.VITE_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';

            const response = await fetch(`${walrusUrl}/v1/${blobId}`);

            if (!response.ok) {
                throw new Error(`Walrus download failed: ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return new Uint8Array(arrayBuffer);
        } catch (error) {
            console.error('❌ Walrus download failed:', error);
            throw error;
        }
    }

    /**
     * Clear all session keys
     */
    clearSessionKeys(): void {
        this.sessionKeys.clear();
        console.log('🧹 All session keys cleared');
    }
}

// Singleton instance
let sealService: SealService | null = null;

export const getSealService = (): SealService => {
    if (!sealService) {
        sealService = new SealService();
    }
    return sealService;
};

// Export default instance
export default getSealService();
