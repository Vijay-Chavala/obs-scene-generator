"use client";

import { useRef, useState } from "react";
import { FileText, UploadCloud } from "lucide-react";

export default function FileUploader({ fileName, onTextLoaded }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onTextLoaded(reader.result, file.name);
    };
    reader.readAsText(file);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file && file.name.toLowerCase().endsWith(".txt")) {
      handleFile(file);
    }
  };

  const onChange = (event) => {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="section-kicker">
            <FileText size={14} />
            Lyrics Input
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-ink dark:text-slate-100">
            Lyrics File Upload
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Drop in a `.txt` lyrics file and we will detect songs, splits, and scene
            blocks automatically.
          </p>
        </div>
        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200">
          TXT only
        </div>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`drop-shell flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-[1.75rem] px-6 text-center transition ${
          dragActive ? "border-accent bg-emerald-50/70 dark:bg-emerald-900/20" : ""
        }`}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent dark:bg-accent/15 dark:text-emerald-200">
          <UploadCloud size={28} />
        </div>
        <div className="space-y-1">
          <div className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {fileName ? "Lyrics file loaded" : "Drop your lyrics.txt here"}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {fileName ? fileName : "Or browse from your computer"}
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="action-primary rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Choose Lyrics File
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".txt"
          onChange={onChange}
          className="hidden"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="metric-tile rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Expected format
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
              Song-X Name
            </code>{" "}
            followed by{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
              [ Song Title ]
            </code>
          </div>
        </div>
        <div className="metric-tile rounded-2xl p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            Scene split rule
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            Two empty lines create a new OBS scene
          </div>
        </div>
      </div>
    </div>
  );
}
