"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, ShieldCheck, Zap, ArrowRight, Loader2 } from "lucide-react";
import axios from "axios";

export default function CheckoutPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

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

    const [loading, setLoading] = useState(false);
    const [coupon, setCoupon] = useState("");
    const [discount, setDiscount] = useState(0);
    const [isCouponApplied, setIsCouponApplied] = useState(false);
    const [price, setPrice] = useState(100);

    const applyCoupon = async () => {
        try {
            const { data } = await axios.post("/api/coupon/validate", { code: coupon });
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
        if (price === 0) {
            // Free access via coupon
            setLoading(true);
            try {
                await axios.post("/api/payment/verify", {
                    razorpay_order_id: "free_coupon",
                    razorpay_payment_id: "free_" + coupon,
                    razorpay_signature: "free_access"
                });
                await update();
                router.push("/dashboard");
                router.refresh();
            } catch (err) {
                console.error("Free access application error:", err);
                alert("Failed to apply free access.");
            } finally {
                setLoading(false);
            }
            return;
        }

        setLoading(true);
        try {
            // 1. Create Order on Server
            const { data: order } = await axios.post("/api/payment/order", { amount: price });

            // 2. Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: "INR",
                name: "LeadHarvest",
                description: "Lifetime Access Subscription",
                order_id: order.id,
                handler: async (response: any) => {
                    try {
                        // 3. Verify Payment on Server
                        await axios.post("/api/payment/verify", response);
                        // Refresh session to get new subscription status
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
                    color: "#4f46e5",
                },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error(err);
            alert("Failed to initiate payment.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-10 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <span className="text-secondary-400 font-bold uppercase tracking-widest text-sm mb-4 block">Final Step</span>
                    <h1 className="text-5xl font-black mb-6 leading-tight">Unlock Full <br /> Access for 7 Days.</h1>
                    <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                        Join thousands of professionals using LeadHarvest to automate their growth.
                        A small contribution of ₹100 gives you 7 days of full access to all harvester tools.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-primary-900/40 flex items-center justify-center text-primary-400 group-hover:bg-primary-500 group-hover:text-white transition-all">
                                <Zap size={20} />
                            </div>
                            <span className="font-medium">Unlimited Scraping & Exports</span>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="w-10 h-10 rounded-xl bg-indigo-900/40 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                <ShieldCheck size={20} />
                            </div>
                            <span className="font-medium">Cloud Lead Dashboard</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card p-12 border-primary-500/30"
                >
                    <div className="text-center mb-10">
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">You Pay</div>
                        <div className="text-7xl font-black text-white">₹{price}</div>
                        {isCouponApplied && (
                            <div className="text-xs font-bold text-green-500 mt-2 uppercase tracking-widest">
                                {discount}% Discount Applied!
                            </div>
                        )}
                    </div>

                    <div className="mb-8 flex gap-2">
                        <input
                            type="text"
                            placeholder="Coupon Code"
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value)}
                            className="input-field py-3 text-sm flex-1"
                            disabled={isCouponApplied}
                        />
                        <button
                            onClick={applyCoupon}
                            disabled={!coupon || isCouponApplied}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-white/10 disabled:opacity-50 transition-all uppercase tracking-widest"
                        >
                            {isCouponApplied ? "Applied" : "Apply"}
                        </button>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-primary-600 to-indigo-600 font-black text-xl hover:shadow-2xl hover:shadow-primary-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <CreditCard size={24} />}
                        {loading ? "Processing..." : `Pay ₹${price} Now`}
                        {!loading && <ArrowRight size={20} />}
                    </button>

                    <p className="text-center text-gray-500 text-xs mt-8">
                        Secure checkout powered by Razorpay. <br />
                        Lifetime access included.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
