import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 lg:px-8">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <span className="text-[22px] font-extrabold tracking-tight text-gray-900">Synapse</span>
                    <div className="w-[1.5px] h-4 bg-gray-200" />
                    <span className="text-[16px] font-bold text-gray-400">AI</span>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-10 absolute left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 cursor-pointer group">
                        <span className="text-[14px] font-semibold text-gray-700 group-hover:text-black transition-colors">Products</span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-black transition-colors" />
                    </div>
                    <Link href="#" className="text-[14px] font-semibold text-gray-700 hover:text-black transition-colors">
                        Publishers
                    </Link>
                    <Link href="#" className="text-[14px] font-semibold text-gray-700 hover:text-black transition-colors">
                        Advertisers
                    </Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" className="hidden sm:inline-flex rounded-full text-[14px] font-semibold text-gray-700 hover:text-black hover:bg-gray-50 border border-transparent hover:border-gray-200">
                        Sign in
                    </Button>
                    <Button className="rounded-full bg-[#1C1C1C] text-white text-[14px] font-semibold hover:bg-black transition-shadow shadow-md hover:shadow-lg px-6">
                        Get Started
                    </Button>
                </div>
            </div>
        </header>
    );
}
