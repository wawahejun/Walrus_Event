import { Gallery6 } from "@/components/ui/gallery6"

const demoData = {
    heading: "Walrus Events Modules",
    demoUrl: "#",
    items: [
        {
            id: "item-1",
            title: "EventForge",
            summary:
                "User-sovereign event management engine. Create events with end-to-end encryption and full data ownership on Walrus.",
            url: "forge",
            image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop",
        },
        {
            id: "item-2",
            title: "ZK-Attend",
            summary:
                "Privacy-preserving attendance verification. Use Zero-Knowledge proofs to verify tickets without revealing your identity.",
            url: "zkentry",
            image: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=2070&auto=format&fit=crop",
        },
        {
            id: "item-3",
            title: "Verifiable Reputation",
            summary:
                "On-chain reputation system using Markov chains and differential privacy. Build portable trust across platforms.",
            url: "reputation",
            image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=2070&auto=format&fit=crop",
        },
        {
            id: "item-4",
            title: "Private Discovery",
            summary:
                "Personalized event recommendations without data collection. Powered by federated learning and ZK matching proofs.",
            url: "discovery",
            image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop",
        },
        {
            id: "item-5",
            title: "ComplianceDAO",
            summary:
                "Automated compliance governance. Privacy as code with DAO-managed rules and ZK audit reports.",
            url: "governance",
            image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2069&auto=format&fit=crop",
        },
    ],
};

interface Gallery6DemoProps {
    onNavigate?: (page: string) => void;
}

function Gallery6Demo({ onNavigate }: Gallery6DemoProps) {
    return <Gallery6 {...demoData} onNavigate={onNavigate} />;
}

export { Gallery6Demo };
