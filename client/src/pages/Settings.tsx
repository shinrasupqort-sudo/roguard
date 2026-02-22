import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Shield, Bell, Code2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Settings() {
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const updateMut = trpc.settings.update.useMutation({ onSuccess: () => toast.success("Settings saved!") });
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    obfStringLayers: 3, obfConstantArray: true, obfAntiTamper: true, obfEnvChecks: true,
    obfVariableRename: true, obfControlFlow: true, obfDeadCode: false,
    notifyBypassAttempt: true, notifyNewBan: true, notifySuspiciousActivity: true,
  });

  useEffect(() => {
    if (settings) setForm({
      obfStringLayers: settings.obfStringLayers,
      obfConstantArray: settings.obfConstantArray,
      obfAntiTamper: settings.obfAntiTamper,
      obfEnvChecks: settings.obfEnvChecks,
      obfVariableRename: settings.obfVariableRename,
      obfControlFlow: settings.obfControlFlow,
      obfDeadCode: settings.obfDeadCode,
      notifyBypassAttempt: settings.notifyBypassAttempt,
      notifyNewBan: settings.notifyNewBan,
      notifySuspiciousActivity: settings.notifySuspiciousActivity,
    });
  }, [settings]);

  const handleSave = () => {
    updateMut.mutate(form, { onSuccess: () => utils.settings.get.invalidate() });
  };

  if (isLoading) return <Layout><div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="bg-card border border-border rounded-xl p-5 h-32 animate-pulse" />)}</div></Layout>;

  return (
    <Layout>
      <div className="space-y-6 max-w-2xl">
        <div><h1 className="text-2xl font-bold text-foreground">Settings</h1><p className="text-muted-foreground text-sm mt-1">Configure default obfuscation options and notification preferences</p></div>

        {/* Obfuscation Settings */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-5">
          <h2 className="text-base font-semibold flex items-center gap-2"><Code2 className="w-4 h-4 text-primary" />Default Obfuscation Settings</h2>
          <div>
            <Label className="text-foreground text-sm mb-2 block">String Encryption Layers: {form.obfStringLayers}</Label>
            <Slider value={[form.obfStringLayers]} onValueChange={([v]) => setForm(f => ({...f, obfStringLayers: v}))} min={1} max={3} step={1} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>1 (Minimal)</span><span>3 (Maximum)</span></div>
          </div>
          {[
            { key: "obfConstantArray", label: "ConstantArray Encryption", desc: "2-layer constant array obfuscation" },
            { key: "obfAntiTamper", label: "Anti-Tamper Checks", desc: "Instantly crash deobfuscators" },
            { key: "obfEnvChecks", label: "ENV Detection", desc: "Roblox environment validation checks" },
            { key: "obfVariableRename", label: "Variable Renaming", desc: "Rename all local variable identifiers" },
            { key: "obfControlFlow", label: "Control Flow Obfuscation", desc: "Obfuscate script execution flow" },
            { key: "obfDeadCode", label: "Dead Code Injection", desc: "Inject misleading dead code blocks" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div><p className="text-sm font-medium text-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
              <Switch checked={form[key as keyof typeof form] as boolean} onCheckedChange={v => setForm(f => ({...f, [key]: v}))} />
            </div>
          ))}
        </div>

        {/* Notification Settings */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2"><Bell className="w-4 h-4 text-primary" />Alert Notifications</h2>
          {[
            { key: "notifyBypassAttempt", label: "Bypass Attempt Alerts", desc: "Get notified when someone tries to bypass your scripts" },
            { key: "notifyNewBan", label: "New HWID Ban Alerts", desc: "Get notified when a new HWID is banned" },
            { key: "notifySuspiciousActivity", label: "Suspicious Activity Alerts", desc: "Get notified about unusual execution patterns" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div><p className="text-sm font-medium text-foreground">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
              <Switch checked={form[key as keyof typeof form] as boolean} onCheckedChange={v => setForm(f => ({...f, [key]: v}))} />
            </div>
          ))}
        </div>

        <Button onClick={handleSave} disabled={updateMut.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 w-full sm:w-auto">
          <Save className="w-4 h-4" />{updateMut.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </Layout>
  );
}
