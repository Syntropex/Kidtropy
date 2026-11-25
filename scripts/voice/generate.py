#!/usr/bin/env python3
"""
Record every Kidtropy sentence with the open-source Kokoro voice.

    npm run voice            # only records new/changed sentences
    npm run voice -- --all   # re-record everything

Writes public/voice/<id>.mp3 and src/voice/manifest.json.
Needs: python3, ffmpeg, and `pip install kokoro-onnx soundfile`.
The Kokoro model (Apache-2.0, ~350 MB) is downloaded once to ~/.cache/kidtropy.
"""
import json, os, re, subprocess, sys, tempfile, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "voice")
MANIFEST = os.path.join(ROOT, "src", "voice", "manifest.json")
CACHE = os.path.expanduser(os.environ.get("KIDTROPY_CACHE", "~/.cache/kidtropy"))
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
FILES = ["kokoro-v1.0.onnx", "voices-v1.0.bin"]

VOICE = os.environ.get("KIDTROPY_VOICE", "af_heart")  # warm, friendly US English
SPEED = float(os.environ.get("KIDTROPY_SPEED", "0.9"))  # a little slower for little ears
# Slowing down one- or two-word phrases makes Kokoro garble them ("Six!"), so those use normal speed.
SHORT_SPEED = 1.0


def speed_for(text):
    return SHORT_SPEED if len(re.findall(r"[A-Za-z0-9']+", text)) <= 2 else SPEED

# Say these differently than they're written (the clip still answers to the original text).
SPEAK_AS = {
    "Six!": "/sˈɪks.",  # a leading "/" means: these are phonemes
    "Set...": "Set.",
    "Woo hoo!": "/wˈuː hˈuː!",
    "E!": "E.",
}

# Pronunciation fixes, applied to the phonemes of matching sentences.
PHONEME_FIXES = [
    (re.compile(r"^A is for"), "ɐ ɪz fɔːɹ", "ˈeɪ ɪz fɔːɹ"),  # letter A, not "uh"
]


def lines():
    """Ask the TypeScript side for every sentence the app can say."""
    bundle = subprocess.run(
        ["npx", "esbuild", "scripts/voice/dump-lines.ts", "--bundle", "--platform=node", "--format=esm", "--log-level=warning"],
        cwd=ROOT, check=True, capture_output=True, text=True,
    ).stdout
    out = subprocess.run(["node", "--input-type=module"], input=bundle, cwd=ROOT, check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def model():
    os.makedirs(CACHE, exist_ok=True)
    for f in FILES:
        path = os.path.join(CACHE, f)
        if not os.path.exists(path):
            print(f"Downloading {f} ...", flush=True)
            urllib.request.urlretrieve(MODEL_URL + f, path + ".part")
            os.replace(path + ".part", path)
    from kokoro_onnx import Kokoro

    return Kokoro(os.path.join(CACHE, FILES[0]), os.path.join(CACHE, FILES[1]))


def main():
    redo = "--all" in sys.argv
    import soundfile as sf

    items = lines()
    wanted = {x["id"]: x["text"] for x in items}
    phonemes = {x["id"]: x["phonemes"] for x in items if x.get("phonemes")}
    os.makedirs(OUT, exist_ok=True)
    short_only = "--short" in sys.argv  # re-record only one/two-word phrases
    todo = [
        (i, t) for i, t in wanted.items()
        if redo or (short_only and speed_for(t) == SHORT_SPEED) or not os.path.exists(os.path.join(OUT, f"{i}.mp3"))
    ]
    print(f"{len(wanted)} sentences, {len(todo)} to record with {VOICE}", flush=True)

    if todo:
        k = model()
        with tempfile.TemporaryDirectory() as tmp:
            for n, (cid, text) in enumerate(todo, 1):
                text = "/" + phonemes[cid] if cid in phonemes else SPEAK_AS.get(text, text)
                fixes = [f for f in PHONEME_FIXES if f[0].search(text)]
                if text.startswith("/"):
                    samples, sr = k.create(text[1:], voice=VOICE, speed=speed_for(text), is_phonemes=True)
                elif fixes:
                    ph = k.tokenizer.phonemize(text, "en-us")
                    for _, bad, good in fixes:
                        ph = ph.replace(bad, good)
                    samples, sr = k.create(ph, voice=VOICE, speed=speed_for(text), is_phonemes=True)
                else:
                    samples, sr = k.create(text, voice=VOICE, speed=speed_for(text), lang="en-us")
                wav = os.path.join(tmp, "x.wav")
                sf.write(wav, samples, sr)
                subprocess.run(
                    ["ffmpeg", "-loglevel", "error", "-y", "-i", wav,
                     # trim silence at both ends, keep a hair of air
                     "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.05",
                     "-ac", "1", "-ar", "24000", "-codec:a", "libmp3lame", "-b:a", "48k", os.path.join(OUT, f"{cid}.mp3")],
                    check=True,
                )
                if n % 50 == 0 or n == len(todo):
                    print(f"  {n}/{len(todo)}", flush=True)

    # Remove clips for sentences the app no longer says.
    removed = 0
    for f in os.listdir(OUT):
        if f.endswith(".mp3") and f[:-4] not in wanted:
            os.remove(os.path.join(OUT, f))
            removed += 1
    with open(MANIFEST, "w") as fh:
        json.dump({"voice": f"kokoro:{VOICE}", "clips": sorted(wanted)}, fh, separators=(",", ":"))
        fh.write("\n")
    print(f"Done. {len(wanted)} clips, {removed} old clips removed.")


if __name__ == "__main__":
    main()
