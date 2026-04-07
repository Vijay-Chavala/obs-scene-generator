import obsTemplate from "@/templates/obsTemplate.json";
import { mergeSongTextSettings } from "@/lib/textSettings";

const DEFAULT_TEXT_SETTINGS = {
  text: "",
  font: {
    face: "Mandali",
    size: 256,
    style: "Bold",
  },
  color: 4294967295,
  outline: false,
  outline_color: 4278190250,
  outline_size: 19,
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

const DEFAULT_IMAGE_SOURCE = {
  id: "image_source",
  versioned_id: "image_source",
  settings: {
    file: "",
    unload: true,
    linear_alpha: false,
  },
  private_settings: {},
};

const DEFAULT_VIDEO_SOURCE = {
  id: "ffmpeg_source",
  versioned_id: "ffmpeg_source",
  settings: {
    local_file: "",
    looping: true,
    restart_on_activate: true,
    clear_on_media_end: false,
  },
  mixers: 255,
  muted: false,
  private_settings: {},
};

export function generateOBSJson(
  parsedSongs,
  settings,
  templateOverride,
  songBackgrounds = [],
  songFontSettings = [],
  textSettingsMode = "global"
) {
  const preserveExistingCollection = Boolean(templateOverride);
  const template = deepClone(templateOverride || obsTemplate);
  const canvas = getCanvasSize(template, settings);

  if (Array.isArray(template.scenes) && template.scenes.length) {
    return generateLegacyScenes(
      template,
      parsedSongs,
      settings,
      canvas,
      songBackgrounds,
      songFontSettings,
      textSettingsMode,
      preserveExistingCollection
    );
  }

  if (Array.isArray(template.sources)) {
    const hasSceneSources = template.sources.some(isSceneSource);
    if (hasSceneSources) {
      return generateSceneSources(
        template,
        parsedSongs,
        settings,
        canvas,
        songBackgrounds,
        songFontSettings,
        textSettingsMode,
        preserveExistingCollection
      );
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
    canvas,
    songBackgrounds,
    songFontSettings,
    textSettingsMode,
    false
  );
}

function generateSceneSources(
  template,
  parsedSongs,
  settings,
  canvas,
  songBackgrounds,
  songFontSettings,
  textSettingsMode,
  preserveExistingCollection = false
) {
  const sources = Array.isArray(template.sources) ? template.sources : [];
  const sourceByUuid = new Map(sources.map((source) => [source.uuid, source]));
  const sceneSources = sources.filter(isSceneSource);
  const hasConfiguredBackgrounds = hasSongBackgroundAssignments(songBackgrounds);

  const { templateSceneSource, textSourceTemplate, textItemTemplate } =
    findSceneTemplate(sceneSources, sourceByUuid);
  const mediaTemplates = findSceneMediaTemplates(sceneSources, sourceByUuid);

  const staticSources = collectStaticSources(
    sourceByUuid,
    templateSceneSource,
    textItemTemplate?.source_uuid,
    hasConfiguredBackgrounds
  );

  const newSources = preserveExistingCollection
    ? deepClone(sources)
    : [...staticSources];
  const sceneOrder = preserveExistingCollection
    ? deepClone(getSceneSourceOrder(template, sceneSources))
    : [];
  const titleCounts = new Map();
  const usedSceneNames = new Set(
    sceneOrder.map((scene) => scene?.name).filter(Boolean)
  );
  const usedSourceNames = new Set(
    newSources.map((source) => source?.name).filter(Boolean)
  );

  let sourceCount = getNextLyricsSourceCounter(usedSourceNames);

  parsedSongs.forEach((song, songIndex) => {
    const safeTitle = getUniqueSongPrefix(song.songTitle, titleCounts);
    const songSettings = mergeSongTextSettings(
      settings,
      songFontSettings?.[songIndex],
      textSettingsMode
    );
    const songBackground = buildSongBackgroundAsset({
      song,
      songIndex,
      background: songBackgrounds?.[songIndex],
      safeTitle,
      mediaTemplates,
      canvas,
    });

    if (songBackground) {
      songBackground.sourceName = getUniqueName(songBackground.sourceName, usedSourceNames);
      songBackground.source.name = songBackground.sourceName;
      newSources.push(songBackground.source);
    }

    song.scenes.forEach((sceneText, sceneIndex) => {
      const sceneName = getUniqueName(
        `${safeTitle}-${sceneIndex + 1}`,
        usedSceneNames
      );
      const sourceName = getUniqueName(
        `lyrics-source-${sourceCount}`,
        usedSourceNames
      );
      const sourceUuid = getUuid();
      const sceneUuid = getUuid();

      const textSettings = buildTextSettings(sceneText, songSettings, textSourceTemplate);

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
      const maxSceneItemId = sceneItems.reduce(
        (max, item) => (typeof item.id === "number" ? Math.max(max, item.id) : max),
        0
      );
      if (songBackground) {
        const backgroundItem = createSceneSourceBackgroundItem(
          songBackground.itemTemplate,
          songBackground,
          canvas
        );
        if (
          typeof backgroundItem.id !== "number" ||
          sceneItems.some((item) => item.id === backgroundItem.id)
        ) {
          backgroundItem.id = maxSceneItemId + 1;
        }
        updatedItems.push(backgroundItem);
      }

      sceneItems.forEach((item) => {
        const itemSource = sourceByUuid.get(item.source_uuid);
        const isTextItem = itemSource && isTextSource(itemSource);
        const isMediaItem = itemSource && isBackgroundMediaSource(itemSource);
        if (isTextItem && item.source_uuid !== textItemTemplate?.source_uuid) {
          return;
        }
        if (hasConfiguredBackgrounds && isMediaItem) {
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
            songSettings,
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

      sourceCount = getNextLyricsSourceCounter(usedSourceNames, sourceCount + 1);
    });
  });

  template.sources = newSources;
  template.scene_order = sceneOrder;
  if (sceneOrder.length && !preserveExistingCollection) {
    template.current_scene = sceneOrder[0].name;
    template.current_program_scene = sceneOrder[0].name;
    template.current_preview_scene = sceneOrder[0].name;
  }
  template.name = getSceneCollectionName(
    preserveExistingCollection ? templateOverrideName(template) : ""
  );
  return template;
}

function generateLegacyScenes(
  template,
  parsedSongs,
  settings,
  canvas,
  songBackgrounds,
  songFontSettings,
  textSettingsMode,
  preserveExistingCollection = false
) {
  const templateScenes = Array.isArray(template.scenes) ? template.scenes : [];
  const templateSources = Array.isArray(template.sources) ? template.sources : [];
  const hasConfiguredBackgrounds = hasSongBackgroundAssignments(songBackgrounds);
  const { templateScene, textItemTemplate, textSourceTemplate } =
    findLegacySceneTemplate(
      templateScenes,
      templateSources
    );
  const mediaTemplates = findLegacyMediaTemplates(templateScenes, templateSources);

  const staticItems = (templateScene.sources || []).filter(
    (item) => {
      if (item === textItemTemplate) {
        return false;
      }
      if (!hasConfiguredBackgrounds) {
        return true;
      }
      const source = templateSources.find(
        (candidate) => candidate.uuid === item.source_uuid || candidate.uuid === item.uuid
      );
      return !isBackgroundMediaSource(source);
    }
  );
  const staticSources = templateSources.filter((source) => {
    if (isTextSource(source)) {
      return false;
    }
    if (hasConfiguredBackgrounds && isBackgroundMediaSource(source)) {
      return false;
    }
    return true;
  });

  const scenes = preserveExistingCollection ? deepClone(templateScenes) : [];
  const sources = preserveExistingCollection
    ? deepClone(templateSources)
    : [...staticSources];
  const sceneOrder = preserveExistingCollection
    ? deepClone(getLegacySceneOrder(template))
    : [];
  let sceneItemId = preserveExistingCollection
    ? getNextLegacySceneItemId(templateScenes)
    : 1;
  const titleCounts = new Map();
  const usedSceneNames = new Set(
    sceneOrder.map((scene) => scene?.name).filter(Boolean)
  );
  const usedSourceNames = new Set(
    sources.map((source) => source?.name).filter(Boolean)
  );
  let sourceCount = getNextLyricsSourceCounter(usedSourceNames);

  parsedSongs.forEach((song, songIndex) => {
    const safeTitle = getUniqueSongPrefix(song.songTitle, titleCounts);
    const songSettings = mergeSongTextSettings(
      settings,
      songFontSettings?.[songIndex],
      textSettingsMode
    );
    const songBackground = buildSongBackgroundAsset({
      song,
      songIndex,
      background: songBackgrounds?.[songIndex],
      safeTitle,
      mediaTemplates,
      canvas,
    });

    if (songBackground) {
      songBackground.sourceName = getUniqueName(songBackground.sourceName, usedSourceNames);
      songBackground.source.name = songBackground.sourceName;
      sources.push(songBackground.source);
    }

    song.scenes.forEach((sceneText, sceneIndex) => {
      const sceneUuid = getUuid();
      const sourceUuid = getUuid();
      const sceneName = getUniqueName(
        `${safeTitle}-${sceneIndex + 1}`,
        usedSceneNames
      );
      const sourceName = getUniqueName(
        `lyrics-source-${sourceCount}`,
        usedSourceNames
      );

      const textSettings = buildTextSettings(sceneText, songSettings, textSourceTemplate);
      const transformSettings = buildTransformSettings(songSettings, textItemTemplate, canvas);

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
      sceneItem.visible = true;
      sceneItem.locked = sceneItem.locked ?? false;

      const scene = deepClone(templateScene);
      scene.name = sceneName;
      if ("uuid" in scene || templateScene.uuid) {
        scene.uuid = sceneUuid;
      }
      const sceneItems = [...staticItems.map(deepClone)];
      if (songBackground) {
        const backgroundItem = createLegacyBackgroundItem(
          songBackground.itemTemplate,
          songBackground,
          canvas
        );
        backgroundItem.scene_item_id = sceneItemId;
        sceneItems.push(backgroundItem);
        sceneItemId += 1;
      }
      sceneItem.scene_item_id = sceneItemId;
      sceneItems.push(sceneItem);
      scene.sources = sceneItems;
      scenes.push(scene);
      sceneOrder.push({ name: sceneName });

      sceneItemId += 1;
      sourceCount = getNextLyricsSourceCounter(usedSourceNames, sourceCount + 1);
    });
  });

  template.scenes = scenes;
  if (sources.length) {
    template.sources = sources;
  }
  template.scene_order = sceneOrder;
  if (scenes.length && !preserveExistingCollection) {
    template.current_program_scene = scenes[0].name;
    template.current_preview_scene = scenes[0].name;
    template.current_scene = scenes[0].name;
  }
  template.name = getSceneCollectionName(
    preserveExistingCollection ? templateOverrideName(template) : ""
  );
  return template;
}

function isSceneSource(source) {
  return source?.id === "scene" || source?.versioned_id === "scene";
}

function isTextSource(source) {
  return source?.id === "text_gdiplus" || source?.versioned_id === "text_gdiplus_v3";
}

function isImageSource(source) {
  return source?.id === "image_source" || source?.versioned_id === "image_source";
}

function isVideoSource(source) {
  return source?.id === "ffmpeg_source" || source?.versioned_id === "ffmpeg_source";
}

function isBackgroundMediaSource(source) {
  return isImageSource(source) || isVideoSource(source);
}

function hasSongBackgroundAssignments(songBackgrounds) {
  return Array.isArray(songBackgrounds)
    ? songBackgrounds.some(
        (background) =>
          background?.type &&
          background.type !== "none" &&
          background.path?.trim()
      )
    : false;
}

function findSceneMediaTemplates(sceneSources, sourceByUuid) {
  const templates = { image: null, video: null };

  for (const scene of sceneSources) {
    const items = Array.isArray(scene.settings?.items) ? scene.settings.items : [];
    for (const item of items) {
      const source = sourceByUuid.get(item.source_uuid);
      if (!source) continue;
      if (!templates.image && isImageSource(source)) {
        templates.image = {
          sourceTemplate: source,
          itemTemplate: item,
        };
      }
      if (!templates.video && isVideoSource(source)) {
        templates.video = {
          sourceTemplate: source,
          itemTemplate: item,
        };
      }
      if (templates.image && templates.video) {
        return templates;
      }
    }
  }

  return templates;
}

function findLegacyMediaTemplates(scenes, sources) {
  const templates = { image: null, video: null };
  const sceneList = Array.isArray(scenes) ? scenes : [];

  for (const scene of sceneList) {
    const items = Array.isArray(scene?.sources) ? scene.sources : [];

    for (const item of items) {
      const source = sources.find(
        (candidate) => candidate.uuid === item.source_uuid || candidate.uuid === item.uuid
      );
      if (!source) continue;
      if (!templates.image && isImageSource(source)) {
        templates.image = { sourceTemplate: source, itemTemplate: item };
      }
      if (!templates.video && isVideoSource(source)) {
        templates.video = { sourceTemplate: source, itemTemplate: item };
      }
      if (templates.image && templates.video) {
        return templates;
      }
    }
  }

  return templates;
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
  const fallbackScene = createDefaultSceneSourceTemplate();
  return {
    templateSceneSource: fallbackScene,
    textSourceTemplate: createDefaultTextSourceTemplate(),
    textItemTemplate: fallbackScene.settings.items[0],
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

function findLegacySceneTemplate(scenes, sources) {
  let fallback = null;

  for (const scene of scenes) {
    const items = Array.isArray(scene?.sources) ? scene.sources : [];
    const directTextItem = items.find((item) => item.id === "text_gdiplus");

    if (directTextItem) {
      const match = {
        templateScene: scene,
        textItemTemplate: directTextItem,
        textSourceTemplate: null,
      };
      if (directTextItem.visible !== false) {
        return match;
      }
      if (!fallback) {
        fallback = match;
      }
    }

    for (const item of items) {
      const source = sources.find(
        (src) => src.uuid === item.source_uuid || src.uuid === item.uuid
      );
      if (source && isTextSource(source)) {
        const match = {
          templateScene: scene,
          textItemTemplate: item,
          textSourceTemplate: source,
        };
        if (item.visible !== false) {
          return match;
        }
        if (!fallback) {
          fallback = match;
        }
      }
    }
  }

  if (fallback) {
    return fallback;
  }

  return createDefaultLegacySceneTemplate();
}

function createDefaultTextSourceTemplate() {
  return {
    id: "text_gdiplus",
    versioned_id: "text_gdiplus_v3",
    settings: deepClone(DEFAULT_TEXT_SETTINGS),
    private_settings: {},
  };
}

function createDefaultSceneSourceTemplate() {
  return {
    id: "scene",
    versioned_id: "scene",
    settings: {
      custom_size: false,
      id_counter: 2,
      items: [
        {
          name: "lyrics-source-template",
          source_uuid: "template-text-uuid",
          visible: true,
          locked: false,
          rot: 0.0,
          scale_ref: { x: 1920.0, y: 1080.0 },
          align: 5,
          bounds_type: 2,
          bounds_align: 0,
          bounds_crop: false,
          crop_left: 0,
          crop_top: 0,
          crop_right: 0,
          crop_bottom: 0,
          id: 1,
          group_item_backup: false,
          pos: { x: 0.0, y: 0.0 },
          pos_rel: { x: -1.7777777910232544, y: -1.0 },
          scale: { x: 1.0, y: 1.0 },
          scale_rel: { x: 1.0, y: 1.0 },
          bounds: { x: 1920.0, y: 1080.0 },
          bounds_rel: { x: 3.555555582046509, y: 2.0 },
          scale_filter: "disable",
          blend_method: "default",
          blend_type: "normal",
          show_transition: { duration: 0 },
          hide_transition: { duration: 0 },
          private_settings: {},
        },
      ],
    },
  };
}

function createDefaultLegacySceneTemplate() {
  const textSourceTemplate = {
    ...createDefaultTextSourceTemplate(),
    uuid: "template-text-uuid",
    name: "lyrics-source-template",
  };

  return {
    templateScene: {
      name: "Template Scene",
      uuid: "template-scene-uuid",
      sources: [
        {
          name: "lyrics-source-template",
          id: "text_gdiplus",
          source_uuid: "template-text-uuid",
          uuid: "template-text-uuid",
          transform: deepClone(DEFAULT_TRANSFORM),
          visible: true,
          locked: false,
        },
      ],
    },
    textItemTemplate: {
      name: "lyrics-source-template",
      id: "text_gdiplus",
      source_uuid: "template-text-uuid",
      uuid: "template-text-uuid",
      transform: deepClone(DEFAULT_TRANSFORM),
      visible: true,
      locked: false,
    },
    textSourceTemplate,
  };
}

function getSceneSourceOrder(template, sceneSources) {
  if (Array.isArray(template?.scene_order) && template.scene_order.length) {
    return template.scene_order;
  }

  return (Array.isArray(sceneSources) ? sceneSources : [])
    .map((scene) => (scene?.name ? { name: scene.name } : null))
    .filter(Boolean);
}

function getLegacySceneOrder(template) {
  if (Array.isArray(template?.scene_order) && template.scene_order.length) {
    return template.scene_order;
  }

  return (Array.isArray(template?.scenes) ? template.scenes : [])
    .map((scene) => (scene?.name ? { name: scene.name } : null))
    .filter(Boolean);
}

function getNextLegacySceneItemId(scenes) {
  const maxId = (Array.isArray(scenes) ? scenes : []).reduce((maxSceneId, scene) => {
    const items = Array.isArray(scene?.sources) ? scene.sources : [];
    const sceneMax = items.reduce((maxItemId, item) => {
      const value = Number(item?.scene_item_id);
      return Number.isFinite(value) ? Math.max(maxItemId, value) : maxItemId;
    }, 0);
    return Math.max(maxSceneId, sceneMax);
  }, 0);

  return maxId + 1;
}

function getNextLyricsSourceCounter(usedNames, startAt = 1) {
  let counter = Math.max(1, Number(startAt) || 1);
  while (usedNames.has(`lyrics-source-${counter}`)) {
    counter += 1;
  }
  return counter;
}

function getUniqueName(baseName, usedNames) {
  const safeBase = String(baseName || "").trim() || "Untitled";
  if (!usedNames.has(safeBase)) {
    usedNames.add(safeBase);
    return safeBase;
  }

  let counter = 2;
  let candidate = `${safeBase}_${counter}`;
  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${safeBase}_${counter}`;
  }
  usedNames.add(candidate);
  return candidate;
}

function templateOverrideName(template) {
  return String(template?.name || "").trim();
}

function collectStaticSources(
  sourceByUuid,
  templateSceneSource,
  textSourceUuid,
  excludeBackgroundMedia = false
) {
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
    if (excludeBackgroundMedia && isBackgroundMediaSource(source)) {
      return;
    }
    if (!seen.has(source.uuid)) {
      staticSources.push(deepClone(source));
      seen.add(source.uuid);
    }
  });

  return staticSources;
}

function buildSongBackgroundAsset({
  songIndex,
  background,
  safeTitle,
  mediaTemplates,
}) {
  if (!background?.type || background.type === "none" || !background.path?.trim()) {
    return null;
  }

  const kind = background.type === "image" ? "image" : "video";
  const template = mediaTemplates?.[kind] || null;
  const sourceUuid = getUuid();
  const sourceName = `${safeTitle}-background-${songIndex + 1}`;
  const normalizedPath = normalizeObsMediaPath(background.path);

  const source = deepClone(
    template?.sourceTemplate || (kind === "image" ? DEFAULT_IMAGE_SOURCE : DEFAULT_VIDEO_SOURCE)
  );
  source.name = sourceName;
  source.uuid = sourceUuid;
  source.id = kind === "image" ? "image_source" : "ffmpeg_source";
  source.versioned_id = source.versioned_id || source.id;
  const baseSourceSettings = source.settings || {};
  source.settings = {
    ...baseSourceSettings,
    ...(kind === "image"
      ? { file: normalizedPath }
      : template?.sourceTemplate
        ? { local_file: normalizedPath }
        : {
            local_file: normalizedPath,
            looping: true,
            restart_on_activate: true,
            clear_on_media_end: false,
          }),
  };

  return {
    source,
    sourceUuid,
    sourceName,
    type: kind,
    itemTemplate: template?.itemTemplate || null,
  };
}

function createSceneSourceBackgroundItem(itemTemplate, backgroundAsset, canvas) {
  const item = deepClone(itemTemplate || createDefaultSceneSourceBackgroundItem(backgroundAsset.type, canvas));
  item.name = backgroundAsset.sourceName;
  item.source_uuid = backgroundAsset.sourceUuid;
  item.visible = true;
  item.locked = false;
  return item;
}

function createLegacyBackgroundItem(itemTemplate, backgroundAsset, canvas) {
  const item = deepClone(
    itemTemplate || createDefaultLegacyBackgroundItem(backgroundAsset.type, canvas)
  );
  item.name = backgroundAsset.sourceName;
  item.id = backgroundAsset.source.id;
  if ("source_uuid" in item || itemTemplate?.source_uuid) {
    item.source_uuid = backgroundAsset.sourceUuid;
  }
  if ("uuid" in item || itemTemplate?.uuid) {
    item.uuid = backgroundAsset.sourceUuid;
  }
  item.settings = {
    ...(item.settings || {}),
    ...(backgroundAsset.source.settings || {}),
  };
  item.visible = true;
  item.locked = item.locked ?? false;
  return item;
}

function createDefaultSceneSourceBackgroundItem(type, canvas) {
  const fullBounds = { x: canvas.width, y: canvas.height };
  return {
    visible: true,
    locked: false,
    rot: 0.0,
    scale_ref: fullBounds,
    align: 5,
    bounds_type: type === "image" ? 2 : 0,
    bounds_align: 0,
    bounds_crop: false,
    crop_left: 0,
    crop_top: 0,
    crop_right: 0,
    crop_bottom: 0,
    group_item_backup: false,
    pos: { x: 0, y: 0 },
    pos_rel: getRelativePos({ x: 0, y: 0 }, canvas),
    scale: { x: 1, y: 1 },
    scale_rel: { x: 1, y: 1 },
    bounds: type === "image" ? fullBounds : { x: 0, y: 0 },
    bounds_rel: type === "image" ? getRelativeBounds(fullBounds, canvas) : { x: 0, y: 0 },
    scale_filter: "disable",
    blend_method: "default",
    blend_type: "normal",
    show_transition: { duration: 300 },
    hide_transition: { duration: 300 },
    private_settings: {},
  };
}

function createDefaultLegacyBackgroundItem(type, canvas) {
  return {
    id: type === "image" ? "image_source" : "ffmpeg_source",
    source_uuid: "",
    uuid: "",
    transform: {
      ...DEFAULT_TRANSFORM,
      position: { x: 0, y: 0 },
      alignment: 5,
      bounds_type: type === "image" ? "OBS_BOUNDS_SCALE_INNER" : "OBS_BOUNDS_NONE",
      bounds: type === "image" ? { x: canvas.width, y: canvas.height } : { x: 0, y: 0 },
    },
    visible: true,
    locked: false,
  };
}

function normalizeObsMediaPath(path) {
  return String(path || "")
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/\\/g, "/");
}

function buildTextSettings(text, settings, templateSource) {
  const baseSettings =
    templateSource?.settings && typeof templateSource.settings === "object"
      ? templateSource.settings
      : DEFAULT_TEXT_SETTINGS;
  const obsColor = hexToObsColor(settings.fontColor);
  const obsOutlineColor = hexToObsColor(settings.outlineColor);
  const alignValue = alignmentToObs(settings.alignment, baseSettings.align);
  const valignValue =
    typeof baseSettings.valign !== "undefined"
      ? baseSettings.valign
      : verticalAlignmentToObs("center", DEFAULT_TEXT_SETTINGS.valign);
  const baseFontFlags = Number.isFinite(Number(baseSettings.font?.flags))
    ? Number(baseSettings.font.flags)
    : 0;
  const fontFlags = settings.bold ? (baseFontFlags | 1) : baseFontFlags & ~1;
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
      flags: fontFlags,
    },
    color: obsColor,
    outline:
      typeof settings.outline === "boolean"
        ? settings.outline
        : typeof baseSettings.outline === "boolean"
          ? baseSettings.outline
          : DEFAULT_TEXT_SETTINGS.outline,
    outline_color:
      settings.outlineColor
        ? obsOutlineColor
        : typeof baseSettings.outline_color === "number"
          ? baseSettings.outline_color
          : DEFAULT_TEXT_SETTINGS.outline_color,
    outline_size:
      Number.isFinite(Number(settings.outlineSize)) && Number(settings.outlineSize) >= 0
        ? Number(settings.outlineSize)
        : Number.isFinite(Number(baseSettings.outline_size))
          ? Number(baseSettings.outline_size)
          : DEFAULT_TEXT_SETTINGS.outline_size,
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
  const safe = String(title || "Song").trim().normalize("NFC");
  if (!safe) return "Song";
  // Preserve combining marks so scripts like Telugu keep their vowel signs intact.
  const compact = safe.replace(/[^\p{L}\p{M}\p{N}]+/gu, "");
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
  const sanitized = hex.replace("#", "").trim();
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => char + char)
          .join("")
      : sanitized;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return DEFAULT_TEXT_SETTINGS.color;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  // OBS text_gdiplus stores colors as AABBGGRR, not AARRGGBB.
  return (((0xff << 24) >>> 0) | (blue << 16) | (green << 8) | red) >>> 0;
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

function getSceneCollectionName(baseName = "", date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const amPm = hours24 >= 12 ? "PM" : "AM";
  const hours12 = String(((hours24 + 11) % 12) + 1).padStart(2, "0");
  const prefix = String(baseName || "").trim() || "Worship Lyrics";

  return `${prefix} ${year}-${month}-${day} ${hours12}-${minutes} ${amPm}`;
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










