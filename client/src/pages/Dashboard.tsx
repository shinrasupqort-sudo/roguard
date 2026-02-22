import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, Code2, FileCode2, Globe, Shield, TrendingUp, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const STATUS_COLORS = { success: "#10b981", error: "#ef4444", blocked: "#f97316", bypass_attempt: "#eab308" };

function StatCard({ icon: Icon, label, value, sub, color = "primary" }: { icon: any; label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10`}><Icon className="w-5 h-5 text-primary" /></div>
      <div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: alerts } = trpc.alerts.list.useQuery({ limit: 5 });

  const pieData = stats ? [
    { name: "Success", value: stats.logStats.success, color: "#10b981" },
    { name: "Errors", value: stats.logStats.errors, color: "#ef4444" },
    { name: "Blocked", value: stats.logStats.blocked, color: "#f97316" },
    { name: "Bypass", value: stats.logStats.bypass, color: "#eab308" },
  ].filter(d => d.value > 0) : [];

  const barData = stats?.topScripts?.map(s => ({ name: s.name.slice(0, 12), executions: s.executionCount })) ?? [];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your script protection platform</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-5 h-24 animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FileCode2} label="Total Scripts" value={stats?.totalScripts ?? 0} sub="Active scripts" />
            <StatCard icon={Globe} label="Remote Loaders" value={stats?.totalLoaders ?? 0} sub="Active loaders" />
            <StatCard icon={Activity} label="Total Executions" value={stats?.logStats.total ?? 0} sub="All time" />
            <StatCard icon={AlertTriangle} label="Bypass Attempts" value={stats?.logStats.bypass ?? 0} sub="Detected & blocked" />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Scripts Bar Chart */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Top Scripts by Executions</h2>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2d2d44", borderRadius: 8, color: "#e5e7eb" }} />
                  <Bar dataKey="executions" fill="oklch(0.65 0.22 270)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No execution data yet</div>
            )}
          </div>

          {/* Execution Status Pie */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-primary" />Execution Status Breakdown</h2>
            {pieData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="60%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #2d2d44", borderRadius: 8, color: "#e5e7eb" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map(d => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                      <span className="text-foreground font-medium ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No execution data yet</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Recent Activity (24h)</h2>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-2">
              {stats.recentActivity.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0 text-sm">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === "success" ? "bg-emerald-500" : log.status === "error" ? "bg-red-500" : log.status === "blocked" ? "bg-orange-500" : "bg-yellow-500"}`} />
                  <span className="text-foreground font-medium truncate flex-1">{log.scriptName ?? "Unknown Script"}</span>
                  <span className="text-muted-foreground text-xs">{log.executorName ?? "Unknown"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${log.status === "success" ? "bg-emerald-500/20 text-emerald-400" : log.status === "error" ? "bg-red-500/20 text-red-400" : log.status === "blocked" ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"}`}>{log.status}</span>
                  <span className="text-muted-foreground text-xs">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">No recent activity in the last 24 hours</div>
          )}
        </div>

        {/* Recent Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Recent Alerts</h2>
            <div className="space-y-2">
              {alerts.map((alert: any) => (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${!alert.isRead ? "bg-primary/5 border-primary/20" : "border-border/50"}`}>
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alert.type === "bypass_attempt" ? "text-yellow-500" : alert.type === "new_ban" ? "text-red-500" : "text-blue-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{new Date(alert.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
