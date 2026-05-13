"use client";

import { useState, useEffect, useCallback } from "react";

interface Role {
  key: string;
  label: string;
  enabled: boolean;
  offshore: number | number[];
  onshore: number | number[];
}

interface Section {
  enabled: boolean;
  roles?: Role[];
  rates?: { offshore: number[]; onshore: number[] };
  netPayment?: number;
  lateFee?: number;
}

interface PresetConfig {
  sections: {
    blended: Section & { rates: { offshore: number[]; onshore: number[] } };
    perRole: Section & { roles: Role[] };
    flatRate: Section & { roles: Role[] };
    billingTerms: Section & { netPayment: number; lateFee: number };
  };
}

function formatRate(v: number) {
  return v.toFixed(2);
}

export default function AdminPresetsPage() {
  const [preset, setPreset] = useState<{ id: string; config: PresetConfig } | null>(null);
  const [config, setConfig] = useState<PresetConfig | null>(null);
  const [pct, setPct] = useState("");
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/presets/default")
      .then((r) => r.json())
      .then((data) => {
        setPreset(data);
        setConfig(data.config);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleLock = useCallback((key: string) => {
    setLocked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const previewValue = useCallback(
    (original: number): number => {
      const p = parseFloat(pct);
      if (!p || isNaN(p)) return original;
      return original * (1 + p / 100);
    },
    [pct]
  );

  const handleSave = async () => {
    if (!preset || !config) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/presets/${preset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, name: `BelWo ${new Date().getFullYear()} Updated` }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPreset(updated);
        setPct("");
        setLocked(new Set());
        alert("New preset created. Old one archived.");
      } else {
        alert("Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  };

  const updateBlended = (tier: number, loc: "offshore" | "onshore", value: number) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.sections.blended.rates[loc][tier] = value;
      return next;
    });
  };

  const updatePerRoleRate = (roleIdx: number, tier: number, loc: "offshore" | "onshore", value: number) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      (next.sections.perRole.roles[roleIdx][loc] as number[])[tier] = value;
      return next;
    });
  };

  const updateFlatRate = (roleIdx: number, loc: "offshore" | "onshore", value: number) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.sections.flatRate.roles[roleIdx][loc] = value;
      return next;
    });
  };

  if (loading) return <div className="p-8 text-gray-500">Loading preset...</div>;
  if (!config) return <div className="p-8 text-red-500">No default preset found. Run seed first.</div>;

  const hasPct = !!parseFloat(pct);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Rate Preset Manager</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2c5282] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save as New Preset"}
        </button>
      </div>

      {/* Bulk update bar */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <label className="text-sm font-medium text-gray-700">Increase all unlocked rates by:</label>
        <div className="flex items-center gap-3 mt-2">
          <input
            type="number"
            step="0.5"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
            placeholder="e.g. 5"
            className="w-24 px-3 py-2 border rounded-md text-sm"
          />
          <span className="text-gray-500">%</span>
          {hasPct && <span className="text-xs text-gray-400">Preview shown below — save to persist</span>}
        </div>
      </div>

      {/* Blended Rates */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3 border-b-2 border-[#f47920] pb-1">
          Blended Rates
        </h2>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Experience</th>
              <th className="text-right p-2">Offshore ($/hr)</th>
              <th className="text-right p-2">Onshore ($/hr)</th>
              <th className="w-16 p-2">Lock</th>
            </tr>
          </thead>
          <tbody>
            {["0–6 months", "6–12 months", "12+ months"].map((label, tier) => (
              <tr key={tier} className="border-t">
                <td className="p-2">{label}</td>
                {(["offshore", "onshore"] as const).map((loc) => {
                  const val = config.sections.blended.rates[loc][tier];
                  const preview = previewValue(val);
                  const lockKey = `blended-${loc}-${tier}`;
                  const isLocked = locked.has(lockKey);
                  return (
                    <td key={loc} className="p-2 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={val}
                        disabled={isLocked}
                        onChange={(e) => updateBlended(tier, loc, parseFloat(e.target.value) || 0)}
                        className={`w-28 px-2 py-1 border rounded text-right text-sm ${isLocked ? "bg-gray-100 text-gray-400" : ""}`}
                      />
                      {hasPct && !isLocked && preview !== val && (
                        <div className="text-xs text-[#f47920]">→ {formatRate(preview)}</div>
                      )}
                    </td>
                  );
                })}
                <td className="p-2 text-center">
                  <button
                    onClick={() => toggleLock(`blended-${tier}`)}
                    className={`text-xs px-2 py-1 rounded ${locked.has(`blended-${tier}`) ? "bg-yellow-100 text-yellow-700" : "bg-gray-100"}`}
                  >
                    {locked.has(`blended-${tier}`) ? "🔒" : "🔓"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Per-Role Rates */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3 border-b-2 border-[#f47920] pb-1">
          Per-Role Rates
        </h2>
        {config.sections.perRole.roles.map((role, ri) => (
          <div key={role.key} className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm">{role.label}</h3>
              <button
                onClick={() => toggleLock(`perrole-${role.key}`)}
                className={`text-xs px-2 py-0.5 rounded ${locked.has(`perrole-${role.key}`) ? "bg-yellow-100 text-yellow-700" : "bg-gray-100"}`}
              >
                {locked.has(`perrole-${role.key}`) ? "🔒 All" : "🔓 All"}
              </button>
            </div>
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2"></th>
                  {(["offshore", "onshore"] as const).map((loc) =>
                    ["0–6m", "6–12m", "12m+"].map((t) => (
                      <th key={`${loc}-${t}`} className="text-right p-2">{loc} {t}</th>
                    ))
                  )}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2 text-gray-500 text-xs">Rate</td>
                  {(["offshore", "onshore"] as const).flatMap((loc) =>
                    [0, 1, 2].map((tier) => {
                      const val = (role[loc] as number[])[tier];
                      const preview = previewValue(val);
                      const isLocked = locked.has(`perrole-${role.key}`);
                      return (
                        <td key={`${loc}-${tier}`} className="p-1 text-right">
                          <input
                            type="number"
                            step="0.01"
                            value={val}
                            disabled={isLocked}
                            onChange={(e) => updatePerRoleRate(ri, tier, loc, parseFloat(e.target.value) || 0)}
                            className={`w-24 px-2 py-1 border rounded text-right text-sm ${isLocked ? "bg-gray-100 text-gray-400" : ""}`}
                          />
                          {hasPct && !isLocked && preview !== val && (
                            <div className="text-xs text-[#f47920]">→ {formatRate(preview)}</div>
                          )}
                        </td>
                      );
                    })
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* Flat-Rate Roles */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3 border-b-2 border-[#f47920] pb-1">
          Flat-Rate Roles
        </h2>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-2">Role</th>
              <th className="text-right p-2">Offshore ($/hr)</th>
              <th className="text-right p-2">Onshore ($/hr)</th>
              <th className="w-16 p-2">Lock</th>
            </tr>
          </thead>
          <tbody>
            {config.sections.flatRate.roles.map((role, ri) => {
              const lockKey = `flat-${role.key}`;
              const isLocked = locked.has(lockKey);
              return (
                <tr key={role.key} className="border-t">
                  <td className="p-2">{role.label}</td>
                  {(["offshore", "onshore"] as const).map((loc) => {
                    const val = role[loc] as number;
                    const preview = previewValue(val);
                    return (
                      <td key={loc} className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={val}
                          disabled={isLocked}
                          onChange={(e) => updateFlatRate(ri, loc, parseFloat(e.target.value) || 0)}
                          className={`w-28 px-2 py-1 border rounded text-right text-sm ${isLocked ? "bg-gray-100 text-gray-400" : ""}`}
                        />
                        {hasPct && !isLocked && preview !== val && (
                          <div className="text-xs text-[#f47920]">→ {formatRate(preview)}</div>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center">
                    <button onClick={() => toggleLock(lockKey)} className={`text-xs px-2 py-1 rounded ${isLocked ? "bg-yellow-100 text-yellow-700" : "bg-gray-100"}`}>
                      {isLocked ? "🔒" : "🔓"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Billing Terms */}
      <section>
        <h2 className="text-lg font-semibold text-[#1e3a5f] mb-3 border-b-2 border-[#f47920] pb-1">
          Billing Terms
        </h2>
        <div className="flex gap-6 p-4 bg-gray-50 rounded-lg">
          <label className="text-sm">
            Net Payment (days):
            <input
              type="number"
              value={config.sections.billingTerms.netPayment}
              onChange={(e) =>
                setConfig((prev) => {
                  if (!prev) return prev;
                  const next = structuredClone(prev);
                  next.sections.billingTerms.netPayment = parseInt(e.target.value) || 30;
                  return next;
                })
              }
              className="w-20 ml-2 px-2 py-1 border rounded text-sm"
            />
          </label>
          <label className="text-sm">
            Late Fee (%):
            <input
              type="number"
              step="0.1"
              value={config.sections.billingTerms.lateFee}
              onChange={(e) =>
                setConfig((prev) => {
                  if (!prev) return prev;
                  const next = structuredClone(prev);
                  next.sections.billingTerms.lateFee = parseFloat(e.target.value) || 1.5;
                  return next;
                })
              }
              className="w-20 ml-2 px-2 py-1 border rounded text-sm"
            />
          </label>
        </div>
      </section>
    </div>
  );
}
