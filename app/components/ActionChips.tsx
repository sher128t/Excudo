import { Shield, CreditCard, Database, Image, Mail, Users, Sparkles, Type, LayoutGrid, Wand2, MousePointer2 } from "lucide-react";

interface ActionChipsProps {
    onAction: (prompt: string) => void;
    disabled?: boolean;
}

const actions = [
    { label: "Polish Design", icon: Sparkles, prompt: "Run a design polish pass on the current app. First inspect the existing files, then improve the visual hierarchy, spacing, typography, color restraint, component consistency, and mobile layout. Remove AI-looking defaults like generic icon-card grids, placeholder blocks, fake stats, overused purple gradients, and repetitive section patterns. Keep the product purpose and existing content intact." },
    { label: "Improve Layout", icon: LayoutGrid, prompt: "Improve the layout composition of this app. Replace repetitive equal-card sections with a more purposeful structure: asymmetric sections, product walkthroughs, tables, media-led areas, or workflow views where they fit. Preserve routes, copy intent, and working behavior." },
    { label: "Typeset", icon: Type, prompt: "Improve the typography system. Tighten the type scale, line lengths, font weights, labels, metadata, and section hierarchy so the design feels deliberate and professional. Do not change the app's meaning or add unnecessary decoration." },
    { label: "Add Motion", icon: MousePointer2, prompt: "Add purposeful traditional web animations and microinteractions. Use subtle reveal/stagger effects, hover/focus states, accordion/tab transitions, loading states, or selected-state motion where useful. Respect prefers-reduced-motion and avoid animation that is only decorative." },
    { label: "Remove Slop", icon: Wand2, prompt: "Audit the UI for AI-generated design tells and fix them: placeholder colored boxes, big rounded icon tiles above headings, glassmorphism everywhere, fake dashboards made of anonymous bars, repeated uppercase section labels, generic three-card feature rows, and overused purple gradients. Replace them with specific product UI, real content structure, and a coherent design system." },
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
