export const TELUGU_FONTS = [
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

export const DEFAULT_FONT_SETTINGS = {
  fontFamily: "Mandali",
  fontSize: 256,
  fontColor: "#ffffff",
  bold: true,
  outline: false,
  outlineSize: 19,
  outlineColor: "#aa0000",
};

export const DEFAULT_LAYOUT_SETTINGS = {
  alignment: "center",
  verticalOffset: 0,
  textBoxWidth: 1920,
  textBoxHeight: 1080,
  textMargin: 60,
  useCustomTextExtents: false,
};

export const DEFAULT_SETTINGS = {
  ...DEFAULT_FONT_SETTINGS,
  ...DEFAULT_LAYOUT_SETTINGS,
};

export function extractFontSettings(settings = {}) {
  return {
    fontFamily: settings.fontFamily ?? DEFAULT_FONT_SETTINGS.fontFamily,
    fontSize: settings.fontSize ?? DEFAULT_FONT_SETTINGS.fontSize,
    fontColor: settings.fontColor ?? DEFAULT_FONT_SETTINGS.fontColor,
    bold: typeof settings.bold === "boolean" ? settings.bold : DEFAULT_FONT_SETTINGS.bold,
    outline:
      typeof settings.outline === "boolean"
        ? settings.outline
        : DEFAULT_FONT_SETTINGS.outline,
    outlineSize: settings.outlineSize ?? DEFAULT_FONT_SETTINGS.outlineSize,
    outlineColor: settings.outlineColor ?? DEFAULT_FONT_SETTINGS.outlineColor,
  };
}

export function createSongFontSettings(parsedSongs = [], baseSettings = DEFAULT_SETTINGS) {
  return parsedSongs.map(() => extractFontSettings(baseSettings));
}

export function mergeSongTextSettings(globalSettings, songFontSettings, mode = "global") {
  if (mode !== "specific" || !songFontSettings) {
    return globalSettings;
  }

  return {
    ...globalSettings,
    ...extractFontSettings(songFontSettings),
  };
}
