export function generateOBSSceneCollection({ template, songs, settings }) {
  const collection = structuredClone(template);

  const scenes = [];
  const sources = [];

  let sceneIdCounter = 1;
  let sourceIdCounter = 1;

  function makeUuid() {
    return crypto.randomUUID();
  }

  for (const song of songs) {
    song.scenes.forEach((sceneText, idx) => {
      const sceneName = `${song.title}-${idx + 1}`;
      const sourceName = `lyrics-source-${sourceIdCounter++}`;

      const sourceUuid = makeUuid();
      sources.push({
        uuid: sourceUuid,
        name: sourceName,
        id: "text_gdiplus",
        settings: {
          text: sceneText,
          font: {
            face: settings.fontFace,
            flags: settings.fontBold ? 1 : 0,
            size: settings.fontSize,
            style: "Bold"
          },
          color1: settings.color1,
          align: settings.align,
          valign: settings.valign,
          extents: true,
          extents_cx: settings.extentsCx,
          extents_cy: settings.extentsCy
        }
      });

      const sceneUuid = makeUuid();
      scenes.push({
        uuid: sceneUuid,
        name: sceneName,
        id: sceneIdCounter++,
        items: [
          {
            name: sourceName,
            source_uuid: sourceUuid,
            transform: {
              position: { x: 0, y: 0 },
              bounds_type: "OBS_BOUNDS_SCALE_INNER",
              bounds: { x: settings.canvasWidth, y: settings.canvasHeight }
            }
          }
        ]
      });
    });
  }

  collection.name = collection.name || "Lyrics Scene Collection";
  collection.scenes = scenes;
  collection.sources = sources;
  collection.canvas = {
    width: settings.canvasWidth,
    height: settings.canvasHeight
  };

  return collection;
}

import obsTemplate from "@/templates/obsTemplate.json";

const DEFAULT_TEXT_SETTINGS = {
  text: "",
  font: {
    face: "Mandali",
    size: 256,
    style: "Bold",
  },
  color: 4294967295,
  outline: false,
  align: "center",
  valign: "center",
  extents: false,
  extents_cx: 1920,
  extents_cy: 1080,
  antialiasing: true,
  vertical: false,
};

const DEFAULT_TRANSFORM = {
  position: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },
  alignment: 0,
  bounds_type: "OBS_BOUNDS_SCALE_INNER",
  bounds_alignment: 0,
  bounds: { x: 1920, y: 1080 },
  crop: { left: 0, top: 0, right: 0, bottom: 0 },
};

export function generateOBSJson(parsedSongs, settings, templateOverride) {
  const template = deepClone(templateOverride || obsTemplate);
  const canvas = getCanvasSize(template, settings);
  const useDefaultAlignment = !templateOverride;

  if (Array.isArray(template.scenes) && template.scenes.length) {
    return generateLegacyScenes(template, parsedSongs, settings, canvas);
  }

  if (Array.isArray(template.sources)) {
    const hasSceneSources = template.sources.some(isSceneSource);
    if (hasSceneSources) {
      return generateSceneSources(template, parsedSongs, settings, canvas, useDefaultAlignment);
    }
  }

  return generateLegacyScenes(
    {
      ...template,
      scenes: [
        {
          name: "Template Scene",
          sources: [
            {
              id: "text_gdiplus",
              settings: DEFAULT_TEXT_SETTINGS,
              transform: DEFAULT_TRANSFORM,
            },
          ],
        },
      ],
      sources: [
        {
          id: "text_gdiplus",
          settings: DEFAULT_TEXT_SETTINGS,
        },
      ],
    },
    parsedSongs,
    settings,
    canvas
  );
}

function generateLegacyScenes(template, parsedSongs, settings, canvas) {
  const templateScene = template.scenes?.[0] || { name: "Template Scene", sources: [] };
  const templateSceneItem = templateScene.sources?.[0] || { id: "text_gdiplus" };
  const templateSource =
    template.sources?.find(
      (source) =>
        source.uuid === templateSceneItem.source_uuid ||
        source.uuid === templateSceneItem.uuid
    ) || template.sources?.[0];

  const scenes = [];
  const sources = [];
  const sceneOrder = [];
  let sceneItemId = 1;
  let sourceCount = 1;

  parsedSongs.forEach((song) => {
    const safeTitle = normalizeTitleForSceneName(song.songTitle);
    song.scenes.forEach((sceneText, sceneIndex) => {
      const sceneUuid = getUuid();
      const sourceUuid = getUuid();
      const sceneName = `${safeTitle}-${sceneIndex + 1}`;
      const sourceName = `lyrics-source-${sourceCount}`;

      const textSettings = buildTextSettings(sceneText, settings, templateSource);
      const transformSettings = buildTransformSettings(settings, templateSceneItem, canvas);

      const source = deepClone(templateSource || {});
      source.name = sourceName;
      source.uuid = sourceUuid;
      source.id = "text_gdiplus";
      if (source.versioned_id) {
        source.versioned_id = "text_gdiplus";
      }
      source.settings = textSettings;
      sources.push(source);

      const sceneItem = deepClone(templateSceneItem || {});
      sceneItem.name = sourceName;
      sceneItem.id = "text_gdiplus";
      if ("source_uuid" in sceneItem || templateSceneItem?.source_uuid) {
        sceneItem.source_uuid = sourceUuid;
      }
      if ("uuid" in sceneItem || templateSceneItem?.uuid) {
        sceneItem.uuid = sourceUuid;
      }
      sceneItem.settings = textSettings;
      sceneItem.transform = transformSettings;
      sceneItem.scene_item_id = sceneItemId;
      sceneItem.visible = true;
      sceneItem.locked = sceneItem.locked ?? false;

      const scene = deepClone(templateScene);
      scene.name = sceneName;
      if ("uuid" in scene || templateScene.uuid) {
        scene.uuid = sceneUuid;
      }
      scene.sources = [sceneItem];
      scenes.push(scene);
      sceneOrder.push({ name: sceneName });

      sceneItemId += 1;
      sourceCount += 1;
    });
  });

  template.scenes = scenes;
  template.sources = sources;
  template.scene_order = sceneOrder;
  if (scenes.length) {
    template.current_program_scene = scenes[0].name;
    template.current_preview_scene = scenes[0].name;
    template.current_scene = scenes[0].name;
  }
  template.name = template.name || "Church Lyrics Scenes";
  return template;
}

function generateSceneSources(template, parsedSongs, settings, canvas, useDefaultAlignment) {
  const sources = Array.isArray(template.sources) ? template.sources : [];
  const sourceByUuid = new Map(sources.map((source) => [source.uuid, source]));
  const sceneSources = sources.filter(isSceneSource);

  const { templateSceneSource, textSourceTemplate, textItemTemplate } =
    findSceneTemplate(sceneSources, sourceByUuid);

  const staticSources = collectStaticSources(
    sourceByUuid,
    templateSceneSource,
    textItemTemplate?.source_uuid
  );

  const newSources = [...staticSources];
  const sceneOrder = [];

  let sourceCount = 1;

  parsedSongs.forEach((song) => {
    const safeTitle = normalizeTitleForSceneName(song.songTitle);
    song.scenes.forEach((sceneText, sceneIndex) => {
      const sceneName = `${safeTitle}-${sceneIndex + 1}`;
      const sourceName = `lyrics-source-${sourceCount}`;
      const sourceUuid = getUuid();
      const sceneUuid = getUuid();

      const textSettings = buildTextSettings(sceneText, settings, textSourceTemplate);

      const textSource = deepClone(textSourceTemplate || {});
      textSource.name = sourceName;
      textSource.uuid = sourceUuid;
      textSource.id = textSourceTemplate?.id || "text_gdiplus";
      if (textSource.versioned_id || textSourceTemplate?.versioned_id) {
        textSource.versioned_id = textSourceTemplate?.versioned_id || textSource.versioned_id;
      }
      textSource.settings = textSettings;
      newSources.push(textSource);

      const sceneSource = deepClone(templateSceneSource || {});
      sceneSource.name = sceneName;
      sceneSource.uuid = sceneUuid;
      sceneSource.id = sceneSource.id || "scene";
      sceneSource.versioned_id = sceneSource.versioned_id || "scene";

      const sceneItems = Array.isArray(sceneSource.settings?.items)
        ? sceneSource.settings.items
        : [];

      const updatedItems = [];
      sceneItems.forEach((item) => {
        const itemSource = sourceByUuid.get(item.source_uuid);
        const isTextItem = itemSource && isTextSource(itemSource);
        if (isTextItem && item.source_uuid !== textItemTemplate?.source_uuid) {
          return;
        }
        if (item.source_uuid === textItemTemplate?.source_uuid) {
          const updatedItem = applySceneItemOverrides(
            {
              ...item,
              name: sourceName,
              source_uuid: sourceUuid,
              id: item.id || updatedItems.length + 1,
              visible: true,
              locked: false,
            },
            settings,
            canvas,
            useDefaultAlignment
          );
          updatedItems.push(updatedItem);
          return;
        }
        updatedItems.push(item);
      });

      const maxItemId = updatedItems.reduce(
        (max, item) => (typeof item.id === "number" ? Math.max(max, item.id) : max),
        0
      );

      sceneSource.settings = {
        ...(sceneSource.settings || {}),
        items: updatedItems,
        id_counter: Math.max(maxItemId + 1, updatedItems.length + 1),
      };

      newSources.push(sceneSource);
      sceneOrder.push({ name: sceneName });

      sourceCount += 1;
    });
  });

  template.sources = newSources;
  template.scene_order = sceneOrder;
  if (sceneOrder.length) {
    template.current_scene = sceneOrder[0].name;
    template.current_program_scene = sceneOrder[0].name;
    template.current_preview_scene = sceneOrder[0].name;
  }
  template.name = template.name || "Church Lyrics Scenes";
  return template;
}

function isSceneSource(source) {
  return source?.id === "scene" || source?.versioned_id === "scene";
}

function isTextSource(source) {
  return source?.id === "text_gdiplus" || source?.versioned_id === "text_gdiplus_v3";
}

function findSceneTemplate(sceneSources, sourceByUuid) {
  let fallback = null;
  for (const scene of sceneSources) {
    const items = Array.isArray(scene.settings?.items) ? scene.settings.items : [];
    for (const item of items) {
      const source = sourceByUuid.get(item.source_uuid);
      if (source && isTextSource(source)) {
        if (item.visible !== false) {
          return {
            templateSceneSource: scene,
            textSourceTemplate: source,
            textItemTemplate: item,
          };
        }
        if (!fallback) {
          fallback = {
            templateSceneSource: scene,
            textSourceTemplate: source,
            textItemTemplate: item,
          };
        }
      }
    }
  }
  if (fallback) {
    return fallback;
  }
  const fallbackScene = sceneSources[0] || { settings: { items: [] } };
  return {
    templateSceneSource: fallbackScene,
    textSourceTemplate: { id: "text_gdiplus", settings: DEFAULT_TEXT_SETTINGS },
    textItemTemplate: { source_uuid: "" },
  };
}

function collectStaticSources(sourceByUuid, templateSceneSource, textSourceUuid) {
  const items = Array.isArray(templateSceneSource?.settings?.items)
    ? templateSceneSource.settings.items
    : [];
  const staticSources = [];
  const seen = new Set();

  items.forEach((item) => {
    if (!item.source_uuid || item.source_uuid === textSourceUuid) {
      return;
    }
    const source = sourceByUuid.get(item.source_uuid);
    if (!source || isTextSource(source)) {
      return;
    }
    if (!seen.has(source.uuid)) {
      staticSources.push(deepClone(source));
      seen.add(source.uuid);
    }
  });

  return staticSources;
}

function buildTextSettings(text, settings, templateSource) {
  const baseSettings =
    templateSource?.settings && typeof templateSource.settings === "object"
      ? templateSource.settings
      : DEFAULT_TEXT_SETTINGS;
  const obsColor = hexToObsColor(settings.fontColor);
  const alignValue = alignmentToObs(settings.alignment, baseSettings.align);
  const valignValue =
    typeof baseSettings.valign !== "undefined"
      ? baseSettings.valign
      : verticalAlignmentToObs("center", DEFAULT_TEXT_SETTINGS.valign);
  const baseFontSize = settings.fontSize || baseSettings.font?.size || DEFAULT_TEXT_SETTINGS.font.size;
  const textBoxWidth = settings.textBoxWidth || baseSettings.extents_cx || DEFAULT_TEXT_SETTINGS.extents_cx;
  const textBoxHeight = settings.textBoxHeight || baseSettings.extents_cy || DEFAULT_TEXT_SETTINGS.extents_cy;
  const extentsEnabled =
    typeof settings.useCustomTextExtents === "boolean"
      ? settings.useCustomTextExtents
      : typeof baseSettings.extents === "boolean"
        ? baseSettings.extents
        : DEFAULT_TEXT_SETTINGS.extents;
  const fittedFontSize = extentsEnabled
    ? getFittedFontSize({
        text,
        fontSize: baseFontSize,
        textBoxWidth,
        textBoxHeight,
      })
    : baseFontSize;

  return {
    ...baseSettings,
    text,
    font: {
      face: settings.fontFamily || DEFAULT_TEXT_SETTINGS.font.face,
      size: fittedFontSize,
      style: settings.bold ? "Bold" : "Regular",
    },
    color: obsColor,
    outline: false,
    align: alignValue,
    valign: valignValue,
    extents: extentsEnabled,
    extents_cx: textBoxWidth,
    extents_cy: textBoxHeight,
  };
}

function buildTransformSettings(settings, templateSceneItem, canvas) {
  const baseTransform =
    templateSceneItem?.transform && typeof templateSceneItem.transform === "object"
      ? templateSceneItem.transform
      : DEFAULT_TRANSFORM;

  const basePosition =
    baseTransform?.position && typeof baseTransform.position === "object"
      ? baseTransform.position
      : { x: 0, y: 0 };
  const verticalOffset = Number(settings.verticalOffset) || 0;

  return {
    ...baseTransform,
    position: {
      x: Number.isFinite(basePosition.x) ? basePosition.x : 0,
      y: (Number.isFinite(basePosition.y) ? basePosition.y : 0) + verticalOffset,
    },
    bounds: normalizeBounds(baseTransform.bounds, {
      x: canvas.width,
      y: canvas.height,
    }),
  };
}

function normalizeTitleForSceneName(title) {
  const compact = String(title || "Song").replace(/[^a-zA-Z0-9]+/g, "");
  return compact || "Song";
}

function alignmentToObs(alignment, fallback = 1) {
  if (typeof fallback === "string") {
    if (alignment === "left" || alignment === "center" || alignment === "right") {
      return alignment;
    }
    return fallback;
  }
  if (alignment === "left") return 0;
  if (alignment === "right") return 2;
  if (alignment === "center") return 1;
  return fallback;
}

function verticalAlignmentToObs(alignment, fallback = 0) {
  if (typeof fallback === "string") {
    if (alignment === "top" || alignment === "center" || alignment === "bottom") {
      return alignment;
    }
    return fallback;
  }
  if (alignment === "top") return 0;
  if (alignment === "bottom") return 2;
  if (alignment === "center") return 1;
  return fallback;
}

function hexToObsColor(hex) {
  if (!hex || typeof hex !== "string") return DEFAULT_TEXT_SETTINGS.color;
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return DEFAULT_TEXT_SETTINGS.color;
  const rgb = parseInt(sanitized, 16);
  return (0xff << 24) | rgb;
}

function getFittedFontSize({
  text,
  fontSize,
  textBoxWidth,
  textBoxHeight,
  minFontSize = 64,
  lineHeightFactor = 1.1,
  charWidthFactor = 0.5,
}) {
  const safeFontSize = Number(fontSize) > 0 ? Number(fontSize) : DEFAULT_TEXT_SETTINGS.font.size;
  const safeWidth = Number(textBoxWidth) > 0 ? Number(textBoxWidth) : DEFAULT_TEXT_SETTINGS.extents_cx;
  const safeHeight = Number(textBoxHeight) > 0 ? Number(textBoxHeight) : DEFAULT_TEXT_SETTINGS.extents_cy;
  const safeText = typeof text === "string" ? text : String(text ?? "");

  if (!safeText.trim()) {
    return safeFontSize;
  }

  const lines = safeText.split(/\r?\n/);
  const longestLineLength = lines.reduce(
    (max, line) => Math.max(max, line?.length ?? 0),
    0
  );
  const lineWidth = longestLineLength * safeFontSize * charWidthFactor;
  const widthScale = lineWidth > 0 ? safeWidth / lineWidth : 1;

  const charWidth = Math.max(1, safeFontSize * charWidthFactor);
  const maxCharsPerLine = Math.max(1, Math.floor(safeWidth / charWidth));
  const estimatedLines = lines.reduce((sum, line) => {
    const lineLength = line?.length ?? 0;
    return sum + Math.max(1, Math.ceil(lineLength / maxCharsPerLine));
  }, 0);

  const estimatedHeight = estimatedLines * safeFontSize * lineHeightFactor;
  const heightScale = estimatedHeight > 0 ? safeHeight / estimatedHeight : 1;

  const scale = Math.min(1, widthScale, heightScale);
  const fitted = Math.floor(safeFontSize * scale);
  return Math.max(minFontSize, fitted);
}

function getUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return [...bytes]
      .map((b, i) => {
        const hex = b.toString(16).padStart(2, "0");
        return [4, 6, 8, 10].includes(i) ? `-${hex}` : hex;
      })
      .join("");
  }
  return `uuid-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getCanvasSize(template, settings) {
  const resolution = template?.resolution || template?.canvases?.[0]?.resolution;
  const width =
    Number(resolution?.x || resolution?.width) ||
    Number(settings?.textBoxWidth) ||
    DEFAULT_TRANSFORM.bounds.x;
  const height =
    Number(resolution?.y || resolution?.height) ||
    Number(settings?.textBoxHeight) ||
    DEFAULT_TRANSFORM.bounds.y;
  return {
    width: Number.isFinite(width) && width > 0 ? width : DEFAULT_TRANSFORM.bounds.x,
    height: Number.isFinite(height) && height > 0 ? height : DEFAULT_TRANSFORM.bounds.y,
  };
}

function normalizeBounds(bounds, fallback) {
  const hasValidBounds =
    Number.isFinite(bounds?.x) && bounds.x > 0 && Number.isFinite(bounds?.y) && bounds.y > 0;
  return hasValidBounds ? bounds : fallback;
}

function applySceneItemOverrides(item, settings, canvas, useDefaultAlignment) {
  const verticalOffset = Number(settings?.verticalOffset) || 0;
  const basePos = item?.pos && typeof item.pos === "object" ? item.pos : { x: 0, y: 0 };
  const bounds = normalizeBounds(item.bounds, {
    x: canvas.width,
    y: canvas.height,
  });

  if (!useDefaultAlignment) {
    return {
      ...item,
      pos: {
        x: Number.isFinite(basePos.x) ? basePos.x : 0,
        y: (Number.isFinite(basePos.y) ? basePos.y : 0) + verticalOffset,
      },
      bounds,
    };
  }

  const halfHeight = canvas.height / 2;
  const aspect = canvas.width / canvas.height;
  const pos = {
    x: 0,
    y: verticalOffset,
  };

  return {
    ...item,
    align: 5,
    bounds_type: 2,
    bounds_align: 0,
    pos,
    pos_rel: {
      x: pos.x / halfHeight - aspect,
      y: pos.y / halfHeight - 1,
    },
    scale: {
      x: 1,
      y: 1,
    },
    scale_rel: {
      x: 1,
      y: 1,
    },
    scale_ref: {
      x: canvas.width,
      y: canvas.height,
    },
    bounds,
    bounds_rel: {
      x: bounds.x / halfHeight,
      y: bounds.y / halfHeight,
    },
  };
}







