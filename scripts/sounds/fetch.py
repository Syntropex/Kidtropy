#!/usr/bin/env python3
"""
Download Kidtropy's real sound effects from Freesound.org.

Every sound is CC0 (public domain); the script double-checks each license.
It keeps the loudest few seconds of each recording, evens out the volume,
and writes public/sounds/<item>.mp3 plus src/voice/sounds.json.

    npm run sounds

To swap a sound: find a CC0 sound on freesound.org, put its number below.
"""
import json, os, re, subprocess, sys, tempfile, urllib.parse, urllib.request

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "sounds")
LIST = os.path.join(ROOT, "src", "voice", "sounds.json")
CREDITS = os.path.join(ROOT, "public", "sounds", "CREDITS.md")
UA = {"User-Agent": "Mozilla/5.0 (Kidtropy open-source sound fetcher)"}

# item id -> (freesound id, seconds to keep, description)
SOUNDS = {
    # Farm
    "cow": (59245, 2.0, "cow moo"),
    "pig": (442906, 1.5, "pig oink"),
    "sheep": (171151, 1.5, "sheep baa"),
    "horse": (269571, 2.0, "horse neigh"),
    "chicken": (607245, 2.0, "chicken clucking"),
    "rooster": (435508, 2.5, "rooster crow"),
    "duck": (242664, 1.5, "duck quack"),
    "goat": (581240, 2.0, "goat bleat"),
    "turkey": (233123, 1.5, "turkey gobble"),
    "dog": (386766, 2.0, "dog bark"),
    "cat": (110011, 1.8, "cat meow"),
    # Wild animals
    "lion": (467762, 2.0, "lion roar"),
    "tiger": (571288, 1.6, "tiger roar"),
    "elephant": (527845, 2.2, "elephant trumpet"),
    "monkey": (67355, 3.0, "gibbon calls"),
    "owl": (465697, 2.5, "owl hoot"),
    "frog": (361117, 1.6, "frog croak"),
    "snake": (553374, 1.8, "snake hiss"),
    "bee": (481647, 2.0, "bee buzz"),
    "whale": (88449, 3.0, "whale song"),
    "trex": (147527, 2.5, "dinosaur growl"),
    # Vehicles
    "car": (423990, 1.2, "car horn beep beep"),
    "firetruck": (800708, 3.0, "siren wail"),
    "police": (58015, 3.0, "siren yelp"),
    "ambulance": (560396, 3.0, "ambulance siren"),
    "train": (71778, 3.0, "steam train whistle"),
    "airplane": (805169, 3.0, "jet flyby"),
    "helicopter": (88464, 2.5, "helicopter"),
    "rocket": (521377, 1.6, "rocket launch"),
    "boat": (546528, 2.5, "ship horn"),
    "bicycle": (81875, 1.8, "bicycle bell"),
    "motorcycle": (683250, 3.0, "motorcycle revs"),
    "racecar": (339137, 2.2, "V8 race car accelerating"),
    "bus": (635681, 2.0, "bus horn"),
    "tractor": (707744, 2.0, "tractor engine"),
    # Construction
    "dumptruck": (705155, 2.5, "truck backup beeps"),
    "garbage": (705155, 2.5, "truck backup beeps"),
    "excavator": (379883, 3.0, "tracked machine moving"),
    "bulldozer": (379883, 3.0, "tracked machine moving"),
    "crane": (378003, 2.6, "crane machinery"),
    "hammer": (17012, 1.6, "hammering"),
}


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()


def info(sid):
    """Return (preview url, author, title) and assert the sound is CC0."""
    page = get(f"https://freesound.org/s/{sid}/").decode("utf-8", "replace")
    if "publicdomain/zero" not in page:
        raise SystemExit(f"Freesound {sid} is not CC0, refusing to use it")
    prev = re.search(r"https://cdn\.freesound\.org/previews/\d+/" + str(sid) + r"_\d+-hq\.mp3", page)
    if not prev:
        lq = re.search(r"(https://cdn\.freesound\.org/previews/\d+/" + str(sid) + r"_\d+)-lq\.mp3", page)
        prev_url = lq.group(1) + "-hq.mp3"
    else:
        prev_url = prev.group(0)
    author = re.search(r'href="/people/([^/"]+)/"', page)
    title = re.search(r"<title>([^<]*)</title>", page)
    t = title.group(1).replace(" - Freesound", "").strip() if title else str(sid)
    t = re.sub(r"^Freesound\s*-\s*", "", t)
    name = urllib.parse.unquote(author.group(1)) if author else "unknown"
    t = re.sub(r"\s+by\s+" + re.escape(name) + r"\s*$", "", t)
    return prev_url, name, t


def decode(path, sr=44100):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32), sr


def loudest_window(x, sr, secs):
    """Start time of the `secs`-long stretch with the most energy."""
    n = int(secs * sr)
    if len(x) <= n:
        return 0.0
    e = np.convolve(x.astype(np.float64) ** 2, np.ones(1024) / 1024, mode="same")
    c = np.concatenate([[0], np.cumsum(e)])
    sums = c[n:] - c[:-n]
    return float(np.argmax(sums[:: 256]) * 256) / sr


def main():
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    cache = {}
    credits = []
    with tempfile.TemporaryDirectory() as tmp:
        for item, (sid, secs, desc) in SOUNDS.items():
            if sid not in cache:
                url, author, title = info(sid)
                src = os.path.join(tmp, f"{sid}.mp3")
                with open(src, "wb") as fh:
                    fh.write(get(url))
                cache[sid] = (src, author, title)
            src, author, title = cache[sid]
            credits.append(f"| {item} | [{title}](https://freesound.org/s/{sid}/) by {author} | {desc} |")
            dest = os.path.join(OUT, f"{item}.mp3")
            if only and item not in only and os.path.exists(dest):
                continue
            x, sr = decode(src)
            start = loudest_window(x, sr, secs)
            fade = max(0.05, min(0.3, secs * 0.15))
            subprocess.run(
                ["ffmpeg", "-loglevel", "error", "-y", "-ss", f"{start:.3f}", "-t", f"{secs:.3f}", "-i", src,
                 "-af", "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                 f"afade=t=in:d=0.02,afade=t=out:st={max(0, secs - fade):.3f}:d={fade:.3f},loudnorm=I=-18:TP=-2:LRA=11",
                 "-ac", "1", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "64k", dest],
                check=True,
            )
            print(f"{item:11} <- {sid} {title[:40]!r} by {author} @ {start:.2f}s", flush=True)

    with open(LIST, "w") as fh:
        json.dump(sorted(SOUNDS), fh)
        fh.write("\n")
    with open(CREDITS, "w") as fh:
        fh.write("# Sound credits\n\nAll sounds are from [Freesound.org](https://freesound.org) and are released under\n"
                 "[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (public domain). Credit isn't required, but thank you!\n\n"
                 "| Used for | Sound | What |\n|---|---|---|\n" + "\n".join(credits) + "\n")


if __name__ == "__main__":
    main()
