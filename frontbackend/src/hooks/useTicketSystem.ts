import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useState } from 'react';

// Get Package ID from environment
const PACKAGE_ID = import.meta.env.VITE_SUI_PACKAGE_ID || '0x0';

export function useTicketSystem() {
    const account = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [isMinting, setIsMinting] = useState(false);
    const [isCheckingIn, setIsCheckingIn] = useState(false);
    const [isVerifyingZK, setIsVerifyingZK] = useState(false);

    // Mint a free ticket
    const mintTicket = async (eventId: string, isSoulbound: boolean = false) => {
        if (!account) return;
        setIsMinting(true);

        try {
            const tx = new Transaction();

            tx.moveCall({
                target: `${PACKAGE_ID}::ticket_system::mint_ticket`,
                arguments: [
                    tx.pure.string(eventId),
                    tx.pure.u64(1), // ticket_number
                    tx.pure.bool(isSoulbound),
                    tx.pure.string("walrus://ticket-metadata"),
                ],
            });

            return await executeTransaction(tx);
        } catch (error) {
            console.error('Mint failed:', error);
            throw error;
        } finally {
            setIsMinting(false);
        }
    };

    // Buy a paid ticket
    const buyTicket = async (eventId: string, price: number, organizer: string, imageUrl: string = "walrus://premium-ticket") => {
        if (!account) return;
        setIsMinting(true);

        try {
            console.log('=== buyTicket DEBUG ===');
            console.log('Event ID:', eventId);
            console.log('Price (MIST):', price);
            console.log('Price (SUI):', price / 1000000000);
            console.log('Organizer:', organizer);
            console.log('Image URL:', imageUrl);

            const tx = new Transaction();

            // Split coin for payment
            const [coin] = tx.splitCoins(tx.gas, [price]);
            console.log('Coin split for amount:', price, 'MIST');

            tx.moveCall({
                target: `${PACKAGE_ID}::ticket_system::buy_new_ticket`,
                arguments: [
                    tx.pure.string(eventId),
                    tx.pure.u64(Date.now()), // Random ticket number
                    tx.pure.bool(true), // Paid tickets are soulbound by default
                    tx.pure.string(imageUrl),
                    coin,
                    tx.pure.u64(price),
                    tx.pure.address(organizer),
                ],
            });

            console.log('Transaction built, executing...');
            return await executeTransaction(tx);
        } catch (error) {
            console.error('Purchase failed:', error);
            throw error;
        } finally {
            setIsMinting(false);
        }
    };

    // Burn ticket
    const burnTicket = async (ticketId: string) => {
        if (!account) return;
        setIsMinting(true);

        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::ticket_system::burn_ticket`,
                arguments: [tx.object(ticketId)],
            });
            return await executeTransaction(tx);
        } catch (error) {
            console.error('Burn failed:', error);
            throw error;
        } finally {
            setIsMinting(false);
        }
    };

    // Get user tickets
    const getUserTickets = async (address: string) => {
        // This requires access to suiClient. 
        // We can assume it's available via useSuiClient hook in the component, 
        // or we can instantiate it here if we import it.
        // For now, let's return the function signature and let the component handle the client call 
        // or inject the client.
        // Actually, let's use the client from the hook context if possible.
        // The useTicketSystem hook doesn't currently use useSuiClient.
        // Let's add it.
    };

    // Generate and Verify ZK Proof
    const generateAndVerifyZKProof = async (ticketId: string) => {
        if (!account) return;
        setIsVerifyingZK(true);

        try {
            // 1. Simulate ZK Proof Generation (off-chain)
            console.log("Generating ZK Proof...");
            await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate computation
            const mockProof = new TextEncoder().encode("mock_zk_proof_" + Date.now());

            // 2. Submit Proof to Blockchain for Verification
            const tx = new Transaction();

            tx.moveCall({
                target: `${PACKAGE_ID}::ticket_system::verify_zk_proof`,
                arguments: [
                    tx.object(ticketId),
                    tx.pure.vector('u8', mockProof),
                ],
            });

            const result = await executeTransaction(tx);
            console.log("ZK Proof Verified on-chain:", result);
            return result;
        } catch (error) {
            console.error('ZK Verification failed:', error);
            throw error;
        } finally {
            setIsVerifyingZK(false);
        }
    };

    // Helper to execute transaction
    const executeTransaction = (tx: Transaction) => {
        return new Promise((resolve, reject) => {
            signAndExecute(
                { transaction: tx },
                {
                    onSuccess: (result) => resolve(result),
                    onError: (error) => reject(error),
                }
            );
        });
    };

    return {
        mintTicket,
        buyTicket,
        burnTicket,
        generateAndVerifyZKProof,
        isMinting,
        isVerifyingZK
    };
}
