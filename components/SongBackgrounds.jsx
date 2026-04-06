"use client";

import { Film, Image as ImageIcon, MonitorPlay, SlidersHorizontal, Trash2, Type } from "lucide-react";
import FontSettingsFields from "@/components/FontSettingsFields";

const BACKGROUND_TYPES = [
  { value: "none", label: "None" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
];

export default function SongBackgrounds({
  parsedSongs,
  backgrounds,
  onChange,
  textSettingsMode,
  songFontSettings,
  onSongFontSettingsChange,
}) {
  const configuredCount = backgrounds.filter(
    (background) =>
      background?.type &&
      background.type !== "none" &&
      background.path?.trim()
  ).length;
  const isSpecificMode = textSettingsMode === "specific";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="section-kicker">
            <SlidersHorizontal size={14} />
            Song Overrides
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-ink dark:text-slate-100">
            Per-song Media and Font Settings
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Assign a dedicated image or video background to each parsed song. When
            specific font mode is enabled, each song can also use its own font
            styling while global layout settings remain intact.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            {configuredCount} backgrounds
          </div>
          <div className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            {isSpecificMode ? "Specific fonts enabled" : "Global fonts enabled"}
          </div>
        </div>
      </div>

      {parsedSongs.length ? (
        <>
          <div className="metric-tile rounded-2xl p-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
            Enter an OBS-readable local path such as{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
              C:/Media/WayMaker.mp4
            </code>{" "}
            or{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
              C:/Media/AmazingGrace.png
            </code>
            . Leave any song as <strong>None</strong> if you want lyrics-only scenes.
            {isSpecificMode ? (
              <>
                {" "}
                Song cards below now also include font controls for per-song styling.
              </>
            ) : null}
          </div>

          <div className="space-y-3">
            {parsedSongs.map((song, index) => {
              const background = backgrounds[index] || { type: "none", path: "" };
              const fontSettings = songFontSettings[index];
              const isActive = background.type !== "none";

              return (
                <div
                  key={`${song.songTitle}-${index}`}
                  className="rounded-[1.5rem] panel-shell p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold text-ink dark:text-slate-100">
                        {song.songTitle}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {song.scenes.length} scene(s)
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-100/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {background.type === "image"
                        ? "Image background"
                        : background.type === "video"
                          ? "Video background"
                          : "No background"}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      <MonitorPlay size={14} />
                      Background Media
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr_auto]">
                    <label className="block text-sm text-slate-600 dark:text-slate-300">
                      Background Type
                      <select
                        value={background.type}
                        onChange={(event) =>
                          onChange(index, { type: event.target.value })
                        }
                        className="input-shell mt-2 w-full rounded-2xl px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-accent dark:text-slate-100"
                      >
                        {BACKGROUND_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm text-slate-600 dark:text-slate-300">
                      OBS Media Path
                      <div className="relative mt-2">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                          {background.type === "image" ? (
                            <ImageIcon size={16} />
                          ) : (
                            <Film size={16} />
                          )}
                        </span>
                        <input
                          type="text"
                          value={background.path || ""}
                          onChange={(event) =>
                            onChange(index, { path: event.target.value })
                          }
                          placeholder={
                            isActive
                              ? background.type === "image"
                                ? "C:/Media/song-background.png"
                                : "C:/Media/song-background.mp4"
                              : "Select Image or Video first"
                          }
                          disabled={!isActive}
                          className="input-shell w-full rounded-2xl py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100"
                        />
                      </div>
                    </label>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => onChange(index, { type: "none" })}
                        className="action-secondary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-accent dark:text-slate-200"
                      >
                        <Trash2 size={16} />
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
                    This background will be placed behind lyrics for all{" "}
                    {song.scenes.length} scene(s) in this song.
                  </div>

                  {isSpecificMode && fontSettings ? (
                    <div className="setting-card mt-5 rounded-[1.35rem] p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        <Type size={14} />
                        Font Settings
                      </div>
                      <FontSettingsFields
                        settings={fontSettings}
                        onChange={(updates) => onSongFontSettingsChange(index, updates)}
                        dense
                        className="mt-4"
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200/80 bg-white/45 px-6 text-center dark:border-slate-700 dark:bg-slate-950/30">
          <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <MonitorPlay size={22} />
          </div>
          <div className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">
            Parse songs first
          </div>
          <div className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Once lyrics are parsed, you will be able to assign an optional image or
            video background to each song here, along with per-song font settings
            when specific mode is enabled.
          </div>
        </div>
      )}
    </div>
  );
}
