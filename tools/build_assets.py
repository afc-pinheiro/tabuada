#!/usr/bin/env python3
"""Gera os sprites do jogo a partir do Universal LPC Spritesheet Character Generator.

Baixa apenas as folhas `idle.png` que interessam, recorta a linha virada para a
frente (sul) e aplica troca de paleta para gerar as variacoes de cor do catalogo.

Saida:
  public/sprites/<categoria>/<item>__<cor>.png   (128x64 = 2 frames de 64x64)
  src/data/catalog.json                           (catalogo consumido pelo app)
  CREDITS.md                                      (creditos/licencas dos assets)

Uso:  python3 tools/build_assets.py
Requer: Pillow  (pip install pillow)
"""

from __future__ import annotations

import json
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

REPO = "LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator"
RAW = f"https://raw.githubusercontent.com/{REPO}/master"

ROOT = Path(__file__).resolve().parent.parent
OUT_SPRITES = ROOT / "public" / "sprites"
OUT_CATALOG = ROOT / "src" / "data" / "catalog.json"
CACHE = ROOT / ".asset-cache"

FRAME = 64
SOUTH_ROW = 2  # ordem das linhas LPC: 0=norte 1=oeste 2=sul 3=leste
FRAMES_KEPT = 2  # idle.png tem 2 quadros por direcao

# ---------------------------------------------------------------------------
# Paletas: cada item tem um "material"; a folha original vem pintada com a cor
# base daquele material e as demais cores sao geradas trocando a rampa.
# ---------------------------------------------------------------------------
MATERIALS = {
    "body": ("palette_definitions/body/body_ulpc.json", "light"),
    "hair": ("palette_definitions/hair/hair_ulpc.json", "orange"),
    "cloth": ("palette_definitions/cloth/cloth_ulpc.json", "white"),
    "metal": ("palette_definitions/metal/metal_ulpc.json", "steel"),
}

# Nomes em portugues para as cores expostas na loja.
COLOR_LABELS = {
    "light": "Clara", "amber": "Ambar", "olive": "Oliva", "taupe": "Morena",
    "bronze": "Bronze", "brown": "Castanha", "black": "Negra",
    "blonde": "Loiro", "carrot": "Ruivo", "redhead": "Acaju", "chestnut": "Castanho",
    "raven": "Preto", "platinum": "Platinado", "pink": "Rosa", "purple": "Roxo",
    "blue": "Azul", "green": "Verde", "sky": "Celeste", "lavender": "Lilas",
    "rose": "Rosinha", "yellow": "Amarelo", "red": "Vermelho", "teal": "Turquesa",
    "navy": "Marinho", "white": "Branco", "orange": "Laranja", "tan": "Bege",
    "forest": "Musgo", "maroon": "Vinho", "gray": "Cinza", "gold": "Dourado",
    "silver": "Prateado", "tiara_gold": "Dourada", "tiara_silver": "Prateada",
    "tiara_purple": "Lilas", "crown_red": "Rubi",
}

SKIN_TONES = ["light", "amber", "olive", "taupe", "bronze", "brown", "black"]
HAIR_COLORS = ["blonde", "carrot", "chestnut", "raven", "redhead", "platinum", "pink", "purple", "blue"]
CLOTH_COLORS = ["pink", "sky", "lavender", "yellow", "green", "red", "purple", "white", "teal", "navy"]

# ---------------------------------------------------------------------------
# Catalogo. `src` e o caminho dentro de spritesheets/ (sem /idle.png).
# `colors` = lista de cores; se `precolored`, os arquivos ja existem coloridos
# em <src>/idle/<cor>.png e nao ha troca de paleta.
# `price` em estrelas; 0 = ja vem desbloqueado.
# ---------------------------------------------------------------------------
CATALOG_SPEC = {
    "body": [
        {"id": "corpo", "name": "Corpo", "src": "body/bodies/female", "material": "body",
         "colors": SKIN_TONES, "z": 10, "price": 0},
    ],
    "head": [
        {"id": "cabeca", "name": "Cabeca", "src": "head/heads/human/female", "material": "body",
         "colors": SKIN_TONES, "z": 20, "price": 0},
    ],
    "eyes": [
        {"id": "olhos", "name": "Olhos", "src": "eyes/human/adult/default", "precolored": True,
         "colors": ["brown", "blue", "green", "gray", "purple"], "z": 25, "price": 0},
    ],
    "hair": [
        {"id": "maria-chiquinha", "name": "Maria-chiquinha", "src": "hair/pigtails/adult", "price": 0},
        {"id": "franjinha", "name": "Franjinha", "src": "hair/pigtails_bangs/adult", "price": 30},
        {"id": "liso-longo", "name": "Liso longo", "src": "hair/long_straight/adult", "price": 30},
        {"id": "chanel", "name": "Chanel", "src": "hair/bob/adult", "price": 40},
        {"id": "cacheado", "name": "Cacheado", "src": "hair/curly_long/adult", "price": 50},
        {"id": "black-power", "name": "Black power", "src": "hair/afro/adult", "price": 50},
        {"id": "meio-preso", "name": "Meio preso", "src": "hair/half_up/adult", "price": 60},
        {"id": "estrela-pop", "name": "Estrela pop", "src": "hair/idol/adult", "price": 80},
        {"id": "curtinho", "name": "Curtinho", "src": "hair/pixie/adult", "price": 40},
        {"id": "trancinhas", "name": "Trancinhas", "src": "hair/twists_straight/adult", "price": 70},
    ],
    "torso": [
        {"id": "blusa", "name": "Blusinha", "src": "torso/clothes/longsleeve/longsleeve/female", "price": 0},
        {"id": "camiseta", "name": "Camiseta", "src": "torso/clothes/shortsleeve/shortsleeve/female", "price": 25},
        {"id": "gola-canoa", "name": "Gola canoa", "src": "torso/clothes/longsleeve/scoop/female", "price": 35},
        {"id": "casaquinho", "name": "Casaquinho", "src": "torso/clothes/longsleeve/longsleeve2_cardigan/female", "price": 55},
        {"id": "polo", "name": "Polo", "src": "torso/clothes/longsleeve/longsleeve2_polo/female", "price": 45},
        {"id": "moletom", "name": "Moletom", "src": "torso/clothes/longsleeve/longsleeve2/female", "price": 45},
    ],
    "legs": [
        {"id": "saia", "name": "Saia", "src": "legs/skirts/plain/thin", "price": 0},
        {"id": "saia-longa", "name": "Saia longa", "src": "legs/skirts/straight/thin", "price": 30},
        {"id": "saia-princesa", "name": "Saia princesa", "src": "legs/skirts/belle/thin", "price": 70},
        {"id": "saia-babado", "name": "Saia de babado", "src": "legs/skirts/overskirt/thin", "price": 60},
        {"id": "legging", "name": "Legging", "src": "legs/leggings/thin", "price": 25},
        {"id": "calca", "name": "Calca", "src": "legs/pants2/thin", "price": 35},
        {"id": "calca-social", "name": "Calca social", "src": "legs/formal/thin", "price": 45},
    ],
    "feet": [
        {"id": "sapatilha", "name": "Sapatilha", "src": "feet/shoes/basic/thin", "price": 0},
        {"id": "tenis", "name": "Tenis", "src": "feet/shoes/revised/thin", "price": 25},
        {"id": "sapato-boneca", "name": "Sapato boneca", "src": "feet/shoes/sara/thin", "price": 35},
        {"id": "pantufa", "name": "Pantufa", "src": "feet/slippers/thin", "price": 30},
        {"id": "bota", "name": "Botinha", "src": "feet/boots/basic/thin", "price": 55},
        {"id": "sandalia", "name": "Sandalia", "src": "feet/sandals/thin", "price": 30},
    ],
    "hat": [
        {"id": "tiara", "name": "Tiara", "src": "hat/headband/thick/adult", "price": 30},
        {"id": "faixa", "name": "Faixa", "src": "hat/headband/tied/adult", "price": 30},
        {"id": "lenco", "name": "Lencinho", "src": "hat/cloth/bandana/adult", "price": 40},
        {"id": "capuz", "name": "Capuz", "src": "hat/cloth/hood/adult", "price": 60},
        {"id": "chapeu", "name": "Chapeuzinho", "src": "hat/formal/bowler/adult", "price": 70},
        {"id": "gorro-natal", "name": "Gorro de Natal", "src": "hat/holiday/santa/adult", "price": 90},
        {"id": "coroa", "name": "Coroa", "src": "hat/formal/crown/adult", "material": "metal",
         "precolored": True, "colors": ["gold", "silver", "crown_red", "purple"], "price": 150},
        {"id": "tiara-princesa", "name": "Tiara de princesa", "src": "hat/formal/tiara/adult", "material": "metal",
         "precolored": True, "colors": ["tiara_gold", "tiara_silver", "tiara_purple"], "price": 120},
    ],
}

# z-index de desenho por categoria (menor = mais ao fundo)
CATEGORY_Z = {"body": 10, "head": 20, "eyes": 25, "legs": 30, "feet": 35, "torso": 40, "hair": 60, "hat": 70}
DEFAULT_MATERIAL = {"body": "body", "head": "body", "hair": "hair", "torso": "cloth",
                    "legs": "cloth", "feet": "cloth", "hat": "cloth"}
DEFAULT_COLORS = {"hair": HAIR_COLORS, "torso": CLOTH_COLORS, "legs": CLOTH_COLORS,
                  "feet": CLOTH_COLORS, "hat": CLOTH_COLORS}


def fetch(path: str) -> bytes:
    """Baixa `path` do repo LPC com cache em disco."""
    cached = CACHE / path
    if cached.exists():
        return cached.read_bytes()
    url = f"{RAW}/{path}"
    with urllib.request.urlopen(url, timeout=60) as resp:
        data = resp.read()
    cached.parent.mkdir(parents=True, exist_ok=True)
    cached.write_bytes(data)
    return data


def load_palettes() -> dict[str, tuple[dict[str, list[str]], str]]:
    out = {}
    for material, (path, base) in MATERIALS.items():
        out[material] = (json.loads(fetch(path)), base)
    return out


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def crop_south(sheet: Image.Image) -> Image.Image:
    """Recorta os quadros da linha virada para a frente."""
    width = min(FRAMES_KEPT * FRAME, sheet.width)
    return sheet.crop((0, SOUTH_ROW * FRAME, width, (SOUTH_ROW + 1) * FRAME)).convert("RGBA")


def recolor(image: Image.Image, source: list[str], target: list[str]) -> Image.Image:
    """Troca a rampa de cores `source` pela rampa `target`, pixel a pixel."""
    mapping = {hex_to_rgb(s): hex_to_rgb(t) for s, t in zip(source, target)}
    out = image.copy()
    pixels = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            repl = mapping.get((r, g, b))
            if repl:
                pixels[x, y] = (*repl, a)
    return out


def is_blank(image: Image.Image) -> bool:
    return image.getbbox() is None


def dominant_color(image: Image.Image) -> str:
    """Cor mais frequente entre os pixels opacos — vira a bolinha da paleta na UI."""
    counts: dict[tuple[int, int, int], int] = {}
    for r, g, b, a in image.getdata():
        if a < 200:
            continue
        counts[(r, g, b)] = counts.get((r, g, b), 0) + 1
    if not counts:
        return "#888888"
    r, g, b = max(counts.items(), key=lambda kv: kv[1])[0]
    return f"#{r:02x}{g:02x}{b:02x}"


def build() -> None:
    palettes = load_palettes()
    catalog: dict[str, list[dict]] = {}
    credits: list[str] = []

    def prepare(category: str, item: dict) -> dict | None:
        material = item.get("material", DEFAULT_MATERIAL.get(category, "cloth"))
        colors = item.get("colors", DEFAULT_COLORS.get(category, CLOTH_COLORS))
        precolored = item.get("precolored", False)
        ramps, base = palettes[material]

        variants = []
        for color in colors:
            try:
                if precolored:
                    raw = fetch(f"spritesheets/{item['src']}/idle/{color}.png")
                    frame = crop_south(Image.open(_bytes_io(raw)))
                else:
                    raw = fetch(f"spritesheets/{item['src']}/idle.png")
                    frame = crop_south(Image.open(_bytes_io(raw)))
                    if color != base:
                        if color not in ramps:
                            print(f"  ! cor {color} nao existe na paleta {material}", file=sys.stderr)
                            continue
                        frame = recolor(frame, ramps[base], ramps[color])
            except Exception as exc:  # noqa: BLE001
                print(f"  ! falhou {item['src']} / {color}: {exc}", file=sys.stderr)
                continue

            if is_blank(frame):
                print(f"  ! quadro vazio {item['src']} / {color}", file=sys.stderr)
                continue

            target = OUT_SPRITES / category / f"{item['id']}__{color}.png"
            target.parent.mkdir(parents=True, exist_ok=True)
            frame.save(target, optimize=True)
            swatch = f"#{''.join(f'{c:02x}' for c in hex_to_rgb(ramps[color][4]))}" \
                if not precolored and color in ramps else dominant_color(frame)
            variants.append({"color": color, "label": COLOR_LABELS.get(color, color),
                             "swatch": swatch,
                             "file": f"sprites/{category}/{item['id']}__{color}.png"})

        if not variants:
            return None
        return {
            "id": item["id"],
            "name": item["name"],
            "price": item.get("price", 0),
            "z": item.get("z", CATEGORY_Z.get(category, 50)),
            "variants": variants,
        }

    for category, items in CATALOG_SPEC.items():
        print(f"== {category}")
        with ThreadPoolExecutor(8) as pool:
            built = list(pool.map(lambda it: prepare(category, it), items))
        catalog[category] = [b for b in built if b]
        for entry in catalog[category]:
            print(f"   {entry['id']}: {len(entry['variants'])} cores")

    OUT_CATALOG.parent.mkdir(parents=True, exist_ok=True)
    OUT_CATALOG.write_text(json.dumps({"z": CATEGORY_Z, "categories": catalog},
                                      ensure_ascii=False, indent=2) + "\n")

    total = sum(len(e["variants"]) for cat in catalog.values() for e in cat)
    print(f"\n{total} sprites gerados em {OUT_SPRITES}")
    _write_credits(catalog)


def _bytes_io(data: bytes):
    import io
    return io.BytesIO(data)


def _write_credits(catalog: dict[str, list[dict]]) -> None:
    lines = [
        "# Creditos dos assets",
        "",
        "Todos os sprites do personagem vem do **Universal LPC Spritesheet Character Generator**:",
        f"<https://github.com/{REPO}>",
        "",
        "Licencas: **CC-BY-SA 3.0** e **GPL 3.0** (conforme o projeto LPC).",
        "A lista completa de autores de cada peca esta em `CREDITS.csv` do repositorio LPC:",
        f"<https://github.com/{REPO}/blob/master/CREDITS.csv>",
        "",
        "## Pecas usadas neste jogo",
        "",
    ]
    for category, items in catalog.items():
        lines.append(f"### {category}")
        for entry in items:
            spec = next(i for i in CATALOG_SPEC[category] if i["id"] == entry["id"])
            lines.append(f"- `{entry['id']}` — `spritesheets/{spec['src']}`")
        lines.append("")
    (ROOT / "CREDITS.md").write_text("\n".join(lines))


if __name__ == "__main__":
    os.makedirs(CACHE, exist_ok=True)
    build()
