"use client";

import * as Switch from "@radix-ui/react-switch";
import { LayoutGrid, Type, WandSparkles } from "lucide-react";
import FontSettingsFields from "@/components/FontSettingsFields";

export default function SettingsPanel({
  settings,
  onChange,
  textSettingsMode,
  onTextSettingsModeChange,
}) {
  const update = (key) => (event) => {
    const value =
      event?.target?.type === "number"
        ? Number(event.target.value)
        : event?.target?.value ?? event;
    onChange({ [key]: value });
  };
  const fieldClass =
    "input-shell mt-2 w-full rounded-2xl px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-accent dark:text-slate-100";
  const blockClass = "rounded-[1.5rem] panel-shell p-4 sm:p-5";
  const isSpecificMode = textSettingsMode === "specific";
  const modeButtonBase =
    "option-card rounded-[1.35rem] px-4 py-4 text-left";

  return (
    <div className="space-y-6">
      <div>
        <div className="section-kicker">
          <Type size={14} />
          Text Styling
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-ink dark:text-slate-100">
          Text Styling
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Choose whether one text style should apply to every song or each song
          should carry its own font settings.
        </p>
      </div>

      <div className={blockClass}>
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          <WandSparkles size={14} />
          Text Styling Mode
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => onTextSettingsModeChange("global")}
            className={modeButtonBase}
            data-active={!isSpecificMode}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Global font settings
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  !isSpecificMode
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {!isSpecificMode ? "Active" : "Available"}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onTextSettingsModeChange("specific")}
            className={modeButtonBase}
            data-active={isSpecificMode}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Specific font settings per song
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  isSpecificMode
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {isSpecificMode ? "Active" : "Available"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {isSpecificMode ? (
        <div className={blockClass}>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <Type size={14} />
            Song Font Overrides
          </div>
          <div className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Configure per-song font settings in the <strong>Song Overrides</strong>{" "}
            section. Layout controls below still apply globally to all songs.
          </div>
        </div>
      ) : (
        <div className={blockClass}>
          <FontSettingsFields
            settings={settings}
            onChange={onChange}
            showHeader
            title="Global Font Settings"
          />
        </div>
      )}

      <div className={blockClass}>
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          <LayoutGrid size={14} />
          Layout Settings
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="mt-4 block text-sm text-slate-600 dark:text-slate-300">
            Text Alignment
            <select
              value={settings.alignment}
              onChange={update("alignment")}
              className={fieldClass}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="mt-4 block text-sm text-slate-600 dark:text-slate-300">
            Vertical Offset
            <input
              type="number"
              value={settings.verticalOffset}
              onChange={update("verticalOffset")}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            Text Box Width
            <input
              type="number"
              min={200}
              value={settings.textBoxWidth}
              onChange={update("textBoxWidth")}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            Text Box Height
            <input
              type="number"
              min={200}
              value={settings.textBoxHeight}
              onChange={update("textBoxHeight")}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            Text Margin (px)
            <input
              type="number"
              min={0}
              value={settings.textMargin || 0}
              onChange={update("textMargin")}
              className={fieldClass}
            />
          </label>
          <div className="block text-sm text-slate-600 dark:text-slate-300">
            <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Use Custom Text Extents
            </div>
            <div
              className="toggle-card mt-2 flex min-h-[78px] items-center justify-end gap-3 rounded-[1.35rem] px-4 py-3.5"
              data-checked={Boolean(settings.useCustomTextExtents)}
            >
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                  settings.useCustomTextExtents
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {settings.useCustomTextExtents ? "Active" : "Off"}
              </span>
              <Switch.Root
                checked={Boolean(settings.useCustomTextExtents)}
                onCheckedChange={(value) => onChange({ useCustomTextExtents: value })}
                className="toggle-switch"
              >
                <Switch.Thumb className="toggle-thumb" />
              </Switch.Root>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
