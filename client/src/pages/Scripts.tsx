import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { FileCode2, Plus, Trash2, Download, Code2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Scripts() {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [content, setContent] = useState("");
  const [fileType, setFileType] = useState<"lua"|"txt">("lua");
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: scripts, isLoading, refetch } = trpc.scripts.list.useQuery();
  const uploadMut = trpc.scripts.upload.useMutation({ onSuccess: () => { toast.success("Script uploaded!"); setShowAdd(false); setName(""); setDesc(""); setContent(""); refetch(); } });
  const deleteMut = trpc.scripts.delete.useMutation({ onSuccess: () => { toast.success("Script deleted"); refetch(); } });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "lua") setFileType("lua");
    else if (ext === "txt") setFileType("txt");
    if (!name) setName(file.name.replace(/\.(lua|txt)$/, ""));
    const reader = new FileReader();
    reader.onload = ev => setContent(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-foreground">Scripts</h1><p className="text-muted-foreground text-sm mt-1">Manage your Lua and text scripts</p></div>
          <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"><Plus className="w-4 h-4" />Upload Script</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-5 h-32 animate-pulse" />)
          ) : (scripts ?? []).length === 0 ? (
            <div className="col-span-3 bg-card border border-border rounded-xl p-12 text-center">
              <FileCode2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No scripts yet. Upload your first script to get started.</p>
            </div>
          ) : (
            (scripts ?? []).map((script: any) => (
              <div key={script.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><FileCode2 className="w-4 h-4 text-primary" /></div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">.{script.fileType}</span>
                </div>
                <h3 className="font-semibold text-foreground truncate">{script.name}</h3>
                {script.description && <p className="text-xs text-muted-foreground mt-1 truncate">{script.description}</p>}
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>{script.executionCount} executions</span>
                  <span>·</span>
                  <span>{new Date(script.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  {script.obfuscatedUrl && <a href={script.obfuscatedUrl} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary gap-1.5"><Download className="w-3.5 h-3.5" />Download</Button></a>}
                  <Button variant="ghost" size="sm" onClick={() => deleteMut.mutate({ id: script.id })} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 ml-auto"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="w-5 h-5 text-primary" />Upload Script</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label className="text-foreground">Script Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="My awesome script" className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2"><Label className="text-foreground">Description (optional)</Label><Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What does this script do?" className="bg-secondary border-border text-foreground" /></div>
            <div className="space-y-2">
              <Label className="text-foreground">Upload File (.lua or .txt)</Label>
              <input ref={fileRef} type="file" accept=".lua,.txt" onChange={handleFile} className="hidden" />
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-secondary gap-2"><Upload className="w-4 h-4" />{content ? "File loaded ✓" : "Choose .lua or .txt file"}</Button>
            </div>
            {content && (
              <div className="space-y-2"><Label className="text-foreground">Preview</Label><pre className="bg-secondary rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-auto max-h-32">{content.slice(0, 500)}{content.length > 500 ? "..." : ""}</pre></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)} className="border-border text-foreground hover:bg-secondary">Cancel</Button>
            <Button onClick={() => uploadMut.mutate({ name, description: desc || undefined, content, fileType })} disabled={!name || !content || uploadMut.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {uploadMut.isPending ? "Uploading..." : "Upload Script"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
