"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, Zap, ArrowRight, Loader2, XCircle } from "lucide-react";
import axios from "axios";

function CheckoutContent() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = searchParams.get("plan");

    const [loading, setLoading] = useState(false);
    const [coupon, setCoupon] = useState("");
    const [discount, setDiscount] = useState(0);
    const [isCouponApplied, setIsCouponApplied] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [price, setPrice] = useState(0);

    useEffect(() => {
        if (status === "authenticated" && session?.user) {
            const isPlanValid = 
                session.user.subscriptionStatus === "active" && 
                session.user.planExpiry && 
                new Date(session.user.planExpiry) > new Date();
            
            if (isPlanValid) {
                router.push("/dashboard");
            }
        }
    }, [session, status, router]);

    useEffect(() => {
        const fetchPlanDetails = async () => {
            try {
                const { data } = await axios.get("/api/plans");
                if (planId) {
                    const plan = data.find((p: any) => p._id === planId);
                    if (plan) {
                        setSelectedPlan(plan);
                        setPrice(plan.price);
                    } else if (data.length > 0) {
                        setSelectedPlan(data[0]);
                        setPrice(data[0].price);
                    }
                } else if (data.length > 0) {
                    setSelectedPlan(data[0]);
                    setPrice(data[0].price);
                }
            } catch (err) {
                console.error("Failed to fetch plan:", err);
            }
        };
        fetchPlanDetails();
    }, [planId]);

    const applyCoupon = async () => {
        try {
            const { data } = await axios.post("/api/coupon/validate", { 
                code: coupon,
                originalPrice: selectedPlan?.price || 100 
            });
            if (data.success) {
                setDiscount(data.discount);
                setPrice(data.newPrice);
                setIsCouponApplied(true);
            } else {
                alert(data.message || "Invalid coupon code");
            }
        } catch (err) {
            console.error("Coupon application error:", err);
            alert("Invalid coupon code or an error occurred.");
        }
    };

    const handlePayment = async () => {
        if (!selectedPlan && price > 0) {
            alert("Please select a valid plan.");
            return;
        }

        if (price === 0) {
            setLoading(true);
            try {
                await axios.post("/api/payment/verify", {
                    razorpay_order_id: "free_access",
                    razorpay_payment_id: "free_" + (coupon || "plan"),
                    razorpay_signature: "free_access",
                    planId: selectedPlan?._id
                });
                await update();
                router.push("/dashboard");
                router.refresh();
            } catch (err) {
                console.error("Access application error:", err);
                alert("Failed to apply access.");
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            const { data: order } = await axios.post("/api/payment/order", { 
                amount: price,
                planId: selectedPlan?._id
            });

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: "INR",
                name: "LeadHarvest",
                description: selectedPlan?.name || "Subscription",
                order_id: order.id,
                handler: async (response: any) => {
                    try {
                        await axios.post("/api/payment/verify", {
                            ...response,
                            planId: selectedPlan?._id
                        });
                        await update();
                        router.push("/dashboard");
                        router.refresh();
                    } catch (error) {
                        alert("Payment Verification Failed!");
                    }
                },
                prefill: {
                    name: session?.user?.name,
                    email: session?.user?.email,
                },
                theme: {
                    color: "#4F46E5",
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                alert("Payment Failed: " + response.error.description);
                setLoading(false);
            });
            rzp.open();
        } catch (err) {
            console.error("Payment initiation error:", err);
            alert("Failed to initiate payment. Please try again.");
            setLoading(false);
        }
    };

    if (!selectedPlan && price === 0) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="animate-spin text-primary-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-white">
            <div className="fixed inset-0 pointer-events-none opacity-20">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-600/20 blur-[150px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/20 blur-[150px] rounded-full" />
            </div>

            <main className="max-w-6xl mx-auto px-6 py-20 relative z-10 flex flex-col lg:flex-row gap-12">
                <div className="lg:w-2/3 space-y-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-4xl font-black mb-4">Complete Your Order</h1>
                        <p className="text-gray-400 font-medium">You are one step away from unlocking professional lead harvesting tools.</p>
                    </motion.div>

                    <div className="glass-card p-10 border-white/5 space-y-8">
                        <div className="flex items-center justify-between border-b border-white/10 pb-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-3xl bg-primary-600/10 flex items-center justify-center border border-primary-500/20">
                                    <Zap className="text-primary-400" size={40} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">{selectedPlan?.name}</h3>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{selectedPlan?.durationDays} Days Unlimited Access</p>
                                </div>
                            </div>
                            <div className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">₹{selectedPlan?.price}</div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex justify-between text-gray-400 font-bold text-sm tracking-wide">
                                <span>SUBTOTAL</span>
                                <span>₹{selectedPlan?.price}</span>
                            </div>
                            {isCouponApplied && (
                                <div className="flex justify-between text-green-400 font-bold italic text-sm">
                                    <span>DISCOUNT APPLIED</span>
                                    <span>-₹{(selectedPlan.price * discount / 100).toFixed(0)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-white text-3xl font-black border-t border-white/10 pt-6">
                                <span>Total Payable</span>
                                <span>₹{price}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="glass-card p-6 border-white/5 flex items-center gap-4 hover:border-green-500/30 transition-all">
                            <ShieldCheck className="text-green-500" size={28} />
                            <div>
                                <div className="text-sm font-bold">SSL Secure Transaction</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">End-to-End Encrypted</div>
                            </div>
                        </div>
                        <div className="glass-card p-6 border-white/5 flex items-center gap-4 hover:border-primary-500/30 transition-all">
                            <CreditCard className="text-primary-400" size={28} />
                            <div>
                                <div className="text-sm font-bold">Safe Payments</div>
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">RAZORPAY PARTNERED</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/3 space-y-6">
                    <div className="glass-card p-8 border-white/5 space-y-8 sticky top-8">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Promotional Code</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={coupon}
                                    onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                                    placeholder="Enter Code"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black focus:border-primary-500 transition-all outline-none"
                                    disabled={isCouponApplied}
                                />
                                <button
                                    onClick={applyCoupon}
                                    disabled={!coupon || isCouponApplied}
                                    className="px-6 py-4 bg-primary-600/10 border border-primary-500/20 rounded-2xl text-xs font-black hover:bg-primary-600 hover:text-white transition-all uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isCouponApplied ? "Applied" : "Apply"}
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full py-6 rounded-[24px] bg-white text-black font-black text-xl hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 group shadow-2xl shadow-white/5"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>
                                    PROCEED TO PAY ₹{price}
                                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        
                        <div className="space-y-4">
                            {selectedPlan?.features.slice(0, 4).map((f: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 text-xs font-bold">
                                    {f.available ? <ShieldCheck size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500/50" />}
                                    <span className={f.available ? "text-gray-300" : "text-gray-600 line-through"}>{f.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-primary-500" size={48} /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
