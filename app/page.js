"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Moon, Sparkles, Sun } from "lucide-react";
import FileUploader from "@/components/FileUploader";
import TemplateUploader from "@/components/TemplateUploader";
import LyricsPreview from "@/components/LyricsPreview";
import SettingsPanel from "@/components/SettingsPanel";
import { parseLyrics } from "@/utils/parseLyrics";
import { generateOBSJson } from "@/utils/generateOBSJson";

const DEFAULT_SETTINGS = {
  fontFamily: "Mandali",
  fontSize: 256,
  fontColor: "#ffffff",
  bold: true,
  alignment: "center",
  verticalOffset: 0,
  textBoxWidth: 1920,
  textBoxHeight: 1080,
  textMargin: 60,
  useCustomTextExtents: false,
};

export default function HomePage() {
  const [fileName, setFileName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateData, setTemplateData] = useState(null);
  const [parsedSongs, setParsedSongs] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [generatedJson, setGeneratedJson] = useState(null);
  const [status, setStatus] = useState("");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const nextTheme = stored || (prefersDark ? "dark" : "light");
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  const totalScenes = useMemo(
    () => parsedSongs.reduce((sum, song) => sum + song.scenes.length, 0),
    [parsedSongs]
  );

  const handleLyricsLoaded = (text, name) => {
    const parsed = parseLyrics(text);
    setFileName(name || "");
    setParsedSongs(parsed);
    setGeneratedJson(null);
    setStatus(
      parsed.length
        ? `Parsed ${parsed.length} song(s) and ${parsed.reduce(
            (sum, song) => sum + song.scenes.length,
            0
          )} scene(s).`
        : "No songs detected. Check the Song-X Name format."
    );
  };

  const handleTemplateLoaded = (text, name) => {
    try {
      const parsed = JSON.parse(text);
      setTemplateData(parsed);
      setTemplateName(name || "");
      setStatus("Template loaded. Scenes will be cloned from this file.");
    } catch (error) {
      setTemplateData(null);
      setTemplateName("");
      setStatus("Template file is not valid JSON.");
    }
  };

  const handleSettingsChange = (updates) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const handleGenerate = () => {
    if (!parsedSongs.length) {
      setStatus("Upload lyrics before generating scenes.");
      return;
    }
    try {
      const obsJson = generateOBSJson(parsedSongs, settings, templateData);
      setGeneratedJson(obsJson);
      setStatus("OBS scene collection generated. Ready to download.");
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
    const blob = new Blob([JSON.stringify(generatedJson, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "church-lyrics-scenes.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Download started.");
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
    <div className="min-h-screen px-6 py-12">
      <header className="mx-auto mb-10 max-w-6xl">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-card transition hover:border-accent dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? "Light" : "Dark"}</span>
          </button>
        </div>
        <h1 className="mt-4 font-display text-4xl font-semibold text-ink dark:text-slate-100 md:text-5xl">
          Church Lyrics Scene Generator
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          Automatically convert worship lyrics into OBS scenes with clean text styling
          and import-ready JSON.
        </p>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        <section className="space-y-6">
          <div className="rounded-3xl card-surface p-6 shadow-card">
            <FileUploader fileName={fileName} onTextLoaded={handleLyricsLoaded} />
          </div>
          <div className="rounded-3xl card-surface p-6 shadow-card">
            <TemplateUploader
              templateName={templateName}
              onTemplateLoaded={handleTemplateLoaded}
            />
          </div>
          <div className="rounded-3xl card-surface p-6 shadow-card">
            <LyricsPreview parsedSongs={parsedSongs} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl card-surface p-6 shadow-card">
            <SettingsPanel settings={settings} onChange={handleSettingsChange} />
          </div>
          <div className="rounded-3xl card-surface p-6 shadow-card">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
                  Scene Generation
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {parsedSongs.length
                    ? `${parsedSongs.length} song(s) detected, ${totalScenes} scene(s) ready.`
                    : "Upload a lyrics file to begin."}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <Sparkles size={18} />
                  Generate OBS Scenes
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <Download size={18} />
                  Download Scene Collection
                </button>
              </div>
              {status ? (
                <div className="rounded-2xl bg-parchment px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {status}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
