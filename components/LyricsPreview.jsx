export default function LyricsPreview({ parsedSongs }) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
          Lyrics Preview
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Verify the songs and scene splits detected from your file.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200">
        {parsedSongs.length ? (
          <div className="space-y-4">
            {parsedSongs.map((song) => (
              <div key={song.songTitle}>
                <div className="text-sm font-semibold text-ink dark:text-slate-100">
                  {song.songTitle}
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {song.scenes.map((scene, index) => (
                    <div key={`${song.songTitle}-${index}`}>
                      Scene {index + 1} ({scene.split("\n").length} lines)
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No songs parsed yet. Upload a lyrics file to preview the scenes.</div>
        )}
      </div>
    </div>
  );
}
