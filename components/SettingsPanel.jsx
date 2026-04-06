"use client";

import * as Switch from "@radix-ui/react-switch";
import { LayoutGrid, Type } from "lucide-react";

export default function SettingsPanel({ settings, onChange }) {
  const update = (key) => (event) => {
    const value =
      event?.target?.type === "number"
        ? Number(event.target.value)
        : event?.target?.value ?? event;
    onChange({ [key]: value });
  };

  const teluguFonts = [
    "Mandali",
    "dhurjati",
    "Gidugu",
    "Gurajada",
    "LakkiReddy",
    "mallanna",
    "Mandali-Regular",
    "NATS",
    "NTR",
    "Peddana-Regular",
    "Ponnala",
    "PottiSreeramulu",
    "ramabhadra",
    "Ramaraja-Regular",
    "RaviPrakash",
    "suranna",
    "Suravaram",
    "SyamalaRamana",
    "TenaliRamakrishna-Regular",
    "TimmanaRegular",
  ];

  const fontOptions = Array.from(
    new Set([settings.fontFamily, ...teluguFonts].filter(Boolean))
  );
  const fieldClass =
    "input-shell mt-2 w-full rounded-2xl px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-accent dark:text-slate-100";
  const blockClass = "rounded-[1.5rem] panel-shell p-4 sm:p-5";

  return (
    <div className="space-y-6">
      <div>
        <div className="section-kicker">
          <Type size={14} />
          Text Styling
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-ink dark:text-slate-100">
          Template Settings
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
          Configure the default text style applied to every generated scene.
        </p>
      </div>

      <div className={blockClass}>
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          <Type size={14} />
          Font Settings
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="mt-4 block text-sm text-slate-600 dark:text-slate-300">
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
          <label className="mt-4 block text-sm text-slate-600 dark:text-slate-300">
            Font Size
            <input
              type="number"
              min={12}
              value={settings.fontSize}
              onChange={update("fontSize")}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            Font Color
            <input
              type="color"
              value={settings.fontColor}
              onChange={update("fontColor")}
              className="input-shell mt-2 h-14 w-full rounded-2xl px-2 dark:text-slate-100"
            />
          </label>
          <div className="block text-sm text-slate-600 dark:text-slate-300">
            Bold
            <div className="panel-shell mt-2 flex min-h-[56px] items-center justify-between rounded-2xl px-4">
              <div>
                <div className="font-medium text-slate-700 dark:text-slate-100">
                  Use bold text
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Recommended for stage readability
                </div>
              </div>
              <Switch.Root
                checked={settings.bold}
                onCheckedChange={(value) => onChange({ bold: value })}
                className="relative h-7 w-12 rounded-full bg-slate-300 transition data-[state=checked]:bg-accent dark:bg-slate-700"
              >
                <Switch.Thumb className="block h-6 w-6 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-[1.45rem] dark:bg-slate-100" />
              </Switch.Root>
            </div>
          </div>
          <div className="block text-sm text-slate-600 dark:text-slate-300">
            Outline
            <div className="panel-shell mt-2 flex min-h-[56px] items-center justify-between rounded-2xl px-4">
              <div>
                <div className="font-medium text-slate-700 dark:text-slate-100">
                  Enable text outline
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Useful when lyrics need stronger separation from the background
                </div>
              </div>
              <Switch.Root
                checked={Boolean(settings.outline)}
                onCheckedChange={(value) => onChange({ outline: value })}
                className="relative h-7 w-12 rounded-full bg-slate-300 transition data-[state=checked]:bg-accent dark:bg-slate-700"
              >
                <Switch.Thumb className="block h-6 w-6 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-[1.45rem] dark:bg-slate-100" />
              </Switch.Root>
            </div>
          </div>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            Outline Size
            <input
              type="number"
              min={0}
              value={settings.outlineSize}
              onChange={update("outlineSize")}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm text-slate-600 dark:text-slate-300">
            Outline Color
            <input
              type="color"
              value={settings.outlineColor}
              onChange={update("outlineColor")}
              className="input-shell mt-2 h-14 w-full rounded-2xl px-2 dark:text-slate-100"
            />
          </label>
        </div>
      </div>

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
            Use Custom Text Extents
            <div className="panel-shell mt-2 flex min-h-[56px] items-center justify-between rounded-2xl px-4">
              <div>
                <div className="font-medium text-slate-700 dark:text-slate-100">
                  Keep OBS text extents enabled
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Helpful when you want OBS wrapping to control layout
                </div>
              </div>
              <Switch.Root
                checked={Boolean(settings.useCustomTextExtents)}
                onCheckedChange={(value) => onChange({ useCustomTextExtents: value })}
                className="relative h-7 w-12 rounded-full bg-slate-300 transition data-[state=checked]:bg-accent dark:bg-slate-700"
              >
                <Switch.Thumb className="block h-6 w-6 translate-x-0.5 rounded-full bg-white transition data-[state=checked]:translate-x-[1.45rem] dark:bg-slate-100" />
              </Switch.Root>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
