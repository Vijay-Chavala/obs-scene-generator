import { Music4, SquareStack } from "lucide-react";

export default function LyricsPreview({ parsedSongs }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="section-kicker">
            <SquareStack size={14} />
            Parse Review
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-ink dark:text-slate-100">
            Lyrics Preview
          </h2>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Review detected songs and confirm how the file has been split into OBS
            scenes before exporting.
          </p>
        </div>
        <div className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
          {parsedSongs.length} song(s)
        </div>
      </div>
      <div className="rounded-[1.75rem] panel-shell p-4 sm:p-5">
        {parsedSongs.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {parsedSongs.map((song) => (
              <div
                key={song.songTitle}
                className="metric-tile rounded-2xl p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-ink dark:text-slate-100">
                      {song.songTitle}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                      {song.scenes.length} scene(s)
                    </div>
                  </div>
                  <div className="rounded-xl bg-emerald-100/80 p-2 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                    <Music4 size={16} />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {song.scenes.map((scene, index) => (
                    <div
                      key={`${song.songTitle}-${index}`}
                      className="rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">Scene {index + 1}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {scene.split("\n").length} lines
                        </span>
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {scene.split("\n")[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200/80 bg-white/45 px-6 text-center dark:border-slate-700 dark:bg-slate-950/30">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <SquareStack size={22} />
            </div>
            <div className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-100">
              No songs parsed yet
            </div>
            <div className="mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Upload a lyrics file and the detected songs with their scene splits will
              appear here.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
