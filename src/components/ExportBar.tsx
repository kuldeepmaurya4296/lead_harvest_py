"use client";

import { Download, Filter, FileSpreadsheet } from "lucide-react";
import type { LeadRecord } from "@/app/dashboard/page";

interface Props {
    records: LeadRecord[];
    searchQuery: string;
    onSearchChange: (q: string) => void;
    apiBase: string;
}

export default function ExportBar({ records, searchQuery, onSearchChange, apiBase }: Props) {
    const handleCSVExport = () => {
        if (!records.length) return;
        const headers = ["Name", "City", "Phone", "Website", "Instagram", "About", "Address", "Notes"];
        const csvRows = [headers.join(",")];
        records.forEach((r) => {
            const row = headers.map((h) => {
                const val = String((r as unknown as Record<string, string>)[h] || "").replace(/"/g, '""');
                return `"${val}"`;
            });
            csvRows.push(row.join(","));
        });
        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `leads_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div
            className="glass-card"
            style={{
                padding: "16px 24px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
            }}
        >
            {/* Search / Filter */}
            <div style={{ position: "relative", flex: "1 1 280px", maxWidth: "400px" }}>
                <Filter
                    size={15}
                    style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                    }}
                />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Filter results by name, city, phone..."
                    className="input-field"
                    style={{ paddingLeft: "38px", padding: "10px 14px 10px 38px", fontSize: "0.85rem" }}
                />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button onClick={handleCSVExport} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <FileSpreadsheet size={15} />
                    Export CSV
                </button>

                <button
                    onClick={async () => {
                        try {
                            const response = await fetch(`${apiBase}/api/download`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ records })
                            });
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `leads_${new Date().toISOString().slice(0, 10)}.xlsx`;
                            a.click();
                            URL.revokeObjectURL(url);
                        } catch (err) {
                            alert("Failed to download Excel file.");
                        }
                    }}
                    className="btn-secondary"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "#34d399",
                        borderColor: "rgba(16, 185, 129, 0.3)",
                    }}
                >
                    <Download size={15} />
                    Download Excel
                </button>
            </div>
        </div>
    );
}
