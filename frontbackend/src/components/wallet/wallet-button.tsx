import React from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { motion } from 'motion/react';
import { Wallet } from 'lucide-react';

export const WalletButton: React.FC = () => {
    const account = useCurrentAccount();

    return (
        <div className="relative">
            {account ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-lg border border-amber-400"
                >
                    <Wallet size={16} />
                    <span className="text-sm font-medium">
                        {account.address.slice(0, 6)}...{account.address.slice(-4)}
                    </span>
                </motion.div>
            ) : (
                <div className="wallet-connect-wrapper">
                    <ConnectButton />
                </div>
            )}
        </div>
    );
};
