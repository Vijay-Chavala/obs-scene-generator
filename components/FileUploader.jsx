"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Download, FileText, UploadCloud, X } from "lucide-react";

const TEMPLATE_MODAL_PREFERENCE_KEY = "show-template-download-modal";

export default function FileUploader({ fileName, onTextLoaded }) {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [skipTemplateModalPrompt, setSkipTemplateModalPrompt] = useState(false);
  const hasFile = Boolean(fileName);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedPreference = window.localStorage.getItem(TEMPLATE_MODAL_PREFERENCE_KEY);
    if (storedPreference === "hide") {
      setSkipTemplateModalPrompt(true);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!isTemplateModalOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsTemplateModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isTemplateModalOpen]);

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

  const triggerTemplateDownload = () => {
    if (typeof window === "undefined") return;
    const link = document.createElement("a");
    link.href = "/obs-lyrics-template.txt";
    link.download = "obs-lyrics-template.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleTemplateButtonClick = () => {
    if (skipTemplateModalPrompt) {
      triggerTemplateDownload();
      return;
    }
    setIsTemplateModalOpen(true);
  };

  const handleTemplateDownload = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TEMPLATE_MODAL_PREFERENCE_KEY, skipTemplateModalPrompt ? "hide" : "show");
    }
    setIsTemplateModalOpen(false);
    triggerTemplateDownload();
  };

  const templateModal =
    isTemplateModalOpen && typeof document !== "undefined"
      ? createPortal(
          <div className='fixed inset-0 z-[100]'>
            <div className='absolute inset-0 bg-slate-950/68 backdrop-blur-lg' aria-hidden='true' onClick={() => setIsTemplateModalOpen(false)} />
            <div className='relative flex h-full w-full items-center justify-center p-4 sm:p-6'>
              <div
                role='dialog'
                aria-modal='true'
                aria-labelledby='template-modal-title'
                className='relative z-10 w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(14,27,43,0.98),rgba(8,17,31,0.98))] text-left shadow-[0_40px_120px_rgba(2,8,23,0.55)]'
              >
                <div className='max-h-[88vh] overflow-y-auto'>
                  <div className='border-b border-white/10 bg-white/[0.03] px-6 py-5 sm:px-8'>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <div className='section-kicker border-0 bg-emerald-500/10 text-emerald-200'>
                          <Download size={14} />
                          Template Guide
                        </div>
                        <p className='mt-2 text-sm leading-7 text-slate-300'>
                          Use this template when preparing new lyrics files. It keeps song parsing reliable and makes scene generation work exactly as expected.
                        </p>
                      </div>
                      <button
                        type='button'
                        onClick={() => setIsTemplateModalOpen(false)}
                        className='inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white'
                        aria-label='Close template guide'
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  <div className='p-3'>
                    <div className='grid gap-4 lg:grid-cols-2'>
                      <div className='rounded-[1.5rem] border border-white/10 bg-white/5 p-5'>
                        <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>Format rules</div>
                        <ul className='mt-4 space-y-3 text-sm leading-6 text-slate-200'>
                          <li>
                            Start each song with <code className='rounded bg-white/10 px-1.5 py-0.5 text-xs'>Song-X Name</code>.
                          </li>
                          <li>
                            Place the title on the next line inside brackets like <code className='rounded bg-white/10 px-1.5 py-0.5 text-xs'>[ Way Maker ]</code>.
                          </li>
                          <li>Keep lyrics below the title.</li>
                          <li>Two empty lines create a new OBS scene.</li>
                        </ul>
                      </div>

                      <div className='rounded-[1.5rem] border border-white/10 bg-white/5 p-5'>
                        <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>Example structure</div>
                        <pre className='mt-4 overflow-x-auto rounded-2xl bg-slate-950/70 p-4 text-xs leading-6 text-slate-200'>
                          {`Song-1 Name
[ Way Maker ]

You are here moving in our midst
I worship You
I worship You


You are Way Maker
Miracle Worker
Promise Keeper
Light in the darkness`}
                        </pre>
                      </div>
                    </div>

                    <div className='mt-6 flex items-center justify-between '>
                      <label className='flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200'>
                        <input
                          type='checkbox'
                          checked={skipTemplateModalPrompt}
                          onChange={(event) => {
                            const nextValue = event.target.checked;
                            setSkipTemplateModalPrompt(nextValue);
                            if (typeof window !== "undefined") {
                              window.localStorage.setItem(TEMPLATE_MODAL_PREFERENCE_KEY, nextValue ? "hide" : "show");
                            }
                          }}
                          className='h-4 w-4 rounded border-white/20 bg-transparent text-emerald-400 focus:ring-emerald-400'
                        />
                        <span>Don&apos;t show this again</span>
                      </label>
                      <div className='flex items-center gap-3'>
                        <button
                          type='button'
                          onClick={() => setIsTemplateModalOpen(false)}
                          className='action-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-accent'
                        >
                          Close
                        </button>
                        <button
                          type='button'
                          onClick={handleTemplateDownload}
                          className='action-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110'
                        >
                          <Download size={16} />
                          Download Template
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className='space-y-5'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div className='w-full'>
            <div className='flex items-center justify-between w-full'>
              <div className='section-kicker'>
                <FileText size={14} />
                Lyrics Input
              </div>
              <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
                <button
                  type='button'
                  onClick={handleTemplateButtonClick}
                  className='action-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-accent dark:text-slate-200'
                >
                  <Download size={14} />
                  Download Template
                </button>
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
      {templateModal}
    </>
  );
}
