export function parseLyrics(text) {
  if (!text) return [];

  const lines = String(text).replace(/\r\n/g, "\n").split("\n");
  const songs = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]?.trim();
    if (isSongHeader(line)) {
      let title = "Untitled Song";
      let j = i + 1;

      while (j < lines.length && lines[j].trim() === "") {
        j += 1;
      }

      const titleMatch = lines[j]?.match(/\[(.+?)\]/);
      if (titleMatch) {
        title = titleMatch[1].trim();
        j += 1;
      }

      const lyricLines = [];
      for (; j < lines.length; j += 1) {
        if (isSongHeader(lines[j]?.trim())) {
          break;
        }
        lyricLines.push(lines[j]);
      }

      const scenes = splitScenes(lyricLines);
      songs.push({ songTitle: title, scenes });
      i = j;
      continue;
    }
    i += 1;
  }

  return songs.filter((song) => song.scenes.length);
}

function isSongHeader(line) {
  if (!line) return false;
  return /^song-\d+\s+name/i.test(line.trim());
}

function splitScenes(lines) {
  const scenes = [];
  let current = [];
  let emptyCount = 0;

  const flush = () => {
    const cleaned = trimEmptyLines(current);
    if (cleaned.length) {
      scenes.push(cleaned.join("\n"));
    }
    current = [];
  };

  lines.forEach((line) => {
    if (line.trim() === "") {
      emptyCount += 1;
      if (emptyCount >= 2) {
        flush();
        emptyCount = 0;
      } else {
        current.push("");
      }
      return;
    }

    emptyCount = 0;
    current.push(line);
  });

  flush();
  return scenes;
}

function trimEmptyLines(lines) {
  let start = 0;
  let end = lines.length - 1;
  while (start <= end && lines[start].trim() === "") start += 1;
  while (end >= start && lines[end].trim() === "") end -= 1;
  return lines.slice(start, end + 1);
}
