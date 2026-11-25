# 🚜 Kidtropy

**Free, open-source learning games for preschoolers who love trucks, diggers, dinosaurs, animals, farms and racing.**

Built for little fingers on phones and iPads. No reading needed: everything is spoken out loud. No ads, accounts or tracking.

▶️ **Play:** https://kidtropy.syntropex.tech

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

Plain TypeScript and Vite with no UI framework: the whole app is about 25 KB gzipped.

```
src/
  app.ts            home screen, router, sticker book, grown-ups page
  data/items.ts     the picture catalog: names, aliases, sounds, fun facts
  art/art.ts        hand-drawn SVGs (excavator, bulldozer, triceratops, …)
  games/*.ts        one file per game
  lib/speech.ts     text-to-speech and speech recognition
  lib/match.ts      forgiving matching for little voices
  lib/sfx.ts        synthesized sound effects (no audio files)
  lib/ui.ts         helpers, confetti, stars and stickers
```

### Adding things

- **A new picture:** add an entry to `src/data/items.ts` with an `emoji` (or draw an SVG in `src/art/art.ts`), a few `aliases` kids might say, a `sound`, and a `fact`. It shows up in every game automatically.
- **A new game:** create `src/games/mygame.ts` exporting a `Game`, then add it to `GAMES` in `src/app.ts`. Check `scene.alive()` after every `await` so the game stops cleanly when the kid taps 🏠.

Contributions are welcome! Keep it toddler-proof: big tap targets, everything spoken aloud, no reading required, nothing scary, and no data leaving the device.

## Deploying

The site is fully static and served by **Cloudflare Workers Static Assets** (see `wrangler.jsonc`), on the custom domain `kidtropy.syntropex.tech`.

- **Manual:** `npx wrangler login && npm run deploy`
- **Automatic:** `.github/workflows/deploy.yml` deploys every push to `main` once the repository has `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.

## License

[MIT](LICENSE) © Syntropex. All artwork in `src/art/` is original and covered by the same license. Emoji are rendered by each device's own emoji font.
