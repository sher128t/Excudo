import { Plus, Shield, CreditCard, Database, Image, Mail, Users } from "lucide-react";

interface ActionChipsProps {
    onAction: (prompt: string) => void;
    disabled?: boolean;
}

const actions = [
    { label: "Add Authentication", icon: Shield, prompt: "Add user authentication with login and signup forms" },
    { label: "Add Pricing", icon: CreditCard, prompt: "Add a pricing section with 3 tiers - Basic, Pro, and Enterprise" },
    { label: "Connect Database", icon: Database, prompt: "Add a Supabase database integration" },
    { label: "Add Images", icon: Image, prompt: "Add more high-quality images from Unsplash throughout the site" },
    { label: "Add Contact Form", icon: Mail, prompt: "Add a contact form with email validation" },
    { label: "Add Testimonials", icon: Users, prompt: "Add a testimonials section with customer reviews" },
];

export function ActionChips({ onAction, disabled }: ActionChipsProps) {
    return (
        <div className="flex flex-wrap gap-2 p-3 border-t border-[#1e1e2e]">
            {actions.map((action) => (
                <button
                    key={action.label}
                    onClick={() => onAction(action.prompt)}
                    disabled={disabled}
                    className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#12121a] hover:bg-[#1a1a24] border border-[#1e1e2e] hover:border-indigo-500/30 rounded-full text-xs text-gray-400 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <action.icon className="w-3 h-3 group-hover:text-indigo-400 transition-colors" />
                    <span>{action.label}</span>
                </button>
            ))}
        </div>
    );
}
