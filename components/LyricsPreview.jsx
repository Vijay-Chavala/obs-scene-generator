export function LyricsPreview({ songs }) {
  if (!songs?.length) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm text-neutral-300">
        No songs detected yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-sm font-medium">Preview</div>
      <div className="mt-3 space-y-4">
        {songs.map((s) => (
          <div key={s.title} className="rounded-lg border border-neutral-800 p-3">
            <div className="text-sm font-semibold">{s.title}</div>
            <div className="mt-2 text-xs text-neutral-300">
              Scenes: {s.scenes.length}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

