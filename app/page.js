"use client";

import { useMemo, useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { LyricsPreview } from "@/components/LyricsPreview";
import { SettingsPanel } from "@/components/SettingsPanel";
import { parseLyricsText } from "@/utils/parseLyrics";
import { generateOBSSceneCollection } from "@/utils/generateOBSJson";
import template from "@/templates/obsTemplate.json";

export default function HomePage() {
  const [lyricsText, setLyricsText] = useState("");
  const [settings, setSettings] = useState({
    canvasWidth: 1920,
    canvasHeight: 1080,
    fontFace: "Mandali",
    fontBold: true,
    fontSize: 256,
    color1: 4294967295,
    align: "center",
    valign: "center",
    extentsCx: 1600,
    extentsCy: 900
  });

  const songs = useMemo(() => {
    if (!lyricsText.trim()) return [];
    return parseLyricsText(lyricsText);
  }, [lyricsText]);

  return (
    <main className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">OBS Lyrics Scene Generator</h1>
        <p className="text-sm text-neutral-300">
          Convert a lyrics .txt into an OBS Scene Collection JSON.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <FileUploader onText={setLyricsText} />
          <SettingsPanel settings={settings} onChange={setSettings} />
          <button
            className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            disabled={!songs.length}
            onClick={() => {
              const collection = generateOBSSceneCollection({
                template,
                songs,
                settings
              });
              const blob = new Blob([JSON.stringify(collection, null, 2)], {
                type: "application/json"
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "obs-scene-collection.json";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Generate & Download JSON
          </button>
        </div>

        <LyricsPreview songs={songs} />
      </div>
    </main>
  );
}

