import React from 'react';
import { Gallery6Demo } from '../blocks/gallery6-demo';

interface HomePageProps {
    onNavigate?: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
    return (
        <div className="h-full w-full overflow-y-auto no-scrollbar bg-background">
            <div className="flex flex-col items-center justify-center min-h-screen py-12">
                <div className="text-center space-y-4 mb-12 px-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        Walrus Events
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-[800px] mx-auto">
                        Your Data, Your Reputation, Your Control. A decentralized event platform powered by Walrus, Seal, and Sui.
                    </p>
                </div>

                <Gallery6Demo onNavigate={onNavigate} />
            </div>
        </div>
    );
};
