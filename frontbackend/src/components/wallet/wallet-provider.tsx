import React from 'react';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Configure Sui network
const networks = {
    devnet: { url: getFullnodeUrl('devnet') },
    testnet: { url: getFullnodeUrl('testnet') },
    mainnet: { url: getFullnodeUrl('mainnet') },
};

const queryClient = new QueryClient();

interface WalletProviderWrapperProps {
    children: React.ReactNode;
}

export const WalletProviderWrapper: React.FC<WalletProviderWrapperProps> = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <SuiClientProvider networks={networks} defaultNetwork="testnet">
                <WalletProvider autoConnect>
                    {children}
                </WalletProvider>
            </SuiClientProvider>
        </QueryClientProvider>
    );
};
