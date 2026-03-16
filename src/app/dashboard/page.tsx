"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import StatsBar from "@/components/StatsBar";
import SearchForm from "@/components/SearchForm";
import ProgressPanel from "@/components/ProgressPanel";
import DataTable from "@/components/DataTable";
import ExportBar from "@/components/ExportBar";
import BulkWhatsApp from "@/components/BulkWhatsApp";
import {
  MessageCircle,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  IndianRupee,
  Clock,
  ArrowRight,
  X,
  ShieldAlert
} from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export interface LeadRecord {
  Name: string;
  City: string;
  Phone: string;
  Website: string;
  Instagram: string;
  whatsapp_link: string;
  About: string;
  Address: string;
  Notes: string;
  contactedSteps?: boolean[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";
const STREAM_BASE = process.env.NEXT_PUBLIC_STREAM_BASE || "";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [records, setRecords] = useState<LeadRecord[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [totalFound, setTotalFound] = useState(0);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSearchInfo, setCurrentSearchInfo] = useState({ query: "", model: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [wasSaved, setWasSaved] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [showBulkWhatsApp, setShowBulkWhatsApp] = useState(false);

  const isPlanValid = useCallback(() => {
    if (!session?.user) return false;
    if (session.user.subscriptionStatus !== "active") return false;
    if (!session.user.planExpiry) return false;
    return new Date(session.user.planExpiry) > new Date();
  }, [session]);

  const toggleSelect = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleContactStep = useCallback((recordIndex: number, stepIndex: number) => {
    setRecords((prev) => {
      const newRecords = [...prev];
      const record = { ...newRecords[recordIndex] };
      const steps = [...(record.contactedSteps || [false, false, false, false, false])];
      steps[stepIndex] = !steps[stepIndex];
      record.contactedSteps = steps;
      newRecords[recordIndex] = record;
      return newRecords;
    });
  }, []);

  const selectAll = useCallback((indices: number[]) => {
    setSelectedIndices(new Set(indices));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIndices(new Set());
  }, []);

  const selectedRecords = Array.from(selectedIndices)
    .sort((a, b) => a - b)
    .map((i) => records[i])
    .filter(Boolean);

  const startExtraction = useCallback((url: string, model: string) => {
    if (!isPlanValid()) {
      setShowPlanModal(true);
      return;
    }

    setRecords([]);
    setIsRunning(true);
    setProgress(0);
    setTotalFound(0);
    setError("");
    setStatusMessage("Connecting to server...");
    setSelectedIndices(new Set());
    setShowBulkWhatsApp(false);
    setWasSaved(false);
    setCurrentSearchInfo({ query: url, model });

    if (eventSourceRef.current) eventSourceRef.current.close();

    const es = new EventSource(`${STREAM_BASE}/api/stream?url=${encodeURIComponent(url)}&model=${model}`);
    eventSourceRef.current = es;

    es.addEventListener("status", (e: Event) => {
      const data = JSON.parse((e as MessageEvent).data);
      setStatusMessage(data.message);
      if (data.progress !== undefined) setProgress(data.progress);
      if (data.total_found !== undefined) setTotalFound(data.total_found);
    });

    es.addEventListener("record", (e: Event) => {
      const data = JSON.parse((e as MessageEvent).data) as LeadRecord;
      setRecords((prev) => [...prev, data]);
    });

    es.addEventListener("done", (e: Event) => {
      const data = JSON.parse((e as MessageEvent).data);
      setStatusMessage(data.message);
      setProgress(100);
      setIsRunning(false);
      es.close();
    });

    es.addEventListener("error", (e: Event) => {
      let msg = "Connection lost.";
      try {
        msg = JSON.parse((e as MessageEvent).data).message;
      } catch { /* ignored */ }
      setError(msg);
      setStatusMessage(`Error: ${msg}`);
      setIsRunning(false);
      es.close();
    });
  }, [isPlanValid]);

  const stopExtraction = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsRunning(false);
    setStatusMessage("Extraction stopped by user.");
  }, []);

  const handleSaveToDashboard = async () => {
    if (records.length === 0 || isSaving) return;
    setIsSaving(true);
    try {
      await axios.post("/api/search/save", {
        query: currentSearchInfo.query,
        model: currentSearchInfo.model,
        leads: records
      });
      setWasSaved(true);
    } catch (err) {
      alert("Failed to save search results.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <SearchForm
              onSubmit={startExtraction}
              onStop={stopExtraction}
              isRunning={isRunning}
            />
          </div>

          {(isRunning || progress > 0) && (
            <div className="animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <ProgressPanel
                statusMessage={statusMessage}
                progress={progress}
                isRunning={isRunning}
                error={error}
              />
            </div>
          )}

          {records.length > 0 && (
            <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <StatsBar records={records} totalFound={totalFound} isRunning={isRunning} />
            </div>
          )}

          {records.length > 0 && (
            <div className="animate-fade-in flex flex-col sm:flex-row gap-4 items-center" style={{ animationDelay: "0.25s" }}>
              <div className="flex-1 w-full">
                <ExportBar
                  records={records}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  apiBase={API_BASE}
                />
              </div>

              <button
                onClick={handleSaveToDashboard}
                disabled={isSaving || wasSaved || isRunning}
                className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${wasSaved
                  ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
                  : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : (wasSaved ? <CheckCircle size={18} /> : <Save size={18} />)}
                {isSaving ? "Saving..." : (wasSaved ? "Saved to Dashboard" : "Save to History")}
              </button>
            </div>
          )}

          {selectedIndices.size > 0 && (
            <div className="glass-card flex items-center justify-between p-4 border-primary-500/20 bg-primary-500/5">
              <span className="text-sm font-bold text-primary-400">
                {selectedIndices.size} leads selected
              </span>
              <div className="flex gap-3">
                <button onClick={deselectAll} className="px-4 py-2 rounded-xl bg-white/5 text-xs font-bold hover:bg-white/10 transition-all">
                  Deselect
                </button>
                <button
                  onClick={() => setShowBulkWhatsApp(true)}
                  className="px-6 py-2 rounded-xl bg-green-600 font-bold text-xs flex items-center gap-2"
                >
                  <MessageCircle size={14} />
                  Bulk WhatsApp
                </button>
              </div>
            </div>
          )}

          {showBulkWhatsApp && selectedRecords.length > 0 && (
            <BulkWhatsApp
              selectedRecords={selectedRecords}
              onClose={() => setShowBulkWhatsApp(false)}
              onClearSelection={() => {
                deselectAll();
                setShowBulkWhatsApp(false);
              }}
            />
          )}

          {records.length > 0 && (
            <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <DataTable
                records={records}
                searchQuery={searchQuery}
                selectedIndices={selectedIndices}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
                onDeselectAll={deselectAll}
                onToggleContactStep={toggleContactStep}
              />
            </div>
          )}
        </div>
      </main>

      {/* Plan Activation Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-[#020617]/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card max-w-lg w-full p-10 border-primary-500/30 shadow-2xl shadow-primary-500/20 relative"
            >
              <button onClick={() => setShowPlanModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary-600/10 border border-primary-500/20 mb-6">
                  <ShieldAlert className="text-primary-400" size={40} />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Plan Activation Required</h2>
                <p className="text-gray-400 font-medium leading-relaxed">
                  Your account doesn't have an active harvester plan.
                  Purchase our 7-day access pass to start extracting high-quality leads.
                </p>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-3xl p-8 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-1">Standard Plan</div>
                    <div className="text-2xl font-black text-white">7 Days Full Access</div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white flex items-center gap-1">
                      <IndianRupee size={24} />
                      100
                    </div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Single Payment</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    "Unlimited Lead Extraction",
                    "Cloud History & Storage",
                    "Excel/CSV Downloads",
                    "Bulk WhatsApp Tools"
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle size={14} className="text-green-400" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/checkout" className="block">
                <button className="w-full py-5 rounded-2xl bg-primary-600 text-white font-black text-lg hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-500/20 transition-all flex items-center justify-center gap-3 group">
                  ACTIVATE PLAN NOW
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>

              <p className="text-center mt-6 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                Safe & Secure Payments via Razorpay
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
