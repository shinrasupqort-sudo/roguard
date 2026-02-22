import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Activity, Filter, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  error: "bg-red-500/20 text-red-400 border border-red-500/30",
  blocked: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  bypass_attempt: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};

export default function ExecutorLogs() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: logs, isLoading, refetch } = trpc.executorLogs.list.useQuery({ limit: 200 });
  const { data: stats } = trpc.executorLogs.stats.useQuery();

  const filtered = (logs ?? []).filter((log: any) => {
    const matchSearch = !search || (log.scriptName?.toLowerCase().includes(search.toLowerCase()) || log.hwid?.toLowerCase().includes(search.toLowerCase()) || log.executorName?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || log.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-foreground">Executor Logs</h1><p className="text-muted-foreground text-sm mt-1">Track all script executions and security events</p></div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 border-border text-foreground hover:bg-secondary"><RefreshCw className="w-4 h-4" />Refresh</Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Success", value: stats.success, color: "text-emerald-400" },
              { label: "Errors", value: stats.errors, color: "text-red-400" },
              { label: "Bypass", value: stats.bypass, color: "text-yellow-400" },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by script, HWID, executor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary border-border text-foreground" />
          </div>
          <div className="flex gap-2">
            {["all","success","error","blocked","bypass_attempt"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                {s === "all" ? "All" : s === "bypass_attempt" ? "Bypass" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Script</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">HWID</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Executor</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Game</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse" /></td>)}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No logs found</td></tr>
                ) : (
                  filtered.map((log: any) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{log.scriptName ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.hwid ? log.hwid.slice(0, 16) + "..." : "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{log.executorName ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{log.gameName ?? log.gameId ?? "—"}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[log.status] ?? ""}`}>{log.status}</span></td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
