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

  if (Array.isArray(template.scenes) && template.scenes.length) {
    return generateLegacyScenes(template, parsedSongs, settings, canvas);
  }

  if (Array.isArray(template.sources)) {
    const hasSceneSources = template.sources.some(isSceneSource);
    if (hasSceneSources) {
      return generateSceneSources(template, parsedSongs, settings, canvas);
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

function generateSceneSources(template, parsedSongs, settings, canvas) {
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
  const titleCounts = new Map();

  let sourceCount = 1;

  parsedSongs.forEach((song) => {
    const safeTitle = getUniqueSongPrefix(song.songTitle, titleCounts);
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
            canvas
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

function generateLegacyScenes(template, parsedSongs, settings, canvas) {
  const templateScene = template.scenes?.[0] || { name: "Template Scene", sources: [] };
  const templateSources = Array.isArray(template.sources) ? template.sources : [];
  const { textItemTemplate, textSourceTemplate } = findLegacyTextItem(
    templateScene,
    templateSources
  );

  const staticItems = (templateScene.sources || []).filter(
    (item) => item !== textItemTemplate
  );
  const staticSources = templateSources.filter((source) => !isTextSource(source));

  const scenes = [];
  const sources = [...staticSources];
  const sceneOrder = [];
  let sceneItemId = 1;
  const titleCounts = new Map();
  let sourceCount = 1;

  parsedSongs.forEach((song) => {
    const safeTitle = getUniqueSongPrefix(song.songTitle, titleCounts);
    song.scenes.forEach((sceneText, sceneIndex) => {
      const sceneUuid = getUuid();
      const sourceUuid = getUuid();
      const sceneName = `${safeTitle}-${sceneIndex + 1}`;
      const sourceName = `lyrics-source-${sourceCount}`;

      const textSettings = buildTextSettings(sceneText, settings, textSourceTemplate);
      const transformSettings = buildTransformSettings(settings, textItemTemplate, canvas);

      if (textSourceTemplate) {
        const source = deepClone(textSourceTemplate);
        source.name = sourceName;
        source.uuid = sourceUuid;
        source.id = "text_gdiplus";
        if (source.versioned_id) {
          source.versioned_id = source.versioned_id;
        }
        source.settings = textSettings;
        sources.push(source);
      }

      const sceneItem = deepClone(textItemTemplate || { id: "text_gdiplus" });
      sceneItem.name = sourceName;
      sceneItem.id = "text_gdiplus";
      if ("source_uuid" in sceneItem || textItemTemplate?.source_uuid) {
        sceneItem.source_uuid = sourceUuid;
      }
      if ("uuid" in sceneItem || textItemTemplate?.uuid) {
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
      scene.sources = [...staticItems.map(deepClone), sceneItem];
      scenes.push(scene);
      sceneOrder.push({ name: sceneName });

      sceneItemId += 1;
      sourceCount += 1;
    });
  });

  template.scenes = scenes;
  if (sources.length) {
    template.sources = sources;
  }
  template.scene_order = sceneOrder;
  if (scenes.length) {
    template.current_program_scene = scenes[0].name;
    template.current_preview_scene = scenes[0].name;
    template.current_scene = scenes[0].name;
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

function findLegacyTextItem(scene, sources) {
  const items = Array.isArray(scene?.sources) ? scene.sources : [];
  const directTextItem = items.find((item) => item.id === "text_gdiplus");
  if (directTextItem) {
    return { textItemTemplate: directTextItem, textSourceTemplate: null };
  }

  for (const item of items) {
    const source = sources.find((src) => src.uuid === item.source_uuid || src.uuid === item.uuid);
    if (source && isTextSource(source)) {
      return { textItemTemplate: item, textSourceTemplate: source };
    }
  }

  const fallbackSource = sources.find(isTextSource) || { id: "text_gdiplus" };
  return { textItemTemplate: items[0], textSourceTemplate: fallbackSource };
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
  const margin = getMargin(settings);
  const effectiveWidth = Math.max(100, textBoxWidth - margin * 2);
  const effectiveHeight = Math.max(100, textBoxHeight - margin * 2);

  const fittedFontSize = extentsEnabled
    ? getFittedFontSize({
        text,
        fontSize: baseFontSize,
        textBoxWidth: effectiveWidth,
        textBoxHeight: effectiveHeight,
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
    extents_cx: extentsEnabled ? effectiveWidth : textBoxWidth,
    extents_cy: extentsEnabled ? effectiveHeight : textBoxHeight,
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
  const center = getCanvasCenter(canvas);
  const bounds = getBoundsForMargin(settings, canvas);
  const alignment =
    typeof baseTransform.alignment === "number"
      ? baseTransform.alignment
      : DEFAULT_TRANSFORM.alignment;
  const boundsAlignment =
    typeof baseTransform.bounds_alignment === "number"
      ? baseTransform.bounds_alignment
      : DEFAULT_TRANSFORM.bounds_alignment;

  return {
    ...baseTransform,
    position: {
      x: Number.isFinite(center.x) ? center.x : Number.isFinite(basePosition.x) ? basePosition.x : 0,
      y:
        (Number.isFinite(center.y) ? center.y : Number.isFinite(basePosition.y) ? basePosition.y : 0) +
        verticalOffset,
    },
    alignment: typeof alignment === "number" ? 0 : alignment,
    bounds_alignment: typeof boundsAlignment === "number" ? 0 : boundsAlignment,
    bounds_type: baseTransform.bounds_type || DEFAULT_TRANSFORM.bounds_type,
    bounds,
  };
}

function applySceneItemOverrides(item, settings, canvas) {
  const verticalOffset = Number(settings?.verticalOffset) || 0;
  const basePos = item?.pos && typeof item.pos === "object" ? item.pos : { x: 0, y: 0 };
  const center = getCanvasCenter(canvas);
  const bounds = getBoundsForMargin(settings, canvas);
  const useBounds = bounds && Number.isFinite(bounds.x) && Number.isFinite(bounds.y);
  const pos = {
    x: Number.isFinite(center.x) ? center.x : Number.isFinite(basePos.x) ? basePos.x : 0,
    y:
      (Number.isFinite(center.y) ? center.y : Number.isFinite(basePos.y) ? basePos.y : 0) +
      verticalOffset,
  };

  return {
    ...item,
    pos,
    pos_rel: item?.pos_rel ? getRelativePos(pos, canvas) : item?.pos_rel,
    align: typeof item?.align === "number" ? 0 : item?.align,
    bounds_align: typeof item?.bounds_align === "number" ? 0 : item?.bounds_align,
    bounds_type: typeof item?.bounds_type !== "undefined" ? item.bounds_type : 2,
    bounds: useBounds ? bounds : item?.bounds,
    bounds_rel: item?.bounds_rel ? getRelativeBounds(bounds, canvas) : item?.bounds_rel,
  };
}

function getMargin(settings) {
  const margin = Number(settings?.textMargin);
  if (!Number.isFinite(margin) || margin <= 0) return 0;
  return margin;
}

function getCanvasCenter(canvas) {
  const width = Number(canvas?.width);
  const height = Number(canvas?.height);
  return {
    x: Number.isFinite(width) ? width / 2 : 0,
    y: Number.isFinite(height) ? height / 2 : 0,
  };
}

function getBoundsForMargin(settings, canvas) {
  const width = Number(canvas?.width);
  const height = Number(canvas?.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return DEFAULT_TRANSFORM.bounds;
  }
  if (settings?.useCustomTextExtents) {
    return { x: width, y: height };
  }
  const margin = getMargin(settings);
  return {
    x: Math.max(100, width - margin * 2),
    y: Math.max(100, height - margin * 2),
  };
}

function getRelativePos(pos, canvas) {
  const width = Number(canvas?.width);
  const height = Number(canvas?.height);
  const denom = height / 2;
  if (!Number.isFinite(width) || !Number.isFinite(height) || !Number.isFinite(denom) || denom === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: (pos.x - width / 2) / denom,
    y: (pos.y - height / 2) / denom,
  };
}

function getRelativeBounds(bounds, canvas) {
  const height = Number(canvas?.height);
  const denom = height / 2;
  if (!Number.isFinite(bounds?.x) || !Number.isFinite(bounds?.y) || !Number.isFinite(denom) || denom === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: bounds.x / denom,
    y: bounds.y / denom,
  };
}

function normalizeTitleForSceneName(title) {
  const safe = String(title || "Song").trim();
  if (!safe) return "Song";
  const compact = safe.replace(/[^\p{L}\p{N}]+/gu, "");
  return compact || "Song";
}

function getUniqueSongPrefix(title, titleCounts) {
  const base = normalizeTitleForSceneName(title);
  const count = (titleCounts.get(base) || 0) + 1;
  titleCounts.set(base, count);
  return count === 1 ? base : `${base}_${count}`;
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
  maxScale = 1.35,
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

  const scale = Math.min(widthScale, heightScale, maxScale);
  const fitted = Math.floor(safeFontSize * scale);
  return Math.max(minFontSize, fitted);
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










