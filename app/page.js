"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, LayoutTemplate, Moon, Music4, RotateCcw, Sun } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import TemplateUploader from "@/components/TemplateUploader";
import LyricsPreview from "@/components/LyricsPreview";
import SongBackgrounds from "@/components/SongBackgrounds";
import SettingsPanel from "@/components/SettingsPanel";
import {
  DEFAULT_SETTINGS,
  createSongFontSettings,
  extractFontSettings,
} from "@/lib/textSettings";
import { parseLyrics } from "@/utils/parseLyrics";
import { generateOBSJson } from "@/utils/generateOBSJson";

const EMPTY_SONG_BACKGROUND = {
  type: "none",
  path: "",
};

export default function HomePage() {
  const [fileName, setFileName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateData, setTemplateData] = useState(null);
  const [parsedSongs, setParsedSongs] = useState([]);
  const [songBackgrounds, setSongBackgrounds] = useState([]);
  const [settings, setSettings] = useState({ ...DEFAULT_SETTINGS });
  const [textSettingsMode, setTextSettingsMode] = useState("global");
  const [songFontSettings, setSongFontSettings] = useState([]);
  const [songFontSettingsTouched, setSongFontSettingsTouched] = useState(false);
  const [generatedJson, setGeneratedJson] = useState(null);
  const [status, setStatus] = useState("");
  const [theme, setTheme] = useState("dark");
  const [uploadResetKey, setUploadResetKey] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("theme");
    const nextTheme = stored === "light" || stored === "dark" ? stored : "dark";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const totalScenes = useMemo(() => parsedSongs.reduce((sum, song) => sum + song.scenes.length, 0), [parsedSongs]);
  const configuredBackgrounds = useMemo(() => songBackgrounds.filter((background) => background?.type && background.type !== "none" && background.path?.trim()).length, [songBackgrounds]);
  const hasTemplate = Boolean(templateData);
  const hasGeneratedJson = Boolean(generatedJson);

  const handleLyricsLoaded = (text, name) => {
    const parsed = parseLyrics(text);
    setFileName(name || "");
    setParsedSongs(parsed);
    setSongBackgrounds(parsed.map(() => ({ ...EMPTY_SONG_BACKGROUND })));
    setSongFontSettings(createSongFontSettings(parsed, settings));
    setSongFontSettingsTouched(false);
    setGeneratedJson(null);
    setStatus(parsed.length ? `Parsed ${parsed.length} song(s) and ${parsed.reduce((sum, song) => sum + song.scenes.length, 0)} scene(s).` : "No songs detected. Check the Song-X Name format.");
  };

  const handleTemplateLoaded = (text, name) => {
    try {
      const parsed = JSON.parse(text);
      const hasObsStructure =
        Array.isArray(parsed?.sources) || Array.isArray(parsed?.scenes);
      if (!hasObsStructure) {
        setTemplateData(null);
        setTemplateName("");
        setStatus("Uploaded JSON is not a valid OBS scene collection.");
        return;
      }
      setTemplateData(parsed);
      setTemplateName(name || "");
      setStatus("Existing OBS scene collection loaded. New lyrics scenes will be appended without changing your current scenes.");
    } catch (error) {
      setTemplateData(null);
      setTemplateName("");
      setStatus("OBS scene collection file is not valid JSON.");
    }
  };

  const handleSettingsChange = (updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
    setGeneratedJson(null);
  };

  const handleTextSettingsModeChange = (mode) => {
    setTextSettingsMode(mode);
    if (mode === "specific" && !songFontSettingsTouched && parsedSongs.length) {
      setSongFontSettings(createSongFontSettings(parsedSongs, settings));
    }
    setGeneratedJson(null);
  };

  const handleSongBackgroundChange = (songIndex, updates) => {
    setSongBackgrounds((prev) =>
      parsedSongs.map((_, index) => {
        const current = prev[index] || EMPTY_SONG_BACKGROUND;
        if (index !== songIndex) {
          return current;
        }
        const next = { ...current, ...updates };
        if (next.type === "none") {
          return { ...EMPTY_SONG_BACKGROUND };
        }
        return next;
      }),
    );
    setGeneratedJson(null);
  };

  const handleSongFontSettingsChange = (songIndex, updates) => {
    setSongFontSettings((prev) =>
      parsedSongs.map((_, index) => {
        const current = prev[index] || extractFontSettings(settings);
        if (index !== songIndex) {
          return current;
        }
        return { ...current, ...updates };
      })
    );
    setSongFontSettingsTouched(true);
    setGeneratedJson(null);
  };

  const handleGenerate = () => {
    if (!parsedSongs.length) {
      setStatus("Upload lyrics before generating scenes.");
      return;
    }
    const invalidBackgroundIndex = songBackgrounds.findIndex((background) => background?.type && background.type !== "none" && !background.path?.trim());
    if (invalidBackgroundIndex >= 0) {
      setStatus(`Add a valid media path for ${parsedSongs[invalidBackgroundIndex]?.songTitle || "the selected song"} or set its background to None.`);
      return;
    }
    try {
      const obsJson = generateOBSJson(
        parsedSongs,
        settings,
        templateData,
        songBackgrounds,
        songFontSettings,
        textSettingsMode
      );
      setGeneratedJson(obsJson);
      setStatus(
        templateData
          ? "Merged OBS scene collection generated. Ready to download."
          : "OBS lyrics scene collection generated. Ready to download."
      );
    } catch (error) {
      const message = error?.message || "Unknown error";
      setStatus(`Generation failed: ${message}`);
    }
  };

  const handleDownload = () => {
    if (!generatedJson) {
      setStatus("Generate the scene collection first.");
      return;
    }

    const now = new Date();
    const parts = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
      String(now.getSeconds()).padStart(2, "0"),
    ];
    const downloadFileName = `church-lyrics-scenes-${parts[0]}-${parts[1]}-${parts[2]}-${parts[3]}-${parts[4]}-${parts[5]}.json`;

    const blob = new Blob([JSON.stringify(generatedJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus(`Download started: ${downloadFileName}`);
  };

  const handleReset = () => {
    setFileName("");
    setTemplateName("");
    setTemplateData(null);
    setParsedSongs([]);
    setSongBackgrounds([]);
    setTextSettingsMode("global");
    setSongFontSettings([]);
    setSongFontSettingsTouched(false);
    setSettings({ ...DEFAULT_SETTINGS });
    setGeneratedJson(null);
    setStatus("Workspace reset. Upload lyrics to start again.");
    setUploadResetKey((prev) => prev + 1);
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("theme", nextTheme);
      document.documentElement.classList.toggle("dark", nextTheme === "dark");
    }
  };

  const isDark = theme === "dark";

  return (
    <div className='relative min-h-screen overflow-hidden  py-6 sm:px-6 lg:px-10 lg:py-10'>
      <div className='pointer-events-none absolute inset-0 opacity-90'>
        <div className='absolute left-[-10rem] top-16 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl dark:bg-emerald-500/10' />
        <div className='absolute right-[-6rem] top-0 h-80 w-80 rounded-full bg-amber-200/30 blur-3xl dark:bg-cyan-500/10' />
        <div className='absolute bottom-10 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky-200/20 blur-3xl dark:bg-sky-500/10' />
      </div>

      <header className='relative mx-auto mb-8 max-w-[88rem]'>
        <div className='hero-frame rounded-[2rem] p-6 sm:p-8 lg:p-10'>
          <div className='pointer-events-auto absolute top-6 right-6 z-10 sm:top-8 sm:right-8 xl:hidden'>
            <button
              type='button'
              onClick={toggleTheme}
              className='action-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-accent dark:text-slate-200'
              aria-label='Toggle dark mode'
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              <span>{isDark ? "Light mode" : "Dark mode"}</span>
            </button>
          </div>
          <div className='grid gap-8 xl:grid-cols-[1.2fr_0.8fr]'>
            <div>
              <div className='flex items-center gap-3'>
                <img
                  src='/church-lyrics-generator.png'
                  alt='Church Lyrics Scene Generator logo'
                  className='h-11 w-11 rounded-2xl border border-white/20 bg-white/10 p-1.5 shadow-[0_18px_55px_rgba(15,23,42,0.18)] backdrop-blur dark:border-slate-700/50 dark:bg-slate-950/25'
                />
                <div className='section-kicker'>Worship Production Studio</div>
              </div>
              <h1 className='mt-4 max-w-3xl font-display text-3xl font-semibold leading-tight text-ink dark:text-slate-50 md:text-4xl'>Church Lyrics Scene Generator</h1>
              <p className='mt-4 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300'>
                Turn worship lyrics into polished OBS scene collections with faster parsing, cleaner defaults, and append-ready export.
              </p>
              <div className='mt-6 flex flex-wrap gap-3'>
                <div className='section-kicker border-0 bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/12 dark:text-emerald-200'>TXT parsing</div>
                <div className='section-kicker border-0 bg-cyan-100/80 text-cyan-800 dark:bg-cyan-500/12 dark:text-cyan-200'>OBS JSON export</div>
                <div className='section-kicker border-0 bg-amber-100/80 text-amber-800 dark:bg-amber-500/12 dark:text-amber-200'>Collection append</div>
              </div>

              <div className='mt-7 rounded-[1.5rem] panel-shell p-5'>
                <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400'>
                  <CheckCircle2 size={14} />
                  Quick Start
                </div>
                <ol className='mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200'>
                  <li className='flex items-center gap-3'>
                    <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-slate-100/70 text-slate-800 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-100'>
                      1
                    </span>
                    Upload your lyrics (TXT)
                  </li>
                  <li className='flex items-center gap-3'>
                    <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-slate-100/70 text-slate-800 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-100'>
                      2
                    </span>
                    Optionally load an existing OBS collection
                  </li>
                  <li className='flex items-center gap-3'>
                    <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-slate-100/70 text-slate-800 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-100'>
                      3
                    </span>
                    Review songs + choose media or font overrides
                  </li>
                  <li className='flex items-center gap-3'>
                    <span className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-slate-100/70 text-slate-800 dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-100'>
                      4
                    </span>
                    Generate + export scene collection
                  </li>
                </ol>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='hidden xl:flex justify-end'>
                <button
                  type='button'
                  onClick={toggleTheme}
                  className='action-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-accent dark:text-slate-200'
                  aria-label='Toggle dark mode'
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  <span>{isDark ? "Light mode" : "Dark mode"}</span>
                </button>
              </div>

              <div className='rounded-[1.75rem] panel-shell p-5 sm:p-6'>
                <div className='flex items-center justify-between gap-3'>
                  <div>
                    <div className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400'>Workspace Summary</div>
                    <div className='mt-1 text-lg font-semibold text-ink dark:text-slate-100'>Ready for Sunday service</div>
                  </div>
                  <div className='rounded-2xl bg-emerald-100/80 p-3 text-emerald-700 dark:bg-emerald-500/12 dark:text-emerald-200'>
                    <CheckCircle2 size={18} />
                  </div>
                </div>

                <div className='mt-5 grid grid-cols-2 gap-3'>
                  <div className='metric-tile rounded-2xl p-4'>
                    <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Songs</div>
                    <div className='mt-2 text-3xl font-semibold text-ink dark:text-slate-50'>{parsedSongs.length}</div>
                  </div>
                  <div className='metric-tile rounded-2xl p-4'>
                    <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Scenes</div>
                    <div className='mt-2 text-3xl font-semibold text-ink dark:text-slate-50'>{totalScenes}</div>
                  </div>
                  <div className='metric-tile rounded-2xl p-4'>
                    <div className='inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      <LayoutTemplate size={14} />
                      OBS Collection
                    </div>
                    <div className='mt-2 text-sm font-semibold text-ink dark:text-slate-100'>{hasTemplate ? "Append mode" : "Standalone"}</div>
                  </div>
                  <div className='metric-tile rounded-2xl p-4'>
                    <div className='inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      <Music4 size={14} />
                      Backgrounds
                    </div>
                    <div className='mt-2 text-sm font-semibold text-ink dark:text-slate-100'>{configuredBackgrounds} configured</div>
                  </div>
                </div>

                <div className='status-banner mt-5 rounded-2xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200'>
                  {status || "Upload lyrics to parse songs and prepare your OBS scene collection."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className='relative mx-auto grid max-w-[88rem] gap-6 xl:grid-cols-[1.05fr_0.95fr]'>
        <section className='space-y-6'>
          <div className='rounded-[1.75rem] card-surface p-6 sm:p-7'>
            <FileUploader key={`lyrics-${uploadResetKey}`} fileName={fileName} onTextLoaded={handleLyricsLoaded} />
          </div>
          <div className='rounded-[1.75rem] card-surface p-6 sm:p-7'>
            <TemplateUploader key={`template-${uploadResetKey}`} templateName={templateName} onTemplateLoaded={handleTemplateLoaded} />
          </div>
          <div className='rounded-[1.75rem] card-surface p-6 sm:p-7'>
            <LyricsPreview parsedSongs={parsedSongs} />
          </div>
        </section>

        <section className='space-y-6'>
          <div className='rounded-[1.75rem] card-surface p-6 sm:p-7'>
            <SettingsPanel
              settings={settings}
              onChange={handleSettingsChange}
              textSettingsMode={textSettingsMode}
              onTextSettingsModeChange={handleTextSettingsModeChange}
            />
          </div>
          <div className='rounded-[1.75rem] card-surface p-6 sm:p-7'>
            <SongBackgrounds
              parsedSongs={parsedSongs}
              backgrounds={songBackgrounds}
              onChange={handleSongBackgroundChange}
              textSettingsMode={textSettingsMode}
              songFontSettings={songFontSettings}
              onSongFontSettingsChange={handleSongFontSettingsChange}
            />
          </div>
          <div className='rounded-[1.75rem] card-surface p-6 sm:p-7'>
            <div className='flex flex-col gap-5'>
              <div>
                <div className='section-kicker'>
                  <Download size={14} />
                  Export Studio
                </div>
                <h2 className='mt-4 text-2xl font-semibold text-ink dark:text-slate-100'>Scene Generation</h2>
                <p className='mt-2 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300'>
                  {parsedSongs.length ? `${parsedSongs.length} song(s) detected and ${totalScenes} scene(s) are queued for export.` : "Upload a lyrics file to begin."}
                </p>
              </div>
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='metric-tile rounded-2xl p-4'>
                  <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Output file</div>
                  <div className='mt-2 text-sm font-semibold text-ink dark:text-slate-100'>church-lyrics-scenes.json</div>
                </div>
                <div className='metric-tile rounded-2xl p-4'>
                  <div className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Export mode</div>
                  <div className='mt-2 truncate text-sm font-semibold text-ink dark:text-slate-100'>{templateName ? `Append to ${templateName}` : "Standalone lyrics collection"}</div>
                </div>
              </div>
              <div className='flex flex-wrap gap-3'>
                <button
                  type='button'
                  onClick={handleGenerate}
                  className='action-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110'
                >
                  Generate OBS Scenes
                </button>
                <button
                  type='button'
                  onClick={handleDownload}
                  disabled={!hasGeneratedJson}
                  className='action-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200'
                >
                  <Download size={18} />
                  Download Scene Collection
                </button>
                <button
                  type='button'
                  onClick={handleReset}
                  className='action-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent dark:text-slate-200'
                >
                  <RotateCcw size={18} />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
