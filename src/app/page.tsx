"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
    Search,
    Target,
    Zap,
    Shield,
    ArrowRight,
    CheckCircle2,
    Globe,
    MessageSquare,
    Download,
    Users,
    Database,
    Lock,
    BookOpen,
    HelpCircle,
    FileText,
    BarChart3,
    MapPin,
    Play,
    Star,
    Layers,
    Cpu,
    ExternalLink,
    XCircle,
    Loader2
} from "lucide-react";

// ─── Shared Components ───────────────────────────────────────────────

const SectionHeader = ({ title, subtitle, badge }: any) => (
    <div className="text-center mb-16 space-y-4">
        {badge && (
            <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="px-4 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-[10px] font-black tracking-widest uppercase inline-block"
            >
                {badge}
            </motion.span>
        )}
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">{title}</h2>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg font-medium leading-relaxed">{subtitle}</p>
    </div>
);

// ─── Landing Page ────────────────────────────────────────────────────

export default function LandingPage() {
    const { data: session } = useSession();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navbarLinks = [
        { name: "Features", href: "#features" },
        { name: "Documentation", href: "#docs" },
        { name: "Pricing", href: "#pricing" },
    ];

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-primary-500/30 overflow-x-hidden">
            {/* Background Grain & Noise */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03]" style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }} />

            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? "bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5 py-4" : "bg-transparent py-8"}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-primary-500/20 group-hover:rotate-12 transition-transform duration-300">
                            <Search size={22} className="text-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">LeadHarvest</span>
                    </div>

                    <div className="hidden md:flex items-center gap-10">
                        {navbarLinks.map((link) => (
                            <a key={link.name} href={link.href} className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-[0.15em]">{link.name}</a>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {session ? (
                            <Link href="/dashboard" className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-black hover:bg-white/10 transition-all uppercase tracking-widest flex items-center gap-2">
                                Dashboard <ArrowRight size={16} />
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="hidden sm:block text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest px-4">Sign In</Link>
                                <Link href="/login" className="px-8 py-3 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white text-sm font-black hover:shadow-lg hover:shadow-primary-500/20 transition-all uppercase tracking-widest">Get Started</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-56 pb-32 px-6 overflow-hidden min-h-screen flex items-center">
                {/* Background Dynamic Shapes */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-gradient-to-b from-primary-900/20 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -top-[10%] left-[10%] w-[500px] h-[500px] bg-primary-600/10 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-600/10 blur-[130px] rounded-full animate-pulse delay-1000" />

                <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-12 gap-16 items-center">
                    <div className="lg:col-span-7 space-y-10 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-primary-400"
                        >
                            <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
                            Next-Gen Lead Extraction 2.0
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white"
                        >
                            Harvest Leads. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-indigo-400 to-primary-600">Scale Instantly.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed"
                        >
                            The most advanced data harvester for Google Maps and DuckDuckGo.
                            Build your B2B pipeline with verified contacts in seconds, not hours.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center lg:justify-start"
                        >
                            <Link href={session ? "/dashboard" : "/login"}>
                                <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-black font-black text-lg hover:bg-gray-200 hover:shadow-2xl hover:shadow-white/10 transition-all flex items-center justify-center gap-3 group">
                                    {session ? "Enter Dashboard" : "Start Harvesting Now"}
                                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                            <a href="#demo">
                                <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                                    <Play size={20} fill="currentColor" /> Watch Demo
                                </button>
                            </a>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
                        >
                            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest"><Globe size={18} /> GLOBAL DATA</div>
                            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest"><Shield size={18} /> GDPR READY</div>
                            <div className="flex items-center gap-2 font-black text-sm uppercase tracking-widest"><Zap size={18} /> 100x FASTER</div>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 1, type: "spring" }}
                        className="lg:col-span-5 relative"
                    >
                        {/* Mock Dashboard UI */}
                        <div className="relative glass-card border-white/10 shadow-2xl overflow-hidden p-2 rounded-[32px]">
                            <div className="bg-[#020617] rounded-[24px] p-6 space-y-6">
                                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                    </div>
                                    <div className="px-3 py-1 bg-white/5 rounded-md text-[10px] text-gray-500 uppercase font-black tracking-widest">harvester_v2.exe</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-8 bg-white/5 rounded-lg border border-white/10 flex items-center px-4">
                                        <span className="text-[10px] text-primary-400 font-mono">https://www.google.com/maps/search/gyms+in+ny/</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-20 bg-primary-600/10 rounded-xl border border-primary-500/20 p-4">
                                            <div className="text-[10px] text-primary-400 uppercase font-black">Success Rate</div>
                                            <div className="text-2xl font-black">99.8%</div>
                                        </div>
                                        <div className="h-20 bg-indigo-600/10 rounded-xl border border-indigo-500/20 p-4">
                                            <div className="text-[10px] text-indigo-400 uppercase font-black">Leads Found</div>
                                            <div className="text-2xl font-black">12,482</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-10 bg-white/[0.03] rounded-lg border border-white/5 flex items-center justify-between px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded bg-primary-500/20" />
                                                    <div className="w-24 h-2 bg-white/10 rounded" />
                                                </div>
                                                <CheckCircle2 size={14} className="text-green-500" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background elements for mockup */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary-600/20 blur-[60px] rounded-full -z-10" />
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-600/20 blur-[60px] rounded-full -z-10" />
                    </motion.div>
                </div>
            </section>

            {/* Trusted By / Logos */}
            <section className="py-20 border-y border-white/5 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] text-gray-500 mb-12">Trusted by 10,000+ scaling agencies & marketers</p>
                    <div className="flex flex-wrap items-center justify-center gap-12 md:gap-24 opacity-30 grayscale contrast-125">
                        {/* Replace with real logos if available */}
                        <div className="text-2xl font-black tracking-tighter">DATAWOLF</div>
                        <div className="text-2xl font-black tracking-tighter">LEADFLOW</div>
                        <div className="text-2xl font-black tracking-tighter">GROWTHOS</div>
                        <div className="text-2xl font-black tracking-tighter">CORE.AI</div>
                        <div className="text-2xl font-black tracking-tighter">STORM.MAPS</div>
                    </div>
                </div>
            </section>

            {/* Bento Grid Features Section */}
            <section id="features" className="py-32 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <SectionHeader
                        badge="Advanced Features"
                        title="Everything you need to dominate outreach."
                        subtitle="Built by growth engineers who know the struggle of manual lead searching."
                    />

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[240px]">
                        {/* Main Bento Card */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-8 md:row-span-2 glass-card p-10 relative overflow-hidden group border-white/5 hover:border-primary-500/30 transition-all"
                        >
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="w-16 h-16 rounded-2xl bg-primary-600/10 flex items-center justify-center border border-primary-500/20 group-hover:scale-110 transition-transform">
                                        <Layers className="text-primary-400" size={32} />
                                    </div>
                                    <h3 className="text-3xl font-black text-white">Dual Engine Scraping</h3>
                                    <p className="text-gray-400 max-w-md text-lg">
                                        Seamlessly toggle between Google Maps and DuckDuckGo. Target local shops or global tech startups with precision.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="px-4 py-2 rounded-lg bg-white/5 text-xs font-bold text-gray-400"># GoogleMaps</div>
                                    <div className="px-4 py-2 rounded-lg bg-white/5 text-xs font-bold text-gray-400"># DuckDuckGo</div>
                                    <div className="px-4 py-2 rounded-lg bg-white/5 text-xs font-bold text-gray-400"># AsyncStreaming</div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-600/5 to-transparent pointer-events-none" />
                        </motion.div>

                        {/* Bento Card Small */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-4 glass-card p-8 border-white/5 group transition-all"
                        >
                            <div className="h-full flex flex-col justify-between">
                                <div className="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center border border-indigo-500/20 mb-4 group-hover:rotate-12 transition-transform">
                                    <MessageSquare className="text-indigo-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">WhatsApp Direct</h3>
                                    <p className="text-gray-400 text-sm">Automated personalized outreach flows in one click.</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-4 glass-card p-8 border-white/5 group transition-all"
                        >
                            <div className="h-full flex flex-col justify-between">
                                <div className="w-12 h-12 rounded-xl bg-green-600/10 flex items-center justify-center border border-green-500/20 mb-4 group-hover:rotate-12 transition-transform">
                                    <Download className="text-green-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2">Smart Export</h3>
                                    <p className="text-gray-400 text-sm">CSV, XLSX and PDF exports with nested contact data.</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento Card Medium */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="md:col-span-12 md:row-span-1 glass-card p-10 flex flex-col md:flex-row items-center gap-10 border-white/5 transition-all"
                        >
                            <div className="md:w-1/2 space-y-4">
                                <div className="inline-flex items-center gap-2 text-primary-400 font-bold uppercase text-[10px] tracking-widest"><Cpu size={14} /> Cloud Architecture</div>
                                <h3 className="text-3xl font-black text-white">Unlimited Search History</h3>
                                <p className="text-gray-400 leading-relaxed font-medium">Never lose a lead. Every search result is securely synced to your cloud dashboard for instant access anytime, anywhere.</p>
                            </div>
                            <div className="md:w-1/2 w-full grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="aspect-square bg-white/5 rounded-2xl border border-white/5 flex items-center justify-center group">
                                        <Database size={24} className="text-gray-600 group-hover:text-primary-500 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-32 bg-white/[0.01]">
                <div className="max-w-7xl mx-auto px-6">
                    <SectionHeader
                        badge="Wall of Love"
                        title="Don't take our word for it."
                        subtitle="Join thousands of business owners who automated their top-of-funnel."
                    />

                    <div className="grid md:grid-cols-3 gap-8 text-left">
                        {[
                            { name: "Sarah Chen", role: "Growth Lead @ ScaleAI", body: "We reduced our manual lead generation by 92% in the first week. The data quality is unmatched." },
                            { name: "Marco Rossi", role: "CEO @ OutreachPro", body: "Direct WhatsApp links are a game changer. Our response rate went from 5% to nearly 30%." },
                            { name: "David Miller", role: "Founder @ LeadLabs", body: "The UI is so clean, but the power under the hood is what matters. Truly an industry-grade harvester." },
                        ].map((t, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="p-8 rounded-[32px] bg-[#0A0F21] border border-white/5 h-full flex flex-col justify-between"
                            >
                                <div className="space-y-6">
                                    <div className="flex gap-1 text-yellow-500">
                                        {[1, 2, 3, 4, 5].map(j => <Star key={j} size={14} fill="currentColor" />)}
                                    </div>
                                    <p className="text-gray-300 font-medium leading-relaxed italic">"{t.body}"</p>
                                </div>
                                <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 border-2 border-white/10" />
                                    <div>
                                        <div className="text-white font-black">{t.name}</div>
                                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t.role}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <PricingSection session={session} />

            {/* Documentation & Guide */}
            <section id="docs" className="py-32 border-t border-white/5 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <SectionHeader
                        badge="Handbook"
                        title="Documentation & User Guide"
                        subtitle="Everything you need to know about navigating the LeadHarvest ecosystem."
                    />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: BookOpen, title: "Quick Start", body: "Login, search Google Maps, copy the URL and paste it into the harvester dashboard." },
                            { icon: Cpu, title: "How it Works", body: "Our agents navigate the maps interface asynchronously to extract every detail in real-time." },
                            { icon: FileText, title: "Export Guide", body: "Directly download leads into clean, formatted Excel files ready for your CRM." },
                            { icon: Shield, title: "Compliance", body: "Learn about GDPR, data privacy, and how we handle lead information securely." },
                        ].map((step, i) => (
                            <div key={i} className="space-y-4 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                                    <step.icon size={28} />
                                </div>
                                <h3 className="text-xl font-bold">{step.title}</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">{step.body}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 p-12 rounded-[40px] bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="space-y-2">
                            <h4 className="text-2xl font-black">Ready to scale your business?</h4>
                            <p className="text-gray-400 font-medium">Start harvesting high-converting leads in under 2 minutes.</p>
                        </div>
                        <Link href="/login" className="shrink-0">
                            <button className="px-12 py-5 rounded-2xl bg-primary-600 text-white font-black text-lg hover:bg-primary-500 hover:shadow-2xl hover:shadow-primary-500/20 transition-all">
                                JOIN LEADHARVEST
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-24 px-6 border-t border-white/5">
                <div className="max-w-7xl mx-auto space-y-20">
                    <div className="flex flex-col md:flex-row justify-between gap-20">
                        <div className="space-y-6 md:w-1/3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                                    <Search size={18} className="text-white" />
                                </div>
                                <span className="text-xl font-black">LeadHarvest</span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                The industry's leading lead extraction platform for high-growth agencies.
                                We help you find the people who are looking for your services.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/10"><Globe size={18} /></div>
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer border border-white/10"><ExternalLink size={18} /></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 md:w-2/3">
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Platform</h5>
                                <ul className="space-y-4 text-sm font-bold text-gray-400">
                                    <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                                    <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                                    <li><Link href="/dashboard" className="hover:text-white transition-colors">Extractor</Link></li>
                                </ul>
                            </div>
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Resources</h5>
                                <ul className="space-y-4 text-sm font-bold text-gray-400">
                                    <li><Link href="#docs" className="hover:text-white transition-colors">Documentation</Link></li>
                                    <li><Link href="#" className="hover:text-white transition-colors">API Docs</Link></li>
                                    <li><Link href="#" className="hover:text-white transition-colors">User Guide</Link></li>
                                </ul>
                            </div>
                            <div className="space-y-6">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Legal</h5>
                                <ul className="space-y-4 text-sm font-bold text-gray-400">
                                    <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                    <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                                    <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest">© 2026 LeadHarvest. Scaling globally.</p>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-600">
                            <span>Status: Operational</span>
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

const PricingSection = ({ session }: { session: any }) => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const { data } = await axios.get("/api/plans");
                setPlans(data);
            } catch (err) {
                console.error("Failed to fetch plans", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    if (loading) return (
        <div className="py-32 flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-primary-500" size={40} />
            <p className="text-gray-500 font-bold text-sm tracking-widest uppercase">Loading exclusive deals...</p>
        </div>
    );

    if (plans.length === 0) return null;

    return (
        <section id="pricing" className="py-32 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <SectionHeader
                    badge="Pricing"
                    title="Simple. Affordable. Powerful."
                    subtitle="Choose the plan that fits your growth ambitions."
                />

                <div className={`grid gap-8 ${
                    plans.length === 1 ? 'max-w-md mx-auto' : 
                    plans.length === 2 ? 'max-w-4xl mx-auto md:grid-cols-2' : 
                    'md:grid-cols-3'
                }`}>
                    {plans.map((plan) => (
                        <motion.div
                            key={plan._id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className={`relative rounded-[40px] p-[1px] ${
                                plan.isPopular 
                                ? 'bg-gradient-to-tr from-primary-600 to-indigo-600 shadow-2xl shadow-primary-500/20' 
                                : 'bg-white/5 border border-white/5'
                            }`}
                        >
                            <div className="bg-[#0A0F21] rounded-[39px] p-10 h-full flex flex-col relative overflow-hidden">
                                {plan.isPopular && (
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Target size={120} />
                                    </div>
                                )}
                                
                                <div className="mb-8">
                                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">{plan.name}</h3>
                                    <p className="text-gray-400 text-sm font-medium">{plan.description || `${plan.durationDays} days of unlimited power.`}</p>
                                </div>

                                <div className="flex items-center gap-1 mb-10">
                                    <span className="text-gray-500 text-2xl font-bold">₹</span>
                                    <span className="text-7xl font-black text-white">{plan.price}</span>
                                    <span className="text-gray-500 font-black text-xl ml-2 uppercase tracking-tighter">/ {plan.durationDays} Days</span>
                                </div>

                                <div className="space-y-4 mb-12 flex-1 text-left bg-white/5 rounded-3xl p-8 border border-white/5">
                                    {plan.features.map((feature: any, i: number) => (
                                        <div key={i} className="flex items-center gap-3">
                                            {feature.available ? (
                                                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 size={12} className="text-green-500" />
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                                    <XCircle size={12} className="text-red-500/50" />
                                                </div>
                                            )}
                                            <span className={`text-sm font-medium ${feature.available ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                                                {feature.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <Link 
                                    href={
                                        !session ? "/login" : 
                                        (session.user.subscriptionStatus === 'active' ? "/dashboard" : `/checkout?plan=${plan._id}`)
                                    } 
                                    className="block"
                                >
                                    <button className={`w-full py-6 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 group ${
                                        plan.isPopular ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                                    }`}>
                                        { (session?.user.subscriptionStatus === 'active') ? "GO TO DASHBOARD" : "GET ACCESS NOW"}
                                        <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                                <p className="text-[10px] text-gray-500 mt-6 text-center font-black uppercase tracking-[0.2em]">Secure Checkout • Instant Setup</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

import axios from "axios";
