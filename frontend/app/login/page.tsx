import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Edit, ArrowRight } from "lucide-react"

export default function LoginPage() {
    return (
        <div className="bg-midnight text-slate-100 font-sans selection:bg-coral selection:text-white h-screen flex flex-col items-center justify-center">
            <div className="w-full max-w-md p-8 sm:p-12 bg-midnight-light border border-border-dark rounded-xl shadow-2xl relative overflow-hidden">
                {/* Top Highlight Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coral/0 via-coral/80 to-coral/0"></div>

                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center size-12 bg-coral rounded-lg text-white mb-6 shadow-lg shadow-coral/20">
                        <Edit className="w-7 h-7" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2">Welcome Back</h1>
                    <p className="text-slate-400 text-sm font-medium">Sign in to your content pipeline</p>
                </div>

                <form className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                            Email Address
                        </Label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="w-5 h-5 text-slate-500" />
                            </div>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@company.com"
                                className="pl-10 py-6 bg-surface-dark border-border-dark text-slate-200 placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-coral focus-visible:border-coral transition-colors"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                                Password
                            </Label>
                            <a href="#" className="text-xs font-bold text-coral hover:text-coral-light transition-colors">
                                Forgot password?
                            </a>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="w-5 h-5 text-slate-500" />
                            </div>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                className="pl-10 py-6 bg-surface-dark border-border-dark text-slate-200 placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-coral focus-visible:border-coral transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <Checkbox id="remember-me" className="border-border-dark data-[state=checked]:bg-coral data-[state=checked]:text-white focus-visible:ring-coral" />
                        <label
                            htmlFor="remember-me"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-400 select-none"
                        >
                            Remember me for 30 days
                        </label>
                    </div>

                    <Button
                        type="button"
                        className="group w-full py-6 text-sm font-bold text-white bg-coral hover:bg-coral-dark focus-visible:ring-coral shadow-lg shadow-coral/20 hover:shadow-coral/30 transition-all"
                    >
                        Sign In
                        <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-border-dark text-center">
                    <p className="text-sm text-slate-400">
                        Don't have an account?{" "}
                        <a href="#" className="font-bold text-coral hover:text-coral-light transition-colors">
                            Request access
                        </a>
                    </p>
                </div>
            </div>

            <div className="mt-8 flex gap-6 text-slate-500 text-xs font-medium">
                <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-slate-300 transition-colors">Contact Support</a>
            </div>
        </div>
    )
}
