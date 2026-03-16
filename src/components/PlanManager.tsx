"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Loader2, Save, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

interface Feature {
    name: string;
    available: boolean;
}

interface Plan {
    _id?: string;
    name: string;
    price: number;
    durationDays: number;
    description: string;
    features: Feature[];
    isPopular: boolean;
    isActive: boolean;
}

const ALL_FEATURES = [
    "Unlimited Lead Extraction",
    "Dual Search Engine Support",
    "Cloud Sync & History Storage",
    "Bulk WhatsApp Outreach",
    "XLSX & CSV Data Export",
    "Priority Server Access",
    "Custom Webhooks",
    "Team Collaboration",
    "Advanced Analytics"
];

export default function PlanManager() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data } = await axios.get("/api/admin/plans");
            setPlans(data);
        } catch (err) {
            toast.error("Failed to fetch plans");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setCurrentPlan({
            name: "",
            price: 0,
            durationDays: 7,
            description: "",
            features: ALL_FEATURES.map(f => ({ name: f, available: false })),
            isPopular: false,
            isActive: true
        });
        setIsEditing(true);
    };

    const handleEdit = (plan: Plan) => {
        // Ensure all features are present in the plan being edited
        const planFeatures = plan.features || [];
        const combinedFeatures = ALL_FEATURES.map(f => {
            const existing = planFeatures.find(pf => pf.name === f);
            return existing ? existing : { name: f, available: false };
        });

        setCurrentPlan({ ...plan, features: combinedFeatures });
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this plan?")) return;
        try {
            await axios.delete(`/api/admin/plans/${id}`);
            setPlans(plans.filter(p => p._id !== id));
            toast.success("Plan deleted successfully");
        } catch (err) {
            toast.error("Failed to delete plan");
        }
    };

    const handleSave = async () => {
        if (!currentPlan) return;
        try {
            if (currentPlan._id) {
                await axios.put(`/api/admin/plans/${currentPlan._id}`, currentPlan);
                toast.success("Plan updated successfully");
            } else {
                await axios.post("/api/admin/plans", currentPlan);
                toast.success("Plan created successfully");
            }
            setIsEditing(false);
            fetchPlans();
        } catch (err) {
            toast.error("Failed to save plan");
        }
    };

    const toggleFeature = (featureName: string) => {
        if (!currentPlan) return;
        const newFeatures = currentPlan.features.map(f => 
            f.name === featureName ? { ...f, available: !f.available } : f
        );
        setCurrentPlan({ ...currentPlan, features: newFeatures });
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Manage Subscription Plans</h2>
                <button 
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary-600 font-bold text-sm hover:bg-primary-500 transition-all"
                >
                    <Plus size={18} /> Add New Plan
                </button>
            </div>

            {isEditing && currentPlan && (
                <div className="glass-card p-8 border-primary-500/30">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-bold">{currentPlan._id ? "Edit Plan" : "Create New Plan"}</h3>
                        <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <label className="block">
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2 block">Plan Name</span>
                                <input 
                                    type="text" 
                                    value={currentPlan.name}
                                    onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})}
                                    className="input-field py-3" 
                                    placeholder="e.g. Basic, Pro, Lifetime"
                                />
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-xs font-bold text-gray-500 uppercase mb-2 block">Price (INR)</span>
                                    <input 
                                        type="number" 
                                        value={currentPlan.price}
                                        onChange={e => setCurrentPlan({...currentPlan, price: parseInt(e.target.value)})}
                                        className="input-field py-3" 
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-xs font-bold text-gray-500 uppercase mb-2 block">Duration (Days)</span>
                                    <input 
                                        type="number" 
                                        value={currentPlan.durationDays}
                                        onChange={e => setCurrentPlan({...currentPlan, durationDays: parseInt(e.target.value)})}
                                        className="input-field py-3" 
                                    />
                                </label>
                            </div>
                            <label className="block">
                                <span className="text-xs font-bold text-gray-500 uppercase mb-2 block">Short Description</span>
                                <textarea 
                                    value={currentPlan.description}
                                    onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})}
                                    className="input-field py-3 h-24" 
                                    placeholder="Briefly describe who this plan is for..."
                                />
                            </label>
                            <div className="flex gap-6">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={currentPlan.isPopular}
                                        onChange={e => setCurrentPlan({...currentPlan, isPopular: e.target.checked})}
                                        className="w-5 h-5 rounded bg-white/5 border-white/10" 
                                    />
                                    <span className="text-sm font-bold">Mark as Popular</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={currentPlan.isActive}
                                        onChange={e => setCurrentPlan({...currentPlan, isActive: e.target.checked})}
                                        className="w-5 h-5 rounded bg-white/5 border-white/10" 
                                    />
                                    <span className="text-sm font-bold">Active</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <span className="text-xs font-bold text-gray-500 uppercase mb-4 block">Select Included Features</span>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                {currentPlan.features.map((feature, i) => (
                                    <div 
                                        key={i}
                                        onClick={() => toggleFeature(feature.name)}
                                        className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                                            feature.available 
                                            ? "bg-primary-500/10 border-primary-500/30 text-white" 
                                            : "bg-white/5 border-white/5 text-gray-500"
                                        }`}
                                    >
                                        <span className="font-bold text-sm tracking-tight">{feature.name}</span>
                                        {feature.available ? <CheckCircle2 size={18} className="text-primary-400" /> : <XCircle size={18} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button 
                            onClick={handleSave}
                            className="flex-1 py-4 rounded-2xl bg-primary-600 text-white font-black hover:bg-primary-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={20} /> Save Plan
                        </button>
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <div key={plan._id} className={`glass-card p-8 border-white/5 flex flex-col justify-between ${!plan.isActive ? 'opacity-50' : ''}`}>
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                {plan.isPopular && <span className="px-3 py-1 bg-primary-600 rounded text-[10px] font-black uppercase tracking-widest">Popular</span>}
                                {!plan.isActive && <span className="px-3 py-1 bg-gray-600 rounded text-[10px] font-black uppercase tracking-widest">Inactive</span>}
                            </div>
                            <h3 className="text-3xl font-black mb-1">{plan.name}</h3>
                            <div className="text-gray-500 text-sm mb-6 uppercase font-bold tracking-widest">{plan.durationDays} Days Access</div>
                            <div className="text-5xl font-black mb-8">₹{plan.price}</div>
                            
                            <div className="space-y-3 mb-8">
                                {plan.features.slice(0, 5).map((f, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        {f.available ? <CheckCircle2 size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-500 opacity-50" />}
                                        <span className={f.available ? "text-gray-300" : "text-gray-500 line-through"}>{f.name}</span>
                                    </div>
                                ))}
                                {plan.features.length > 5 && <div className="text-xs text-gray-600 font-bold">+ {plan.features.length - 5} more features</div>}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-white/5">
                            <button 
                                onClick={() => handleEdit(plan)}
                                className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <Edit2 size={12} /> Edit
                            </button>
                            <button 
                                onClick={() => plan._id && handleDelete(plan._id)}
                                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {plans.length === 0 && (
                    <div className="md:col-span-3 py-20 text-center glass-card border-dashed border-white/10">
                        <p className="text-gray-500 font-bold">No plans found. Create your first plan to get started.</p>
                    </div>
                )}
            </div>
            {/* Features Comparison Table */}
            <div className="space-y-6 pt-12 border-t border-white/5">
                <h3 className="text-xl font-bold">Features Comparison Matrix</h3>
                <div className="glass-card overflow-hidden border-white/5">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Feature Name</th>
                                    {plans.map(p => (
                                        <th key={p._id} className="px-6 py-4 text-center">{p.name}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {ALL_FEATURES.map((featureName, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-gray-300">{featureName}</td>
                                        {plans.map(p => {
                                            const f = p.features?.find(pf => pf.name === featureName);
                                            return (
                                                <td key={p._id} className="px-6 py-4 text-center">
                                                    <div className="flex justify-center">
                                                        {f?.available ? (
                                                            <CheckCircle2 size={18} className="text-green-500" />
                                                        ) : (
                                                            <XCircle size={18} className="text-red-500 opacity-20" />
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
