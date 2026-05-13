"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type N3 = [number, number, number];

interface BlendedRates { enabled: boolean; rates: { offshore: N3; onshore: N3 } }
interface PerRoleEntry { key: string; label: string; enabled: boolean; offshore: N3; onshore: N3 }
interface FlatRoleEntry { key: string; label: string; enabled: boolean; offshore: number; onshore: number }
interface BillingTerms { enabled: boolean; netPayment: number; lateFee: number }

interface Config {
  sections: {
    blended: BlendedRates;
    perRole: { enabled: boolean; roles: PerRoleEntry[] };
    flatRate: { enabled: boolean; roles: FlatRoleEntry[] };
    billingTerms: BillingTerms;
  };
}

interface Template { id: string; name: string; description?: string }
interface Preset { id: string; name: string; config: Config; isDefault: boolean }

const PRESET_FALLBACK: Preset = {
  id: "", name: "Loading...", isDefault: false,
  config: {
    sections: {
      blended: { enabled: true, rates: { offshore: [0, 0, 0], onshore: [0, 0, 0] } },
      perRole: { enabled: true, roles: [] },
      flatRate: { enabled: true, roles: [] },
      billingTerms: { enabled: true, netPayment: 30, lateFee: 1.5 },
    },
  },
};

export default function NewRateCardPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [presets, setPresets] = useState<Preset[]>([PRESET_FALLBACK]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [clientName, setClientName] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [config, setConfig] = useState<Config>(PRESET_FALLBACK.config);
  const [previewHtml, setPreviewHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    Promise.all([
      fetch("/api/templates").then((r) => r.json()),
      fetch("/api/presets").then((r) => r.json()),
    ]).then(([tpl, prs]) => {
      setTemplates(tpl);
      setPresets(prs);
      const def = prs.find((p: Preset) => p.isDefault) ?? prs[0];
      if (def) {
        setSelectedPreset(def.id);
        setConfig(def.config);
      }
    });
  }, []);

  useEffect(() => {
    applyPreset(selectedPreset);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPreset]);

  const applyPreset = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (p) setConfig(structuredClone(p.config));
  };

  const updatePreview = useCallback(
    (cfg: Config) => {
      clearTimeout(debounceRef.current);
      if (!selectedTemplate) return;
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/templates/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              templateId: selectedTemplate,
              clientName: clientName || "Client Name",
              validUntil: validUntil || undefined,
              config: cfg,
            }),
          });
          const data = await res.json();
          setPreviewHtml(data.html ?? "");
        } catch { /* preview fails silently */ }
      }, 500);
    },
    [selectedTemplate, clientName, validUntil]
  );

  const setCfg = (fn: (c: Config) => Config) => {
    setConfig((prev) => {
      const next = fn(structuredClone(prev));
      updatePreview(next);
      return next;
    });
  };

  const handleSave = async () => {
    if (!clientName || !selectedTemplate) {
      setError("Client name and template are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/ratecards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          templateId: selectedTemplate,
          config,
          validUntil: validUntil || undefined,
        }),
      });
      if (res.ok) {
        const card = await res.json();
        router.push(`/ratecards/${card.id}`);
      } else {
        const d = await res.json();
        setError(d.error ?? "Failed to create.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => n.toFixed(2);

  // Blended helpers
  const setBlend = (tier: number, loc: "offshore" | "onshore", v: number) =>
    setCfg((c) => { c.sections.blended.rates[loc][tier] = v; return c; });

  // Per-role helpers
  const setPR = (ri: number, tier: number, loc: "offshore" | "onshore", v: number) =>
    setCfg((c) => { (c.sections.perRole.roles[ri][loc] as N3)[tier] = v; return c; });

  const togglePR = (ri: number) =>
    setCfg((c) => { c.sections.perRole.roles[ri].enabled = !c.sections.perRole.roles[ri].enabled; return c; });

  // Flat-rate helpers
  const setFR = (ri: number, loc: "offshore" | "onshore", v: number) =>
    setCfg((c) => { c.sections.flatRate.roles[ri][loc] = v; return c; });

  const toggleFR = (ri: number) =>
    setCfg((c) => { c.sections.flatRate.roles[ri].enabled = !c.sections.flatRate.roles[ri].enabled; return c; });

  const pr = config.sections.perRole;
  const fr = config.sections.flatRate;
  const blend = config.sections.blended;
  const bill = config.sections.billingTerms;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Image src="/belwo-logo.png" alt="BelWo" width={120} height={30} />
          <h1 className="text-2xl font-bold text-[#1e3a5f]">New Rate Card</h1>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

        {/* Setup */}
        <section className="bg-white rounded-lg shadow-sm border p-5 mb-6">
          <h2 className="font-semibold text-[#1e3a5f] mb-4">Card Setup</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Client Name *</label>
              <input value={clientName} onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#f47920] focus:border-transparent outline-none" placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Valid Until</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#f47920] focus:border-transparent outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Template *</label>
              <select value={selectedTemplate} onChange={(e) => { setSelectedTemplate(e.target.value); updatePreview(config); }}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#f47920] focus:border-transparent outline-none">
                <option value="">Select template...</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Rate Preset</label>
              <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#f47920] focus:border-transparent outline-none">
                {presets.map((p) => <option key={p.id} value={p.id}>{p.name}{p.isDefault ? " (default)" : ""}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Blended Rates */}
        <SectionToggle label="Blended Rates" enabled={blend.enabled} onToggle={() => setCfg((c) => { c.sections.blended.enabled = !c.sections.blended.enabled; return c; })}>
          <p className="text-xs text-gray-500 mb-3">Rates applicable across all roles at blended level.</p>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 font-medium text-gray-600">Experience</th><th className="text-right py-2 font-medium text-gray-600">Offshore ($/hr)</th><th className="text-right py-2 font-medium text-gray-600">Onshore ($/hr)</th></tr></thead>
            <tbody>
              {["0–6 months", "6–12 months", "12+ months"].map((lbl, tier) => (
                <tr key={tier} className="border-b last:border-0">
                  <td className="py-2 text-gray-700">{lbl}</td>
                  {(["offshore", "onshore"] as const).map((loc) => (
                    <td key={loc} className="py-2 text-right">
                      <input type="number" step="0.01" value={blend.rates[loc][tier]}
                        onChange={(e) => setBlend(tier, loc, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1.5 border rounded text-right text-sm focus:ring-1 focus:ring-[#f47920] outline-none" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </SectionToggle>

        {/* Per-Role */}
        <SectionToggle label="Per-Role Rates" enabled={pr.enabled} onToggle={() => setCfg((c) => { c.sections.perRole.enabled = !c.sections.perRole.enabled; return c; })}>
          {pr.roles.map((role, ri) => (
            <div key={role.key} className="mb-5 last:mb-0 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-sm text-[#1e3a5f]">{role.label}</h3>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={role.enabled} onChange={() => togglePR(ri)} className="accent-[#f47920]" />
                    <span className="text-xs text-gray-500">Include in card</span>
                  </label>
                </div>
              </div>
              {role.enabled && (
                <div className="flex gap-2 flex-wrap">
                  {(["offshore", "onshore"] as const).map((loc) => (
                    <div key={loc} className="flex gap-2">
                      <span className="text-xs text-gray-500 leading-8 capitalize">{loc}:</span>
                      {[0, 1, 2].map((tier) => (
                        <input key={tier} type="number" step="0.01" value={(role[loc] as N3)[tier]}
                          onChange={(e) => setPR(ri, tier, loc, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1.5 border rounded text-right text-xs focus:ring-1 focus:ring-[#f47920] outline-none" placeholder={["0-6m", "6-12m", "12m+"][tier]} />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </SectionToggle>

        {/* Flat-Rate */}
        <SectionToggle label="Flat-Rate Roles" enabled={fr.enabled} onToggle={() => setCfg((c) => { c.sections.flatRate.enabled = !c.sections.flatRate.enabled; return c; })}>
          {fr.roles.map((role, ri) => (
            <div key={role.key} className="flex items-center justify-between py-3 border-b last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#1e3a5f] min-w-[180px]">{role.label}</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={role.enabled} onChange={() => toggleFR(ri)} className="accent-[#f47920]" />
                  <span className="text-xs text-gray-500">Include</span>
                </label>
              </div>
              {role.enabled && (
                <div className="flex gap-4">
                  <label className="text-xs text-gray-500">Offshore: <input type="number" step="0.01" value={role.offshore}
                    onChange={(e) => setFR(ri, "offshore", parseFloat(e.target.value) || 0)}
                    className="w-24 ml-1 px-2 py-1.5 border rounded text-right text-xs focus:ring-1 focus:ring-[#f47920] outline-none" />/hr</label>
                  <label className="text-xs text-gray-500">Onshore: <input type="number" step="0.01" value={role.onshore}
                    onChange={(e) => setFR(ri, "onshore", parseFloat(e.target.value) || 0)}
                    className="w-24 ml-1 px-2 py-1.5 border rounded text-right text-xs focus:ring-1 focus:ring-[#f47920] outline-none" />/hr</label>
                </div>
              )}
            </div>
          ))}
        </SectionToggle>

        {/* Billing Terms */}
        <SectionToggle label="Billing Terms" enabled={bill.enabled} onToggle={() => setCfg((c) => { c.sections.billingTerms.enabled = !c.sections.billingTerms.enabled; return c; })}>
          <div className="flex gap-8">
            <label className="text-sm text-gray-600">Net Payment (days): <input type="number" value={bill.netPayment}
              onChange={(e) => setCfg((c) => { c.sections.billingTerms.netPayment = parseInt(e.target.value) || 30; return c; })}
              className="w-20 ml-2 px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-[#f47920] outline-none" /></label>
            <label className="text-sm text-gray-600">Late Fee (%): <input type="number" step="0.1" value={bill.lateFee}
              onChange={(e) => setCfg((c) => { c.sections.billingTerms.lateFee = parseFloat(e.target.value) || 1.5; return c; })}
              className="w-20 ml-2 px-2 py-1.5 border rounded text-sm focus:ring-1 focus:ring-[#f47920] outline-none" /></label>
          </div>
        </SectionToggle>

        {/* Save */}
        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="px-8 py-2.5 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#2c5282] disabled:opacity-50 transition-colors">
            {saving ? "Saving..." : "Save Rate Card"}
          </button>
        </div>
      </div>

      {/* PREVIEW PANE */}
      <div className="w-[480px] bg-white border-l flex flex-col">
        <div className="px-5 py-3 border-b bg-gray-50 text-sm font-medium text-gray-700">Live Preview</div>
        <div className="flex-1 overflow-hidden">
          {previewHtml ? (
            <iframe srcDoc={previewHtml} className="w-full h-full border-0" title="Rate Card Preview" sandbox="allow-same-origin" />
          ) : (
            <div className="p-6 text-gray-400 text-sm text-center mt-20">
              Select a template and preset to see preview.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Collapsible section component */
function SectionToggle({ label, enabled, onToggle, children }: {
  label: string; enabled: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="bg-white rounded-lg shadow-sm border mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 bg-white cursor-pointer select-none"
        onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#1e3a5f]">{label}</span>
          <label className="flex items-center gap-1.5 cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" checked={enabled} onChange={onToggle} className="accent-[#f47920]" />
            <span className="text-xs text-gray-500">{enabled ? "Enabled" : "Disabled"}</span>
          </label>
        </div>
        <span className="text-gray-400 text-lg transition-transform" style={{ transform: open ? "rotate(0)" : "rotate(-90deg)" }}>▾</span>
      </div>
      {open && <div className="px-5 pb-5">{children}</div>}
    </section>
  );
}
