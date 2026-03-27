"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, FileText, UploadCloud } from "lucide-react";

export default function FileUploader({ fileName, onTextLoaded }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const hasFile = Boolean(fileName);

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
    <div className='space-y-5'>
      <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
        <div className='w-full'>
          <div className='flex justify-between items-center w-full'>
            <div className='section-kicker'>
              <FileText size={14} />
              Lyrics Input
            </div>
            <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
              <a
                href='/obs-lyrics-template.txt'
                download='obs-lyrics-template.txt'
                className='action-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-accent dark:text-slate-200'
              >
                <Download size={14} />
                Download Template
              </a>
              <div className='rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'>
                TXT only
              </div>
            </div>
          </div>
          <h2 className='mt-4 text-2xl font-semibold text-ink dark:text-slate-100'>Lyrics File Upload</h2>
          <p className='mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300'>Drop in a `.txt` lyrics file and we will detect songs, splits, and scene blocks automatically.</p>
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
          hasFile
            ? "border-emerald-400/60 bg-emerald-50/70 shadow-[0_0_0_1px_rgba(16,185,129,0.12)] dark:border-emerald-400/30 dark:bg-emerald-950/20"
            : dragActive
              ? "border-accent bg-emerald-50/70 dark:bg-emerald-900/20"
              : ""
        }`}
      >
        {hasFile ? (
          <div className='w-full max-w-3xl rounded-[1.5rem] border border-emerald-200/70 bg-white/55 p-5 text-left shadow-[0_18px_50px_rgba(15,118,110,0.08)] backdrop-blur sm:p-6 dark:border-emerald-400/15 dark:bg-slate-950/35'>
            <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex min-w-0 items-start gap-4'>
                <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200'>
                  <CheckCircle2 size={22} />
                </div>
                <div className='min-w-0'>
                  <div className='text-lg font-semibold text-slate-900 dark:text-slate-50'>Lyrics file ready</div>
                  <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>Uploaded successfully. You can now preview songs and generate OBS scenes.</p>
                  <div className='mt-3 inline-flex max-w-full items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200'>
                    <span className='text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400'>File</span>
                    <span className='ml-2 block max-w-[180px] truncate font-medium sm:max-w-[280px] md:max-w-[360px]'>{fileName}</span>
                  </div>
                </div>
              </div>
              <button
                type='button'
                onClick={() => inputRef.current?.click()}
                className='action-primary shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110'
              >
                Replace File
              </button>
            </div>
          </div>
        ) : (
          <div className='w-full max-w-3xl rounded-[1.5rem] border border-slate-200/70 bg-white/45 p-5 text-left shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6 dark:border-slate-700/60 dark:bg-slate-950/25'>
            <div className='flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex min-w-0 items-start gap-4'>
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    dragActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-accent/10 text-accent dark:bg-accent/15 dark:text-emerald-200"
                  }`}
                >
                  <UploadCloud size={22} />
                </div>
                <div className='min-w-0'>
                  <div className='text-lg font-semibold text-slate-900 dark:text-slate-50'>Upload your lyrics file</div>
                  <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
                    Drag and drop a <span className='font-semibold'>.txt</span> file here, or browse from your computer to begin parsing songs and scenes.
                  </p>
                  <div className='mt-3 inline-flex items-center rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-sm text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200'>
                    Plain text lyrics files only
                  </div>
                </div>
              </div>
              <button
                type='button'
                onClick={() => inputRef.current?.click()}
                className='action-primary shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110'
              >
                Choose Lyrics File
              </button>
            </div>
          </div>
        )}
        <input ref={inputRef} type='file' accept='.txt' onChange={onChange} className='hidden' />
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='metric-tile rounded-2xl p-4'>
          <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Expected format</div>
          <div className='mt-2 text-sm text-slate-700 dark:text-slate-200'>
            <code className='rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800'>Song-X Name</code> followed by{" "}
            <code className='rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800'>[ Song Title ]</code>
          </div>
        </div>
        <div className='metric-tile rounded-2xl p-4'>
          <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Scene split rule</div>
          <div className='mt-2 text-sm text-slate-700 dark:text-slate-200'>Two empty lines create a new OBS scene</div>
        </div>
      </div>
    </div>
  );
}
