"use client";

import React, { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Users, Search, CreditCard, ShieldCheck, ExternalLink, Trash2, Loader2, IndianRupee, Tag } from "lucide-react";
import axios from "axios";
import Link from "next/link";

import PlanManager from "@/components/PlanManager";
import { Toaster } from "react-hot-toast";

export default function AdminDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("overview");

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const { data } = await axios.get("/api/admin/stats");
            setData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center center">
            <Loader2 className="animate-spin text-primary-500" size={48} />
        </div>
    );

    const tabs = [
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "users", label: "Users", icon: Users },
        { id: "plans", label: "Plans", icon: CreditCard },
        { id: "coupons", label: "Coupons", icon: Tag },
    ];

    return (
        <div className="min-h-screen bg-[#020617]">
            <Toaster position="bottom-right" />
            <DashboardHeader />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
                            Admin Control Center
                            <span className="px-3 py-1 rounded bg-primary-600 text-[10px] font-black tracking-widest uppercase">System Admin</span>
                        </h1>
                        <p className="text-gray-400">Monitor system performance and manage application settings.</p>
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? "bg-primary-600 text-white shadow-lg" : "text-gray-500 hover:text-white"
                                    }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === "overview" && (
                    <>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                            {[
                                { label: "Total Users", value: data.totalUsers, icon: Users, color: "text-blue-400" },
                                { label: "Active Subs", value: data.activeSubs, icon: ShieldCheck, color: "text-green-400" },
                                { label: "Total Searches", value: data.totalSearches, icon: Search, color: "text-purple-400" },
                                { label: "Revnue (Est)", value: `₹${data.activeSubs * 100}`, icon: IndianRupee, color: "text-yellow-400" },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-6 flex flex-col items-center text-center border-white/5">
                                    <stat.icon className={`${stat.color} mb-4`} size={32} />
                                    <div className="text-3xl font-black mb-1">{stat.value}</div>
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-2">
                                <RecentUsersTable users={data.users} />
                            </div>
                            <div className="space-y-6">
                                <div className="glass-card p-8 border-white/5">
                                    <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500 mb-6">Quick Actions</h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button onClick={() => setActiveTab('plans')} className="w-full py-4 rounded-xl bg-white/5 border border-white/5 hover:bg-primary-600/10 hover:border-primary-500/30 transition-all text-left px-6 group flex items-center justify-between">
                                            <span className="font-bold text-sm">Update Subscriptions</span>
                                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        <button onClick={() => setActiveTab('users')} className="w-full py-4 rounded-xl bg-white/5 border border-white/5 hover:bg-blue-600/10 hover:border-blue-500/30 transition-all text-left px-6 group flex items-center justify-between">
                                            <span className="font-bold text-sm">Review User Reports</span>
                                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        <button onClick={() => setActiveTab('coupons')} className="w-full py-4 rounded-xl bg-white/5 border border-white/5 hover:bg-yellow-600/10 hover:border-yellow-500/30 transition-all text-left px-6 group flex items-center justify-between">
                                            <span className="font-bold text-sm">Manage Discounts</span>
                                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === "users" && <RecentUsersTable users={data.users} showAll={true} />}
                {activeTab === "plans" && <PlanManager />}
                {activeTab === "coupons" && (
                    <div className="glass-card p-12 text-center border-dashed border-white/10">
                        <Tag size={48} className="mx-auto mb-6 text-gray-600" />
                        <h3 className="text-xl font-bold mb-2">Coupon Management</h3>
                        <p className="text-gray-500 max-w-md mx-auto">This feature is currently under development. You will soon be able to create and manage discount codes here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}

function RecentUsersTable({ users, showAll = false }: { users: any[], showAll?: boolean }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{showAll ? "All System Users" : "Recent Users"}</h2>
            </div>

            <div className="glass-card overflow-hidden border-white/5">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-[10px] font-black tracking-widest text-gray-400 uppercase">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Subscription</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((user: any) => (
                            <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden">
                                            {user.image && <img src={user.image} alt="" />}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-white">{user.name}</div>
                                            <div className="text-[10px] text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black ${user.subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                        }`}>
                                        {user.subscriptionStatus.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 font-medium">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link href={`/admin/user/${user._id}`} className="p-2 rounded-lg bg-white/5 hover:bg-primary-600 text-gray-400 hover:text-white transition-all">
                                            <ExternalLink size={14} />
                                        </Link>
                                        <button className="p-2 rounded-lg bg-red-500/10 hover:bg-red-600 text-red-500 hover:text-white transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

import { LayoutDashboard } from "lucide-react";
