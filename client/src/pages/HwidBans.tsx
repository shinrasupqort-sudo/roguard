import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { ShieldBan, Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function HwidBans() {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [hwid, setHwid] = useState("");
  const [reason, setReason] = useState("");
  const { data: bans, isLoading, refetch } = trpc.hwidBans.list.useQuery();
  const banMut = trpc.hwidBans.ban.useMutation({ onSuccess: () => { toast.success("HWID banned successfully"); setShowAdd(false); setHwid(""); setReason(""); refetch(); } });
  const unbanMut = trpc.hwidBans.unban.useMutation({ onSuccess: () => { toast.success("HWID unbanned"); refetch(); } });

  const filtered = (bans ?? []).filter((b: any) => !search || b.hwid.toLowerCase().includes(search.toLowerCase()) || b.reason?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-foreground">HWID Bans</h1><p className="text-muted-foreground text-sm mt-1">Manage hardware ID bans to block specific users</p></div>
          <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"><Plus className="w-4 h-4" />Add Ban</Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search HWID or reason..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-secondary border-border text-foreground" />
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/30">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">HWID</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Reason</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Banned At</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(3)].map((_, i) => <tr key={i} className="border-b border-border/50">{[...Array(4)].map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse" /></td>)}</tr>)
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">No HWID bans found</td></tr>
                ) : (
                  filtered.map((ban: any) => (
                    <tr key={ban.id} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground">{ban.hwid}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ban.reason ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(ban.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" onClick={() => unbanMut.mutate({ id: ban.id })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" />Unban
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShieldBan className="w-5 h-5 text-primary" />Add HWID Ban</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label className="text-foreground">Hardware ID (HWID)</Label><Input value={hwid} onChange={e => setHwid(e.target.value)} placeholder="Enter HWID to ban..." className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2"><Label className="text-foreground">Reason</Label><Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for ban..." className="bg-secondary border-border text-foreground" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} className="border-border text-foreground hover:bg-secondary">Cancel</Button>
            <Button onClick={() => banMut.mutate({ hwid, reason })} disabled={!hwid || !reason || banMut.isPending} className="bg-destructive hover:bg-destructive/90 text-white">
              {banMut.isPending ? "Banning..." : "Ban HWID"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
