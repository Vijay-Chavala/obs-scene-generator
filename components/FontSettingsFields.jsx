"use client";

import * as Switch from "@radix-ui/react-switch";
import { Type } from "lucide-react";
import { TELUGU_FONTS } from "@/lib/textSettings";

function ColorField({ label, value, onChange, disabled = false }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
          {label}
        </span>
        <span className="rounded-full border border-slate-200/70 bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-700/70 dark:bg-slate-950/40 dark:text-slate-300">
          {String(value).toUpperCase()}
        </span>
      </div>
      <div className="color-field rounded-[1rem]" data-disabled={disabled}>
        <div className="relative flex h-14 items-center gap-3 px-4">
          <input
            type="color"
            value={value}
            onChange={onChange}
            disabled={disabled}
            aria-label={label}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
          />
          <span
            className="color-swatch h-9 w-9 shrink-0 rounded-[0.8rem] border border-white/60 dark:border-slate-700/70"
            style={{ backgroundColor: value }}
          />
          <div className="ml-auto rounded-full border border-slate-200/70 bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700/70 dark:bg-slate-950/35 dark:text-slate-200">
            Choose
          </div>
        </div>
      </div>
    </label>
  );
}

function ToggleField({
  checked,
  onCheckedChange,
  enabledText = "Enabled",
  disabledText = "Off",
}) {
  return (
    <div
      className="toggle-card flex h-14 items-center justify-end rounded-[1rem] px-4"
      data-checked={checked}
    >
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
            checked
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          {checked ? enabledText : disabledText}
        </span>
        <Switch.Root
          checked={checked}
          onCheckedChange={onCheckedChange}
          className="toggle-switch"
        >
          <Switch.Thumb className="toggle-thumb" />
        </Switch.Root>
      </div>
    </div>
  );
}

export default function FontSettingsFields({
  settings,
  onChange,
  className = "",
  dense = false,
  showHeader = false,
  title = "Font Settings",
}) {
  const update = (key) => (event) => {
    const value =
      event?.target?.type === "number"
        ? Number(event.target.value)
        : event?.target?.value ?? event;
    onChange({ [key]: value });
  };

  const fontOptions = Array.from(
    new Set([settings.fontFamily, ...TELUGU_FONTS].filter(Boolean))
  );
  const fieldClass =
    "input-shell mt-2 h-14 w-full rounded-[1rem] px-4 text-sm text-slate-700 outline-none transition focus:border-accent disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-100";
  const gridClass = dense ? "grid gap-3 xl:grid-cols-2" : "grid gap-3.5 md:grid-cols-2";
  const labelClass = "block text-[13px] font-medium text-slate-600 dark:text-slate-300";
  const outlineEnabled = Boolean(settings.outline);

  return (
    <div className={`space-y-3.5 ${className}`}>
      {showHeader ? (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
            <Type size={14} />
            {title}
          </div>
        </div>
      ) : null}

      <div className={gridClass}>
        <label className={labelClass}>
          Font Family
          <select
            value={settings.fontFamily}
            onChange={update("fontFamily")}
            className={fieldClass}
          >
            {fontOptions.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          Font Size
          <input
            type="number"
            min={12}
            value={settings.fontSize}
            onChange={update("fontSize")}
            className={fieldClass}
          />
        </label>
      </div>

      <div className={gridClass}>
        <ColorField
          label="Font Color"
          value={settings.fontColor}
          onChange={update("fontColor")}
        />

        <div>
          <div className="mb-2 text-[13px] font-medium text-slate-700 dark:text-slate-200">
            Bold
          </div>
          <ToggleField
            checked={Boolean(settings.bold)}
            onCheckedChange={(value) => onChange({ bold: value })}
            enabledText="On"
            disabledText="Off"
          />
        </div>
      </div>

      <div className="setting-card rounded-[1.15rem] p-4">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/70 pb-3 dark:border-slate-700/60">
          <div className="text-[13px] font-medium text-slate-700 dark:text-slate-200">
            Outline
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                outlineEnabled
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {outlineEnabled ? "On" : "Off"}
            </span>
            <Switch.Root
              checked={outlineEnabled}
              onCheckedChange={(value) => onChange({ outline: value })}
              className="toggle-switch"
            >
              <Switch.Thumb className="toggle-thumb" />
            </Switch.Root>
          </div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <label className={`${labelClass} ${!outlineEnabled ? "opacity-60" : ""}`}>
            Outline Size
            <input
              type="number"
              min={0}
              value={settings.outlineSize}
              onChange={update("outlineSize")}
              className={fieldClass}
              disabled={!outlineEnabled}
            />
          </label>

          <div className={!outlineEnabled ? "opacity-60" : ""}>
            <ColorField
              label="Outline Color"
              value={settings.outlineColor}
              onChange={update("outlineColor")}
              disabled={!outlineEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
