/**
 * useSuiAnchor Hook
 * 
 * Custom hook for anchoring events to Sui blockchain
 * Handles transaction signing and submission
 */

import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

// TODO: Update with actual deployed package ID
const PACKAGE_ID = import.meta.env.VITE_SUI_PACKAGE_ID || '0x0';

interface AnchorResult {
    success: boolean;
    digest?: string;
    error?: string;
}

export function useSuiAnchor() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isAnchoring, setIsAnchoring] = useState(false);

    /**
     * Anchor event to Sui blockchain
     * 
     * @param eventId - Event unique identifier
     * @param eventHash - SHA256 hash of event data (64 hex chars)
     * @param blobId - Walrus blob ID
     * @returns Promise with transaction digest
     */
    const anchorToBlockchain = async (
        eventId: string,
        eventHash: string,
        blobId: string
    ): Promise<AnchorResult> => {
        if (!account) {
            return {
                success: false,
                error: 'Wallet not connected'
            };
        }

        setIsAnchoring(true);

        try {
            const tx = new Transaction();

            // If contract is deployed, call the Move function
            if (PACKAGE_ID !== '0x0') {
                tx.moveCall({
                    target: `${PACKAGE_ID}::event_anchor::anchor_event`,
                    arguments: [
                        tx.pure.string(eventId),
                        tx.pure.string(eventHash),
                        tx.pure.string(blobId),
                    ],
                });
            } else {
                // Placeholder: Simple transfer until contract is deployed
                // This creates an on-chain record
                tx.transferObjects(
                    [tx.gas],
                    account.address
                );
            }

            return new Promise((resolve) => {
                signAndExecute(
                    {
                        transaction: tx,
                    },
                    {
                        onSuccess: (result) => {
                            console.log('✅ Sui transaction successful:', result.digest);
                            setIsAnchoring(false);
                            resolve({
                                success: true,
                                digest: result.digest,
                            });
                        },
                        onError: (error) => {
                            console.error('❌ Sui transaction error:', error);
                            setIsAnchoring(false);
                            resolve({
                                success: false,
                                error: error.message || 'Transaction failed',
                            });
                        },
                    }
                );
            });
        } catch (error: any) {
            setIsAnchoring(false);
            return {
                success: false,
                error: error.message || 'Unknown error',
            };
        }
    };

    return {
        anchorToBlockchain,
        isAnchoring,
        isWalletConnected: !!account,
    };
}
