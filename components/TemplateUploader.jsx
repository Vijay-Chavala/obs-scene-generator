"use client";

import { useRef, useState } from "react";
import { Layers3, ShieldCheck } from "lucide-react";

export default function TemplateUploader({ templateName, onTemplateLoaded }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onTemplateLoaded(reader.result, file.name);
    };
    reader.readAsText(file);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith(".json")) {
      handleFile(file);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="section-kicker">
            <Layers3 size={14} />
            OBS Template
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-ink dark:text-slate-100">
            OBS Template (Optional)
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Import a scene collection exported from OBS if you want to clone an
            existing setup and preserve your preferred text source behavior.
          </p>
        </div>
        <div className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-200">
          JSON
        </div>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`drop-shell flex min-h-[210px] flex-col items-center justify-center gap-4 rounded-[1.75rem] px-6 text-center transition ${
          dragActive ? "border-accent bg-emerald-50/70 dark:bg-emerald-900/20" : ""
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200">
          <Layers3 size={28} />
        </div>
        <div className="space-y-1">
          <div className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {templateName ? "Template loaded" : "Drop your OBS template JSON"}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {templateName ? templateName : "Optional, but useful for exact OBS matching"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="action-secondary rounded-full px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-accent dark:text-slate-200"
        >
          Choose Template
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          onChange={(event) => handleFile(event.target.files?.[0])}
          className="hidden"
        />
      </div>

      <div className="metric-tile flex items-start gap-3 rounded-2xl p-4">
        <div className="mt-0.5 rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
          <ShieldCheck size={16} />
        </div>
        <div className="text-sm leading-6 text-slate-700 dark:text-slate-200">
          The built-in template still works, but an exported OBS template usually gives
          the most accurate scene-item alignment and source settings.
        </div>
      </div>
    </div>
  );
}
