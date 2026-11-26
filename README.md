# 🚜 Kidtropy

**Free, open-source learning games for preschoolers who love trucks, diggers, dinosaurs, animals, farms and racing.**

Built for little fingers on phones and iPads. No reading needed: everything is spoken out loud in a warm, natural voice. Real animal and vehicle sounds, colorful 3D pictures. No ads, accounts or tracking.

▶️ **Play:** https://kidtropy.syntropex.tech

## Grades: Pre-K, Kindergarten and 1st grade

Pick a grade at the top of the home screen. Each grade has five sections:

| | Section | What's in it |
|---|---|---|
| 🎮 | **Play** | The games below. They work for every age. |
| 🎯 | **Practice** | Endless skill games with stars and stickers. Wrong answers get a hint and another try. |
| 📚 | **Learn** | Short spoken lessons ("A ten frame has ten spaces…"), then a few practice questions. |
| 🧰 | **Tools** | Tracing letters and numbers, counting board, number chart, clock, flashcards. |
| ✅ | **Quiz** | 10 questions per skill, scored with up to 3 stars. Scores appear in the grown-ups progress report. |

**Math:** numbers, counting, shapes, colors, big/small, patterns (Pre-K) · numbers to 20, ten frames, more/fewer, bigger number, adding and taking away within 10, 3D shapes (K) · adding and subtracting within 20, make 10, counting to 120, tens and ones, comparing numbers, telling time, longer/shorter (1st).
**French** (for English speakers, Pre-K and K): hello and goodbye, animals, colors, counting to 5 and 10, vehicles, food, body and family. An English narrator explains and a French voice says the words: "In French, cat is… *le chat*. Say it with me!"
**Reading:** letters (Pre-K) · letter sounds, upper/lowercase, rhymes, sight words, reading short words (K) · sh/ch/th, sight words, word families, reading sentences (1st).

## The games

| | Game | What they learn |
|---|---|---|
| 🗣️ | **Talk Time** | *What is it?* Kidtropy shows a picture, asks what it is, and **listens** for the answer, a bit like talking to a smart speaker. *Show me!*: the kid says "dinosaur!" or "excavator!" and Kidtropy shows it and tells a fun fact. Also knows a few jokes. |
| 👆 | **Find It** | "Tap the cement mixer!" or "Who says moo?" (vocabulary, listening) |
| 🔢 | **Count It** | Tap each digger to count it out loud, then pick how many (counting 1–10) |
| 🎨 | **Colors** | "Tap the blue truck!" |
| 🦴 | **Dino Dig** | Rub the dirt away with a finger to dig up dinosaurs and fossils |
| 🏁 | **Race!** | Pick a race car, wait for the green light, and tap GO as fast as you can |
| 🔤 | **ABC** | "B is for bulldozer!" Letter words follow your kid's favorite themes |
| 🐮 | **Sounds** | A talking picture board: "The cow says moo!", "The fire truck goes wee-oo!" |

Right answers earn ⭐ stars, and every 5 stars unlocks a sticker for the sticker book. Wrong answers only get a gentle wiggle and a hint.

**Themes:** the bubbles at the top of the home screen (🚚 🏗️ 🦖 🦁 🐄 🏎️) pick what shows up in every game. Choose one or several, or 🌈 for everything.

**Grown-ups:** press and hold the 🔒 button at the bottom of the home screen for 2 seconds. There you can pick the voice, talking speed, microphone, difficulty, and reset progress.

## Tips for parents

- **Install it like an app.** iPhone/iPad: Safari → Share → *Add to Home Screen*. Android: Chrome → ⋮ → *Install app*. It then runs full screen and works offline (except listening).
- **Guided Access** (iOS Settings → Accessibility) keeps a toddler inside the app.
- **Talk Time listening** uses the browser's speech recognition. It works in Safari on iPhone/iPad (iOS 14.5+) and Chrome on Android. Kids' voices are hard for computers, so matching is very forgiving, and there's always a 👍 button when the computer misses a right answer. Without a microphone it still works as a "say it out loud" picture quiz.

## Privacy

Kidtropy stores stars and settings only in the browser on your device (`localStorage`). There is no backend, database, analytics or account. When the microphone is used, the *browser's own* speech service (Apple's or Google's) turns speech into text; Kidtropy never records or uploads audio.

## Development

```bash
npm install
npm run dev      # http://localhost:5173 (also reachable from a phone on your Wi-Fi)
npm test         # unit tests (speech matching, catalog)
npm run build    # static site in dist/
```

Plain TypeScript and Vite with no UI framework: the app code is about 30 KB gzipped. Voice clips, pictures and sounds load as needed and are cached for offline play.

### Voice, pictures and sounds

| | Where | How it's made |
|---|---|---|
| 🗣️ Voice | `public/voice/*.mp3` | `npm run voice` records every sentence in `src/voice/lines.ts` with the open-source [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M) voice (needs `python3`, `ffmpeg`, and `pip install kokoro-onnx soundfile`; the model downloads once). Only new sentences are recorded. |
| 🖼️ Pictures | `public/pics/*.webp` | [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) 3D (MIT), plus original SVG drawings in `src/art/art.ts`. |
| 🔊 Sounds | `public/sounds/*.mp3` | `npm run sounds` downloads CC0 recordings from Freesound (list in `scripts/sounds/fetch.py`), keeps the best seconds and evens the volume. |

`npm test` fails if a sentence has no recorded clip, so new phrases don't silently fall back to the robot voice. See [CREDITS.md](CREDITS.md).

```
src/
  app.ts            home screen, router, sticker book, grown-ups page
  voice/lines.ts    every sentence Kidtropy says (one place, so it can be pre-recorded)
  data/items.ts     the picture catalog: names, aliases, sounds, fun facts
  learn/            grades, skills, lessons, quizzes and tools (math.ts, reading.ts, tools/)
  art/art.ts        hand-drawn SVGs (excavator, bulldozer, triceratops, …)
  games/*.ts        one file per game
  lib/speech.ts     plays the recorded voice (falls back to device speech) + listening
  lib/match.ts      forgiving matching for little voices
  lib/sfx.ts        synthesized sound effects (no audio files)
  lib/ui.ts         helpers, confetti, stars and stickers
```

### Adding things

- **A new picture:** add an entry to `src/data/items.ts` with an `emoji` (or draw an SVG in `src/art/art.ts`), a few `aliases` kids might say, a `sound`, and a `fact`, then run `npm run voice`. It shows up in every game automatically.
- **New words for Kidtropy to say:** add them to `src/voice/lines.ts` (and to `allLines()`), then `npm run voice`.
- **A new skill:** add a `Skill` to `src/learn/math.ts` or `src/learn/reading.ts` with a `make()` that returns a random question and a `lines()` that lists every sentence it can say. It gets a Practice tile and a Quiz automatically.
- **A new game:** create `src/games/mygame.ts` exporting a `Game`, then add it to `GAMES` in `src/app.ts`. Check `scene.alive()` after every `await` so the game stops cleanly when the kid taps 🏠.

Contributions are welcome! Keep it toddler-proof: big tap targets, everything spoken aloud, no reading required, nothing scary, and no data leaving the device.

## Deploying

The site is fully static and served by **Cloudflare Workers Static Assets** (see `wrangler.jsonc`), on the custom domain `kidtropy.syntropex.tech`.

- **Manual:** `npx wrangler login && npm run deploy`
- **Automatic:** `.github/workflows/deploy.yml` deploys every push to `main` once the repository has `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.

## License

Code: [MIT](LICENSE) © Syntropex. Voice, pictures and sounds: see [CREDITS.md](CREDITS.md) (Apache-2.0 voice model, MIT pictures, CC0 sounds).
