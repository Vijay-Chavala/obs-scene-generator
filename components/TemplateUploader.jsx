"use client";

import { useRef, useState } from "react";

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
    <div>
      <div className="mb-3">
        <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
          OBS Template (Optional)
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          For best compatibility, upload a scene collection exported from OBS.
        </p>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 text-center transition ${
          dragActive
            ? "border-accent bg-emerald-50/70 dark:bg-emerald-900/20"
            : "border-slate-200 bg-white/60 dark:border-slate-700 dark:bg-slate-900/40"
        }`}
      >
        <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {templateName ? `Loaded: ${templateName}` : "Drop your OBS template JSON"}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Only `.json` files are supported
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
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
    </div>
  );
}
