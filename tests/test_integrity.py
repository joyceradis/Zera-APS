"""Local quality gates. No network, patient data or clinical decisions."""
import json
import re
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
def read(path):
    return (ROOT / path).read_text(encoding="utf-8")

base = json.loads(read("data/regras-aps-2026.json"))
embedded = read("data/regras.js").split("window.ZERA_APS_DATA = ", 1)[1].strip().removesuffix(";")
assert base == json.loads(embedded), "JSON and browser data diverge"
ids = [r["id"] for c in base["cards"] for r in c["rules"]]
assert ids and len(set(ids)) == len(ids), "Duplicate rule IDs"
print(f"OK: {len(ids)} unique rules, identical JSON and JS")

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.links = set(), []
        self.feed(path.read_text(encoding="utf-8"))
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            assert attrs["id"] not in self.ids, f"Duplicate ID: {attrs['id']}"
            self.ids.add(attrs["id"])
        for k in ("href", "src"):
            if attrs.get(k):
                self.links.append(attrs[k])
    handle_startendtag = handle_starttag

for filename in ("index.html", "consulta.html", "novidades-5-6.html"):
    page = ROOT / filename
    for link in Page(page).links:
        url = urlsplit(link)
        if url.scheme or url.netloc:
            continue
        target = (page.parent / unquote(url.path)).resolve() if url.path else page
        assert target.is_relative_to(ROOT), f"Link outside project: {link}"
        if target.is_dir():
            target = target / "index.html"
        assert target.is_file(), f"{filename}: missing {link}"
        if url.fragment and target.suffix == ".html":
            assert unquote(url.fragment) in Page(target).ids, f"{filename}: missing anchor {link}"
print("OK: internal links and HTML IDs")

def luminance(hexcolor):
    rgb = [int(hexcolor[i:i+2], 16) / 255 for i in (0, 2, 4)]
    rgb = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
    return sum(v*w for v,w in zip(rgb, (.2126,.7152,.0722)))

def contrast(a, b):
    l1,l2 = sorted((luminance(a), luminance(b)))
    return (l2+.05)/(l1+.05)

css = read("theme.css")
palettes = [
    dict(re.findall(r"--([\w-]+):#([\da-fA-F]{6})\b", block))
    for block in re.findall(r"\{([^{}]+)\}", css)
    if "--bg:" in block
]
assert len(palettes) >= 2
for i, palette in enumerate(palettes, 1):
    text_min = min(contrast(palette[f],palette[b])
                   for f in ("text","muted","blue","brand")
                   for b in ("bg","surface","field","heading","hover"))
    cta = contrast(palette["cta-bg"], palette["cta-text"])
    border = contrast(palette["field-border"],palette["field"])
    assert min(text_min, cta) >= 4.5, f"Palette {i}: text contrast below AA"
    assert border >= 3, f"Palette {i}: field border contrast below 3:1"
    print(f"OK: palette {i}: text {text_min:.2f}:1, CTA {cta:.2f}:1, field border {border:.2f}:1")
