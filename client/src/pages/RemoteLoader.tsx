import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Globe, Plus, Trash2, Copy, Check, Key, Upload, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function RemoteLoader() {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [requireHwid, setRequireHwid] = useState(false);
  const [content, setContent] = useState("");
  const [fileType, setFileType] = useState<"lua"|"txt">("lua");
  const [copiedKey, setCopiedKey] = useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: loaders, isLoading, refetch } = trpc.remoteLoaders.list.useQuery();
  const createMut = trpc.remoteLoaders.create.useMutation({ onSuccess: (data) => { toast.success(`Loader created! Key: ${data.accessKey}`); setShowAdd(false); setName(""); setContent(""); refetch(); } });
  const deleteMut = trpc.remoteLoaders.delete.useMutation({ onSuccess: () => { toast.success("Loader deleted"); refetch(); } });
  const updateMut = trpc.remoteLoaders.update.useMutation({ onSuccess: () => { toast.success("Loader updated"); refetch(); } });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "lua") setFileType("lua");
    else if (ext === "txt") setFileType("txt");
    const reader = new FileReader();
    reader.onload = ev => setContent(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const copyKey = (key: string) => { navigator.clipboard.writeText(key); setCopiedKey(key); setTimeout(() => setCopiedKey(null), 2000); };

  const getLoadUrl = (key: string) => `${window.location.origin}/api/trpc/remoteLoaders.fetch?input=${encodeURIComponent(JSON.stringify({key}))}`;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-foreground">Remote Loader</h1><p className="text-muted-foreground text-sm mt-1">Create access keys to load scripts remotely from your executor</p></div>
          <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"><Plus className="w-4 h-4" />New Loader</Button>
        </div>

        {/* API Usage */}
        <div className="bg-card border border-primary/20 rounded-xl p-5 bg-primary/5">
          <h3 className="text-sm font-semibold text-primary mb-2 flex items-center gap-2"><Key className="w-4 h-4" />How to Use</h3>
          <p className="text-xs text-muted-foreground mb-2">Use the following Lua snippet in your executor to load a remote script:</p>
          <pre className="bg-secondary rounded-lg p-3 text-xs font-mono text-emerald-400/80 overflow-x-auto">{`-- In your executor:
local HttpService = game:GetService("HttpService")
local url = "YOUR_LOADER_URL_HERE"
local response = HttpService:GetAsync(url)
loadstring(response)()`}</pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-5 h-40 animate-pulse" />)
          ) : (loaders ?? []).length === 0 ? (
            <div className="col-span-3 bg-card border border-border rounded-xl p-12 text-center">
              <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No loaders yet. Create your first remote loader.</p>
            </div>
          ) : (
            (loaders ?? []).map((loader: any) => (
              <div key={loader.id} className={`bg-card border rounded-xl p-5 transition-all ${loader.isActive ? "border-border hover:border-primary/40" : "border-border/50 opacity-60"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Globe className="w-4 h-4 text-primary" /></div>
                  <div className="flex items-center gap-2">
                    {loader.requireHwid && <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">HWID</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${loader.isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-secondary text-muted-foreground border border-border"}`}>{loader.isActive ? "Active" : "Inactive"}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground">{loader.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{loader.executionCount} executions</p>
                <div className="mt-3 flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
                  <code className="text-xs font-mono text-muted-foreground flex-1 truncate">{loader.accessKey}</code>
                  <button onClick={() => copyKey(loader.accessKey)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                    {copiedKey === loader.accessKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => updateMut.mutate({ id: loader.id, isActive: !loader.isActive })} className="border-border text-foreground hover:bg-secondary gap-1.5 text-xs flex-1">
                    {loader.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}{loader.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ id: loader.id })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" />New Remote Loader</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label className="text-foreground">Loader Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="My Script Loader" className="bg-secondary border-border text-foreground" /></div>
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div><p className="text-sm font-medium text-foreground">Require HWID</p><p className="text-xs text-muted-foreground">Only allow registered HWIDs</p></div>
              <Switch checked={requireHwid} onCheckedChange={setRequireHwid} />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Script File (.lua or .txt)</Label>
              <input ref={fileRef} type="file" accept=".lua,.txt" onChange={handleFile} className="hidden" />
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-secondary gap-2"><Upload className="w-4 h-4" />{content ? "File loaded ✓" : "Upload .lua or .txt file"}</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} className="border-border text-foreground hover:bg-secondary">Cancel</Button>
            <Button onClick={() => createMut.mutate({ name, requireHwid, content: content || undefined, fileType })} disabled={!name || createMut.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {createMut.isPending ? "Creating..." : "Create Loader"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
