"use client";

import * as Switch from "@radix-ui/react-switch";

export default function SettingsPanel({ settings, onChange }) {
  const update = (key) => (event) => {
    const value =
      event?.target?.type === "number"
        ? Number(event.target.value)
        : event?.target?.value ?? event;
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-ink dark:text-slate-100">
          Template Settings
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Configure the default text style applied to every generated scene.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Font Settings
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Font Family
            <input
              type="text"
              value={settings.fontFamily}
              onChange={update("fontFamily")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Font Size
            <input
              type="number"
              min={12}
              value={settings.fontSize}
              onChange={update("fontSize")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Font Color
            <input
              type="color"
              value={settings.fontColor}
              onChange={update("fontColor")}
              className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700"
            />
          </label>
          <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Bold
            <Switch.Root
              checked={settings.bold}
              onCheckedChange={(value) => onChange({ bold: value })}
              className="relative h-6 w-11 rounded-full bg-slate-200 transition data-[state=checked]:bg-accent dark:bg-slate-700"
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-5 dark:bg-slate-200" />
            </Switch.Root>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Layout Settings
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Text Alignment
            <select
              value={settings.alignment}
              onChange={update("alignment")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Vertical Offset
            <input
              type="number"
              value={settings.verticalOffset}
              onChange={update("verticalOffset")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Text Box Width
            <input
              type="number"
              min={200}
              value={settings.textBoxWidth}
              onChange={update("textBoxWidth")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Text Box Height
            <input
              type="number"
              min={200}
              value={settings.textBoxHeight}
              onChange={update("textBoxHeight")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Text Margin (px)
            <input
              type="number"
              min={0}
              value={settings.textMargin || 0}
              onChange={update("textMargin")}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </label>
          <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
            Use Custom Text Extents
            <Switch.Root
              checked={Boolean(settings.useCustomTextExtents)}
              onCheckedChange={(value) => onChange({ useCustomTextExtents: value })}
              className="relative h-6 w-11 rounded-full bg-slate-200 transition data-[state=checked]:bg-accent dark:bg-slate-700"
            >
              <Switch.Thumb className="block h-5 w-5 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-5 dark:bg-slate-200" />
            </Switch.Root>
          </div>
        </div>
      </div>
    </div>
  );
}
