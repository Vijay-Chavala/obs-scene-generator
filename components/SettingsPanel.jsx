export function SettingsPanel({ settings, onChange }) {
  function set(k, v) {
    onChange({ ...settings, [k]: v });
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-sm font-medium">Settings</div>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs text-neutral-300">
          Font face
          <input
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-50"
            value={settings.fontFace}
            onChange={(e) => set("fontFace", e.target.value)}
          />
        </label>
        <label className="text-xs text-neutral-300">
          Font size
          <input
            className="mt-1 w-full rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1 text-sm text-neutral-50"
            type="number"
            value={settings.fontSize}
            onChange={(e) => set("fontSize", Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}

