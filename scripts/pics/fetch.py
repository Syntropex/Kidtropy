#!/usr/bin/env python3
"""
Give every emoji used in the code a Microsoft Fluent Emoji 3D picture (MIT).

    npm run pics

Scans src/ for emoji, downloads the matching Fluent 3D PNGs (sparse git clone,
cached in ~/.cache/kidtropy), converts them to small WebP files in public/pics/,
and writes src/data/pics.json (emoji -> file name). Emoji without a Fluent
picture keep using the device's emoji font.
Needs: git, python3 with Pillow.
"""
import glob, json, os, re, subprocess, sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CACHE = os.path.expanduser(os.environ.get("KIDTROPY_CACHE", "~/.cache/kidtropy"))
REPO = os.path.join(CACHE, "fluentui-emoji")
OUT = os.path.join(ROOT, "public", "pics")
MAP = os.path.join(ROOT, "src", "data", "pics.json")
SIZE = 256

EMOJI = re.compile(
    "(?:[\U0001F1E6-\U0001F1FF]{2})|"
    "(?:[\U0001F300-\U0001FAFF☀-➿⬀-⯿←-⇿⌀-⏿Ⓜ〰〽©®]"
    "️?(?:‍[\U0001F300-\U0001FAFF☀-➿♀♂⚕⚖✈❤]️?)*)"
)


def norm(g):
    return g.replace("️", "")


def slug(folder):
    return re.sub(r"[^a-z0-9]+", "-", os.path.basename(folder).lower()).strip("-")


def git(*args):
    subprocess.run(["git", *args], cwd=REPO, check=True, stdout=subprocess.DEVNULL)


def main():
    used = set()
    for path in glob.glob(os.path.join(ROOT, "src", "**", "*.ts"), recursive=True):
        used.update(norm(m) for m in EMOJI.findall(open(path, encoding="utf-8").read()))

    os.makedirs(CACHE, exist_ok=True)
    if not os.path.isdir(REPO):
        subprocess.run(["git", "clone", "-q", "--depth", "1", "--filter=blob:none", "--no-checkout",
                        "https://github.com/microsoft/fluentui-emoji.git", REPO], check=True)
        git("sparse-checkout", "init", "--no-cone")
    git("sparse-checkout", "set", "--no-cone", "/assets/*/metadata.json", "/LICENSE")
    git("checkout", "-q", "HEAD")

    by_glyph = {}
    for m in glob.glob(os.path.join(REPO, "assets", "*", "metadata.json")):
        by_glyph[norm(json.load(open(m, encoding="utf-8"))["glyph"])] = os.path.dirname(m)
    found = {g: by_glyph[g] for g in used if g in by_glyph}

    pats = ["/assets/*/metadata.json", "/LICENSE"]
    for folder in found.values():
        rel = "/" + os.path.relpath(folder, REPO).replace(os.sep, "/")
        pats += [rel + "/3D/*", rel + "/Default/3D/*"]
    git("sparse-checkout", "set", "--no-cone", *pats)
    git("checkout", "-q", "HEAD")

    os.makedirs(OUT, exist_ok=True)
    mapping, keep = {}, set()
    for g, folder in sorted(found.items()):
        files = glob.glob(os.path.join(folder, "3D", "*_3d.png")) or glob.glob(os.path.join(folder, "Default", "3D", "*_3d_default.png"))
        if not files:
            continue
        name = slug(folder)
        dest = os.path.join(OUT, name + ".webp")
        if not os.path.exists(dest):
            im = Image.open(files[0]).convert("RGBA")
            if im.width > SIZE:
                im = im.resize((SIZE, SIZE), Image.LANCZOS)
            im.save(dest, "WEBP", quality=82, method=6)
        mapping[g] = name
        keep.add(name + ".webp")
    for f in os.listdir(OUT):
        if f.endswith(".webp") and f not in keep:
            os.remove(os.path.join(OUT, f))
    with open(MAP, "w", encoding="utf-8") as fh:
        json.dump(mapping, fh, ensure_ascii=False, indent=0, sort_keys=True)
        fh.write("\n")
    with open(os.path.join(REPO, "LICENSE"), encoding="utf-8") as src, open(os.path.join(OUT, "LICENSE-fluent-emoji.txt"), "w") as dst:
        dst.write(src.read())
    missing = sorted(used - set(found))
    print(f"{len(mapping)} pictures. No Fluent picture for: {' '.join(missing) or 'none'}")


if __name__ == "__main__":
    sys.exit(main())
