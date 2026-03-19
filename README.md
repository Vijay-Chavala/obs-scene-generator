# Church Lyrics Scene Generator

A frontend-only Next.js app that converts worship lyrics in a `.txt` file into an OBS Scene Collection JSON file.

## Features
- Upload lyrics `.txt`
- Automatically parse songs and split scenes on **two empty lines**
- Preview detected songs/scenes
- Configure text styling (font, size, color, alignment, extents)
- Optional OBS template import for compatibility
- Generate and download OBS Scene Collection JSON
- Light/Dark mode toggle

## Lyrics Format
```
Song-1 Name
[ Way Maker ]

You are here moving in our midst
I worship You
I worship You


You are Way Maker
Miracle Worker
Promise Keeper
Light in the darkness
```

## Running
```
npm install
npm run dev
```

## Output
Generated file: `church-lyrics-scenes.json`

Import it in OBS via **Scene Collection ? Import**.
