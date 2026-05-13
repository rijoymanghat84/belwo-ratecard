"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Template {
  id: string;
  name: string;
  description: string;
  htmlContent: string;
  cssContent: string;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"html" | "css">("html");
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data);
        if (data.length > 0) selectTemplate(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectTemplate = useCallback(async (id: string) => {
    const res = await fetch(`/api/templates/${id}`);
    const t: Template = await res.json();
    setSelected(t);
    setName(t.name);
    setDesc(t.description ?? "");
    setHtml(t.htmlContent);
    setCss(t.cssContent);
  }, []);

  const updatePreview = useCallback(
    (htmlContent: string) => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        const res = await fetch("/api/templates/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ html: htmlContent }),
        });
        const data = await res.json();
        setPreviewHtml(data.html ?? "");
      }, 500);
    },
    []
  );

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/templates/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: desc,
          htmlContent: html,
          cssContent: css,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelected(updated);
        // refresh list
        setTemplates((prev) =>
          prev.map((t) => (t.id === updated.id ? { ...t, name: updated.name } : t))
        );
        alert("Template updated.");
      } else {
        alert("Failed to save.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Template",
          description: "",
          htmlContent: "<div>Hello {{clientName}}</div>",
          cssContent: "",
        }),
      });
      if (res.ok) {
        const created: Template = await res.json();
        setTemplates((prev) => [...prev, { id: created.id, name: created.name, description: created.description ?? "", htmlContent: "", cssContent: "" }]);
        selectTemplate(created.id);
      }
    } finally {
      setSaving(false);
    }
  };

  // Trigger preview on mount + html change
  useEffect(() => {
    if (html) updatePreview(html);
  }, [html, updatePreview]);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!selected) return <div className="p-8 text-gray-500">No templates found. Create one.</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold text-[#1e3a5f]">Templates</h1>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t.id)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                selected.id === t.id
                  ? "bg-[#1e3a5f] text-white"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="p-3 border-t">
          <button
            onClick={handleCreate}
            className="w-full py-2 text-sm border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-[#f47920] hover:text-[#f47920] transition-colors"
          >
            + New Template
          </button>
        </div>
      </aside>

      {/* Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
          <div className="flex items-center gap-4 flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-semibold border-none outline-none bg-transparent w-48 text-[#1e3a5f]"
              placeholder="Template name"
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="text-sm text-gray-500 border-none outline-none bg-transparent flex-1"
              placeholder="Description..."
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm hover:bg-[#2c5282] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b bg-gray-50 px-6">
          <button
            onClick={() => setActiveTab("html")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "html"
                ? "border-[#f47920] text-[#1e3a5f]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            HTML
          </button>
          <button
            onClick={() => setActiveTab("css")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "css"
                ? "border-[#f47920] text-[#1e3a5f]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            CSS
          </button>
        </div>

        <div className="flex-1 flex">
          {/* Code area */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeTab === "html" ? (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                className="flex-1 p-6 font-mono text-sm resize-none outline-none border-0 bg-[#1e1e2e] text-[#cdd6f4] leading-relaxed"
                spellCheck={false}
                placeholder="<!-- HTML template with {{variables}} -->"
              />
            ) : (
              <textarea
                value={css}
                onChange={(e) => setCss(e.target.value)}
                className="flex-1 p-6 font-mono text-sm resize-none outline-none border-0 bg-[#1e1e2e] text-[#cdd6f4] leading-relaxed"
                spellCheck={false}
                placeholder="/* CSS styles */"
              />
            )}
          </div>

          {/* Preview pane */}
          <div className="w-[480px] border-l bg-white flex flex-col">
            <div className="px-4 py-2 border-b bg-gray-50 text-xs text-gray-500 font-medium">
              Preview (sample data)
            </div>
            <div className="flex-1 overflow-hidden">
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                  title="Template Preview"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="p-4 text-gray-400 text-sm italic">Type HTML to see preview...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
