export function parseLyricsText(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const songs = [];

  let currentSong = null;
  let currentSceneLines = [];
  let emptyRun = 0;

  function flushScene() {
    if (!currentSong) return;
    const sceneText = currentSceneLines.join("\n").trimEnd();
    if (sceneText.length === 0) return;
    currentSong.scenes.push(sceneText);
  }

  function startSong(title) {
    if (currentSong) {
      flushScene();
      songs.push(currentSong);
    }
    currentSong = { title, scenes: [] };
    currentSceneLines = [];
    emptyRun = 0;
  }

  for (const rawLine of lines) {
    const line = rawLine;

    const titleMatch = line.match(/^\[\s*(.+?)\s*\]$/);
    if (titleMatch) {
      startSong(titleMatch[1]);
      continue;
    }

    if (!currentSong) continue;

    if (line.trim() === "") {
      emptyRun += 1;
      currentSceneLines.push("");
      if (emptyRun >= 2) {
        flushScene();
        currentSceneLines = [];
        emptyRun = 0;
      }
      continue;
    }

    emptyRun = 0;
    currentSceneLines.push(line);
  }

  if (currentSong) {
    flushScene();
    songs.push(currentSong);
  }

  return songs;
}

