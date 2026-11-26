#!/usr/bin/env python3
"""
Download Kidtropy's real sound effects from Freesound.org.

Every sound is CC0 (public domain); the script double-checks each license.
It keeps the loudest few seconds of each recording, evens out the volume,
and writes public/sounds/<item>.mp3 plus src/voice/sounds.json.

    npm run sounds            # fetch sounds that don't exist yet
    npm run sounds -- --all   # redo every sound
    npm run sounds -- cow     # redo just these

To swap a sound: find a CC0 sound on freesound.org, put its number below.
"""
import html, json, os, re, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

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
    # More vehicles
    "taxi": (434878, 1.0, "car honking"),
    "pickup": (328224, 2.5, "truck engine starting"),
    "delivery": (32417, 1.0, "car horn"),
    "semi": (131930, 2.2, "air horn"),
    "tow": (370877, 2.0, "chains rattling"),
    "monster": (127981, 2.1, "big V8 engine rev"),
    "mixer": (825464, 1.6, "construction machine"),
    "roller": (379883, 2.5, "tracked machine moving"),
    "tire": (104026, 2.0, "tires squeaking"),
    "builder": (566206, 1.8, "power drill"),
    # Dinosaurs (pretend!)
    "longneck": (531725, 3.0, "giant footsteps"),
    "triceratops": (85568, 2.2, "dragon roar"),
    "stegosaurus": (347410, 2.5, "monster roar"),
    "pterodactyl": (381200, 2.1, "eagle cry"),
    # More animals
    "shark": (467701, 1.6, "big bite"),
    "crocodile": (411750, 2.0, "alligator growl"),
    "penguin": (705839, 0.8, "penguin squeak"),
    "zebra": (850661, 2.5, "zebra braying"),
    "octopus": (59978, 2.0, "bubbles"),
    "rabbit": (180158, 2.0, "munching"),
    "wolf": (203342, 3.0, "wolf howl"),
    "bird": (511094, 2.6, "bird singing"),
    "mouse": (188043, 0.9, "mouse squeak"),
    "dolphin": (456151, 2.6, "dolphin"),
    "seal": (680735, 2.0, "sea lion bark"),
    "gorilla": (59834, 0.9, "gorilla"),
    # Food and things
    "carrot": (718593, 1.2, "crispy bite"),
    "apple": (275015, 0.9, "apple bite"),
    "corn": (652638, 2.5, "popcorn popping"),
    "egg": (150479, 0.8, "egg cracking"),
    "trophy": (859076, 3.0, "kids cheering"),
    "medal": (859076, 3.0, "kids cheering"),
    "parrot": (187928, 2.5, "parrots"),
    "chick": (519193, 1.8, "baby chicks"),
    "donkey": (560692, 1.8, "donkey bray"),
    "cricket": (400663, 1.2, "cricket chirp"),
    "hippo": (759858, 2.7, "hippopotamus"),
    "tram": (497561, 2.4, "tram bell"),
    # Instruments (soundboard only, see src/data/soundboard.ts)
    "trumpet": (397355, 1.7, "ta-da fanfare"),
    "guitar": (188037, 2.5, "guitar strumming"),
    "drum": (197763, 1.7, "drum roll"),
    "violin": (37284, 2.5, "violin"),
    "saxophone": (447842, 2.5, "tenor saxophone"),
    "bell": (352242, 2.0, "handbell"),
    "banjo": (521640, 2.5, "banjo"),
    "accordion": (119542, 2.6, "accordion"),
    "harp": (610703, 2.5, "harp glissando"),
    # Fun sounds (soundboard only)
    "sled": (453202, 2.5, "sleigh bells"),
    "ufo": (454595, 2.5, "cartoon UFO"),
    "thunder": (193170, 3.0, "thunder"),
    "ocean": (442944, 3.0, "ocean wave"),
    "fireworks": (117616, 3.0, "fireworks"),
    "doorbell": (442280, 3.0, "doorbell"),
    "phone": (528111, 1.3, "phone ringing"),
    "alarm": (128910, 2.5, "alarm clock"),
    "baby": (458645, 1.9, "baby giggle"),
    "sneeze": (54505, 2.5, "sneeze"),
    "snore": (108519, 3.0, "snoring"),
    "balloon": (54012, 0.8, "balloon pop"),
    "camera": (157812, 1.2, "camera click"),
    "toilet": (274448, 3.0, "toilet flush"),
    "kiss": (536335, 1.5, "cartoon kiss"),
    "slide": (403002, 1.1, "slide whistle"),
    "boing": (540790, 1.1, "boing"),
    "laugh": (371342, 2.5, "kids laughing"),
}


CACHE = os.path.expanduser(os.environ.get("KIDTROPY_CACHE", "~/.cache/kidtropy")) + "/freesound"


def get(url):
    # Freesound rate-limits bursts; back off and retry.
    for attempt in range(6):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
        except urllib.error.HTTPError as e:
            if e.code not in (403, 429) or attempt == 5:
                raise
            time.sleep(20 * (attempt + 1))


def cached(sid):
    """Download (once) the preview and license info of a Freesound sound."""
    os.makedirs(CACHE, exist_ok=True)
    meta_path, mp3 = os.path.join(CACHE, f"{sid}.json"), os.path.join(CACHE, f"{sid}.mp3")
    if not (os.path.exists(meta_path) and os.path.exists(mp3)):
        url, author, title = info(sid)
        with open(mp3, "wb") as fh:
            fh.write(get(url))
        with open(meta_path, "w") as fh:
            json.dump({"author": author, "title": title}, fh)
        time.sleep(3)
    meta = json.load(open(meta_path))
    return mp3, meta["author"], meta["title"]


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
    t = html.unescape(re.sub(r"^Freesound\s*-\s*", "", t))
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
    only = set(a for a in sys.argv[1:] if not a.startswith("--"))
    redo = "--all" in sys.argv
    credits = []
    if True:
        for item, (sid, secs, desc) in SOUNDS.items():
            src, author, title = cached(sid)
            credits.append(f"| {item} | [{title}](https://freesound.org/s/{sid}/) by {author} | {desc} |")
            dest = os.path.join(OUT, f"{item}.mp3")
            if os.path.exists(dest) and not redo and item not in only:
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
