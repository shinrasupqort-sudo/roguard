import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Code2, Upload, Download, Shield, Zap, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export default function Obfuscator() {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<"lua"|"txt">("lua");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [opts, setOpts] = useState({ stringLayers: 3, constantArray: true, antiTamper: true, envChecks: true, variableRename: true, controlFlow: true, deadCode: false });
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: settings } = trpc.settings.get.useQuery();
  const obfMut = trpc.scripts.obfuscate.useMutation({
    onSuccess: (data) => { setResult(data.obfuscated); toast.success("Script obfuscated successfully!"); },
    onError: (err) => toast.error(err.message),
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "lua") setFileType("lua");
    else if (ext === "txt") setFileType("txt");
    const reader = new FileReader();
    reader.onload = ev => setContent(ev.target?.result as string ?? "");
    reader.readAsText(file);
  };

  const handleCopy = () => { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `obfuscated_${fileName || "script"}.lua`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Script Obfuscator</h1>
          <p className="text-muted-foreground text-sm mt-1">Protect your Lua scripts with multi-layer encryption and anti-tamper checks</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Options */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <h2 className="text-base font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Protection Options</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground text-sm mb-2 block">String Encryption Layers: {opts.stringLayers}</Label>
                <Slider value={[opts.stringLayers]} onValueChange={([v]) => setOpts(o => ({...o, stringLayers: v}))} min={1} max={3} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>1 (Fast)</span><span>3 (Max)</span></div>
              </div>
              {[
                { key: "constantArray", label: "ConstantArray Encryption", desc: "2-layer constant array obfuscation" },
                { key: "antiTamper", label: "Anti-Tamper Checks", desc: "Crash deobfuscators instantly" },
                { key: "envChecks", label: "ENV Detection", desc: "Roblox environment validation" },
                { key: "variableRename", label: "Variable Renaming", desc: "Rename all local variables" },
                { key: "controlFlow", label: "Control Flow", desc: "Obfuscate execution flow" },
                { key: "deadCode", label: "Dead Code Injection", desc: "Inject misleading code" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-start justify-between gap-3">
                  <div><p className="text-sm font-medium text-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
                  <Switch checked={opts[key as keyof typeof opts] as boolean} onCheckedChange={v => setOpts(o => ({...o, [key]: v}))} />
                </div>
              ))}
            </div>
          </div>

          {/* Input / Output */}
          <div className="lg:col-span-2 space-y-4">
            {/* Input */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
                <span className="text-sm font-medium text-foreground">Input Script</span>
                <div className="flex gap-2">
                  <input ref={fileRef} type="file" accept=".lua,.txt" onChange={handleFile} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="border-border text-foreground hover:bg-secondary gap-1.5 text-xs"><Upload className="w-3.5 h-3.5" />{fileName || "Upload .lua/.txt"}</Button>
                </div>
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="-- Paste your Lua script here or upload a file above...\n\nprint('Hello, World!')"
                className="w-full h-64 p-4 bg-transparent text-sm font-mono text-foreground resize-none outline-none placeholder:text-muted-foreground/50"
              />
            </div>

            <Button onClick={() => obfMut.mutate({ content, name: fileName || undefined, fileType, options: opts })} disabled={!content || obfMut.isPending} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-11">
              {obfMut.isPending ? <><Zap className="w-4 h-4 animate-pulse" />Obfuscating...</> : <><Zap className="w-4 h-4" />Obfuscate Script</>}
            </Button>

            {/* Output */}
            {result && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
                  <span className="text-sm font-medium text-emerald-400 flex items-center gap-2"><Check className="w-4 h-4" />Obfuscated Output</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy} className="border-border text-foreground hover:bg-secondary gap-1.5 text-xs">
                      {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload} className="border-border text-foreground hover:bg-secondary gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />Download</Button>
                  </div>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-400/80 overflow-auto max-h-64 leading-relaxed">{result}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
