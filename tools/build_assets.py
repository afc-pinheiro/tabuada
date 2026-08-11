#!/usr/bin/env python3
"""Gera os sprites do jogo a partir do Universal LPC Spritesheet Character Generator.

Baixa apenas as folhas que interessam, recorta as linhas de cada pose (ver POSES)
e aplica troca de paleta para gerar as variacoes de cor do catalogo.

Saida:
  public/sprites/<categoria>/<item>__<cor>.png          parado, de frente (2 quadros)
  public/sprites/<categoria>/<item>__<cor>--walk.png    andando p/ direita (9 quadros)
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

# Poses geradas. Ordem das linhas LPC: 0=norte 1=oeste 2=sul 3=leste.
# `idle` olha para a frente (telas de vestir); `walk` anda para a direita (cena do quiz).
POSES = {
    "idle": {"sheet": "idle", "row": 2, "frames": 2, "suffix": ""},
    "walk": {"sheet": "walk", "row": 3, "frames": 9, "suffix": "--walk"},
}

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
# As pecas ja coloridas no repo LPC usam um conjunto proprio de nomes de cor.
DRESS_COLORS = ["pink", "sky", "lavender", "yellow", "green", "red", "purple", "white", "teal", "rose"]
JEWEL_COLORS = ["gold", "silver", "bronze", "copper", "brass", "ceramic"]
GEM_COLORS = ["red", "blue", "green", "purple", "yellow", "orange"]

# ---------------------------------------------------------------------------
# Catalogo. `src` e o caminho dentro de spritesheets/ (sem o nome da folha);
# uma lista de caminhos e achatada numa camada so (brincos, que vem separados
# em esquerdo e direito).
# `colors` = lista de cores; se `precolored`, os arquivos ja existem coloridos
# em <src>/<pose>/<cor>.png e nao ha troca de paleta.
# `price` em estrelas; 0 = ja vem desbloqueado.
# ---------------------------------------------------------------------------
CATALOG_SPEC = {
    "body": [
        {"id": "corpo", "name": "Corpo", "src": "body/bodies/female", "material": "body",
         "colors": SKIN_TONES, "price": 0},
    ],
    "head": [
        {"id": "cabeca", "name": "Cabeca", "src": "head/heads/human/female", "material": "body",
         "colors": SKIN_TONES, "price": 0},
    ],
    "eyes": [
        {"id": "olhos", "name": "Olhos", "src": "eyes/human/adult/default", "precolored": True,
         "colors": ["brown", "blue", "green", "gray", "purple"], "price": 0},
    ],
    "hair": [
        {"id": "maria-chiquinha", "name": "Maria-chiquinha", "src": "hair/pigtails/adult", "price": 0},
        {"id": "franjinha", "name": "Franjinha", "src": "hair/pigtails_bangs/adult", "price": 25},
        {"id": "liso-longo", "name": "Liso longo", "src": "hair/long_straight/adult", "price": 25},
        {"id": "chanel", "name": "Chanel", "src": "hair/bob/adult", "price": 30},
        {"id": "chanel-lado", "name": "Chanel de lado", "src": "hair/bob_side_part/adult", "price": 35},
        {"id": "cacheado", "name": "Cacheado", "src": "hair/curly_long/adult", "price": 40},
        {"id": "cachinhos", "name": "Cachinhos", "src": "hair/curly_short/adult", "price": 35},
        {"id": "black-power", "name": "Black power", "src": "hair/afro/adult", "price": 45},
        {"id": "jubinha", "name": "Jubinha", "src": "hair/jewfro/adult", "price": 40},
        {"id": "meio-preso", "name": "Meio preso", "src": "hair/half_up/adult", "price": 45},
        {"id": "coque", "name": "Coque", "src": "hair/bangs_bun/adult", "price": 50},
        {"id": "coque-alto", "name": "Coque alto", "src": "hair/extensions/ties/high_bun/adult", "price": 55},
        {"id": "estrela-pop", "name": "Estrela pop", "src": "hair/idol/adult", "price": 70},
        {"id": "curtinho", "name": "Curtinho", "src": "hair/pixie/adult", "price": 30},
        {"id": "trancinhas", "name": "Trancinhas", "src": "hair/twists_straight/adult", "price": 60},
        {"id": "cornrows", "name": "Cornrows", "src": "hair/cornrows/adult", "price": 60},
        {"id": "dreads", "name": "Dreads", "src": "hair/dreadlocks_long/adult", "price": 65},
        {"id": "bem-longo", "name": "Bem longo", "src": "hair/long/adult", "price": 45},
        {"id": "ondulado", "name": "Ondulado", "src": "hair/long_messy/adult", "price": 50},
        {"id": "franja-longa", "name": "Franja longa", "src": "hair/bangslong/adult", "price": 35},
        {"id": "joaozinho", "name": "Joaozinho", "src": "hair/page/adult", "price": 30},
        {"id": "repartido", "name": "Repartido", "src": "hair/parted_side_bangs/adult", "price": 35},
        {"id": "baguncado", "name": "Bagunçado", "src": "hair/messy1/adult", "price": 30},
        {"id": "espetado", "name": "Espetado", "src": "hair/spiked/adult", "price": 40},
    ],
    "torso": [
        {"id": "blusa", "name": "Blusinha", "src": "torso/clothes/longsleeve/longsleeve/female", "price": 0},
        {"id": "camiseta", "name": "Camiseta", "src": "torso/clothes/shortsleeve/shortsleeve/female", "price": 20},
        {"id": "tshirt", "name": "T-shirt", "src": "torso/clothes/shortsleeve/tshirt/female", "price": 25},
        {"id": "gola-v", "name": "Gola V", "src": "torso/clothes/shortsleeve/tshirt_vneck/female", "price": 30},
        {"id": "gola-canoa", "name": "Gola canoa", "src": "torso/clothes/longsleeve/scoop/female", "price": 30},
        {"id": "regata", "name": "Regata", "src": "torso/clothes/sleeveless/sleeveless2/female", "price": 25},
        {"id": "casaquinho", "name": "Casaquinho", "src": "torso/clothes/longsleeve/longsleeve2_cardigan/female", "price": 45},
        {"id": "cardiga-curto", "name": "Cardiga curto", "src": "torso/clothes/shortsleeve/shortsleeve_cardigan/female", "price": 40},
        {"id": "polo", "name": "Polo", "src": "torso/clothes/longsleeve/longsleeve2_polo/female", "price": 40},
        {"id": "moletom", "name": "Moletom", "src": "torso/clothes/longsleeve/longsleeve2/female", "price": 40},
        {"id": "botoes", "name": "De botao", "src": "torso/clothes/longsleeve/longsleeve2_buttoned/female", "price": 50},
        {"id": "punho", "name": "Punho dobrado", "src": "torso/clothes/longsleeve/longsleeves_cuffed/female", "price": 45},
        {"id": "macacao", "name": "Macacao", "src": "torso/aprons/overalls/female", "price": 65},
        {"id": "suspensorio", "name": "Suspensorio", "src": "torso/aprons/suspenders/female", "price": 55},
        {"id": "maio", "name": "Maio", "src": "dress/bodice/female", "precolored": True,
         "colors": DRESS_COLORS, "price": 60},
    ],
    "dress": [
        {"id": "vestido", "name": "Vestido", "src": "dress/slit/female", "precolored": True,
         "colors": DRESS_COLORS, "price": 80},
        {"id": "vestido-faixa", "name": "Vestido com faixa", "src": "dress/sash/female", "precolored": True,
         "colors": DRESS_COLORS, "price": 95},
        {"id": "kimono", "name": "Kimono", "src": "dress/kimono/normal/universal/female", "precolored": True,
         "colors": DRESS_COLORS, "price": 120},
        {"id": "kimono-luxo", "name": "Kimono de gala", "src": "dress/kimono/normal/trim/universal/female",
         "precolored": True, "colors": DRESS_COLORS, "price": 150},
        {"id": "kimono-aberto", "name": "Kimono aberto", "src": "dress/kimono/split/universal/female",
         "precolored": True, "colors": DRESS_COLORS, "price": 135},
    ],
    "legs": [
        {"id": "saia", "name": "Saia", "src": "legs/skirts/plain/thin", "price": 0},
        {"id": "saia-longa", "name": "Saia longa", "src": "legs/skirts/straight/thin", "price": 25},
        {"id": "saia-princesa", "name": "Saia princesa", "src": "legs/skirts/belle/thin", "price": 60},
        {"id": "saia-babado", "name": "Saia de babado", "src": "legs/skirts/overskirt/thin", "price": 50},
        {"id": "saia-fenda", "name": "Saia com fenda", "src": "legs/skirts/slit/thin", "price": 45},
        {"id": "legging", "name": "Legging", "src": "legs/leggings/thin", "price": 20},
        {"id": "meia-calca", "name": "Meia-calca", "src": "legs/leggings2/thin", "price": 30},
        {"id": "calca", "name": "Calca", "src": "legs/pants2/thin", "price": 30},
        {"id": "jeans", "name": "Jeans", "src": "legs/pants/thin", "price": 35},
        {"id": "calca-social", "name": "Calca social", "src": "legs/formal/thin", "price": 40},
        {"id": "calca-listrada", "name": "Calca listrada", "src": "legs/formal_striped/thin", "price": 45},
        {"id": "short", "name": "Short", "src": "legs/shorts/shorts/thin", "price": 25},
        {"id": "shortinho", "name": "Shortinho", "src": "legs/shorts/short_shorts/thin", "price": 25},
        {"id": "pantalona", "name": "Pantalona", "src": "legs/pantaloons/thin", "price": 40},
    ],
    "feet": [
        {"id": "sapatilha", "name": "Sapatilha", "src": "feet/shoes/basic/thin", "price": 0},
        {"id": "tenis", "name": "Tenis", "src": "feet/shoes/revised/thin", "price": 20},
        {"id": "sapato-boneca", "name": "Sapato boneca", "src": "feet/shoes/sara/thin", "price": 30},
        {"id": "sapatilha-laco", "name": "Sapatilha de laco", "src": "feet/shoes/ghillies/thin", "price": 35},
        {"id": "pantufa", "name": "Pantufa", "src": "feet/slippers/thin", "price": 25},
        {"id": "bota", "name": "Botinha", "src": "feet/boots/basic/thin", "price": 45},
        {"id": "bota-dobrada", "name": "Bota dobrada", "src": "feet/boots/fold/thin", "price": 50},
        {"id": "bota-cano-alto", "name": "Bota de cano alto", "src": "feet/boots/rimmed/thin", "price": 55},
        {"id": "sandalia", "name": "Sandalia", "src": "feet/sandals/thin", "price": 25},
        {"id": "meia-alta", "name": "Meia alta", "src": "feet/socks/high/thin", "price": 20},
        {"id": "meia-curta", "name": "Meia curta", "src": "feet/socks/ankle/thin", "price": 20},
    ],
    "hat": [
        {"id": "tiara", "name": "Tiara", "src": "hat/headband/thick/adult", "price": 25},
        {"id": "lacinho", "name": "Lacinho", "src": "hat/headband/hairtie/adult", "price": 25},
        {"id": "faixa", "name": "Faixa", "src": "hat/headband/tied/adult", "price": 25},
        {"id": "lenco", "name": "Lencinho", "src": "hat/cloth/bandana/adult", "price": 35},
        {"id": "lenco-torto", "name": "Lenco torto", "src": "hat/cloth/bandana2/adult", "price": 35},
        {"id": "capuz", "name": "Capuz", "src": "hat/cloth/hood/adult", "price": 50},
        {"id": "chapeu", "name": "Chapeuzinho", "src": "hat/formal/bowler/adult", "price": 60},
        {"id": "cartola", "name": "Cartola", "src": "hat/formal/tophat/adult", "price": 75},
        {"id": "chapeu-bruxa", "name": "Chapeu de bruxa", "src": "hat/magic/wizard/base/adult", "price": 90},
        {"id": "chapeu-estrelas", "name": "Chapeu de estrelas", "src": "hat/magic/celestial/adult", "price": 110},
        {"id": "chapeu-pirata", "name": "Chapeu de pirata", "src": "hat/pirate/tricorne/basic/adult", "price": 85},
        {"id": "chapeu-pena", "name": "Chapeu de pena", "src": "hat/pirate/bonnie/feather/adult", "price": 80},
        {"id": "gorro-natal", "name": "Gorro de Natal", "src": "hat/holiday/santa/adult", "price": 70},
        {"id": "gorro-elfo", "name": "Gorro de elfo", "src": "hat/holiday/elf/adult", "price": 70},
        {"id": "coroa", "name": "Coroa", "src": "hat/formal/crown/adult", "material": "metal",
         "precolored": True, "colors": ["gold", "silver", "crown_red", "purple"], "price": 150},
        {"id": "tiara-princesa", "name": "Tiara de princesa", "src": "hat/formal/tiara/adult", "material": "metal",
         "precolored": True, "colors": ["gold", "silver", "purple", "pink", "sky"], "price": 130},
    ],
    "neck": [
        {"id": "colar", "name": "Colar", "src": "neck/necklace/simple/female", "precolored": True,
         "colors": JEWEL_COLORS, "price": 40},
        {"id": "colar-contas", "name": "Colar de contas", "src": "neck/necklace/beaded_small/female",
         "precolored": True, "colors": JEWEL_COLORS, "price": 45},
        {"id": "corrente", "name": "Correntinha", "src": "neck/necklace/chain/female", "precolored": True,
         "colors": JEWEL_COLORS, "price": 40},
        {"id": "pingente-estrela", "name": "Pingente de estrela", "src": "neck/charm/star/female",
         "precolored": True, "colors": JEWEL_COLORS, "price": 60},
        {"id": "pingente-anel", "name": "Pingente de anel", "src": "neck/charm/ring/female",
         "precolored": True, "colors": JEWEL_COLORS, "price": 55},
        {"id": "pedra", "name": "Pedra preciosa", "src": "neck/gem/round/female", "precolored": True,
         "colors": GEM_COLORS, "price": 90},
        {"id": "gota", "name": "Gota preciosa", "src": "neck/gem/pear/female", "precolored": True,
         "colors": GEM_COLORS, "price": 95},
        {"id": "gravatinha", "name": "Gravatinha", "src": "neck/tie/bowtie/adult", "price": 35},
    ],
    "face": [
        {"id": "oculos", "name": "Oculos", "src": "facial/glasses/glasses/adult", "material": "metal", "price": 45},
        {"id": "oculos-redondo", "name": "Oculos redondo", "src": "facial/glasses/round/adult",
         "material": "metal", "price": 45},
        {"id": "oculos-nerd", "name": "Oculos nerd", "src": "facial/glasses/nerd/adult",
         "material": "metal", "price": 50},
        {"id": "oculos-sol", "name": "Oculos de sol", "src": "facial/glasses/sunglasses/adult",
         "material": "metal", "price": 60},
        {"id": "oculos-escuro", "name": "Oculos escuro", "src": "facial/glasses/shades/adult",
         "material": "metal", "price": 60},
        {"id": "brinco", "name": "Brinquinho", "material": "metal", "price": 40,
         "src": ["facial/earrings/simple/left/adult", "facial/earrings/simple/right/adult"]},
    ],
    "arms": [
        {"id": "luvas", "name": "Luvas", "src": "arms/hands/gloves/thin", "price": 35},
        {"id": "punho-renda", "name": "Punho de renda", "src": "arms/wrists/lace/thin", "price": 40},
        {"id": "pulseira", "name": "Pulseira", "src": "arms/wrists/cuffs/thin", "price": 35},
        {"id": "anelzinho", "name": "Anelzinho", "src": "arms/hands/ring/stud/thin",
         "material": "metal", "colors": JEWEL_COLORS, "price": 50},
    ],
}

# z-index de desenho por categoria (menor = mais ao fundo). Os oculos ficam
# acima do cabelo de proposito: com franja, ficariam escondidos.
CATEGORY_Z = {"body": 10, "head": 20, "eyes": 25, "legs": 30, "feet": 35, "torso": 40,
              "dress": 45, "neck": 50, "arms": 55, "hair": 60, "face": 65, "hat": 70}
DEFAULT_MATERIAL = {"body": "body", "head": "body", "hair": "hair", "torso": "cloth",
                    "legs": "cloth", "feet": "cloth", "hat": "cloth", "dress": "cloth",
                    "neck": "metal", "arms": "cloth", "face": "metal"}
DEFAULT_COLORS = {"hair": HAIR_COLORS, "torso": CLOTH_COLORS, "legs": CLOTH_COLORS,
                  "feet": CLOTH_COLORS, "hat": CLOTH_COLORS, "dress": DRESS_COLORS,
                  "neck": JEWEL_COLORS, "arms": CLOTH_COLORS, "face": JEWEL_COLORS}


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


def crop_pose(sheet: Image.Image, pose: dict) -> Image.Image:
    """Recorta a faixa de quadros de uma pose (uma linha da folha LPC)."""
    width = min(pose["frames"] * FRAME, sheet.width)
    top = pose["row"] * FRAME
    return sheet.crop((0, top, width, top + FRAME)).convert("RGBA")


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


# Um vestido faz sumir as camadas de tronco e pernas, entao precisa cobrir as duas.
# Varias folhas do repo LPC sao sobreposicoes (o "bodice" e um maio, "sleeves" sao so
# as mangas) e passariam batido, deixando a personagem sem roupa da cintura pra baixo.
DRESS_MIN_BOTTOM = 56  # em pixels do quadro de 64; a saia longa vai ate 62


def check_dress_coverage(item_id: str, strip: Image.Image) -> None:
    box = strip.crop((0, 0, FRAME, FRAME)).getbbox()
    if box and box[3] < DRESS_MIN_BOTTOM:
        raise ValueError(
            f"vestido '{item_id}' termina em y={box[3]}, acima de {DRESS_MIN_BOTTOM}: "
            "e uma sobreposicao, nao um vestido inteiro — mova para outra categoria"
        )


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

        # Uma peca pode vir de mais de uma folha (brinco esquerdo + direito);
        # elas viram uma camada so.
        sources = item["src"] if isinstance(item["src"], list) else [item["src"]]

        def render(pose: dict, color: str) -> Image.Image | None:
            """Recorta, recolore e junta as folhas de uma pose."""
            sheet = pose["sheet"]
            strip: Image.Image | None = None
            for src in sources:
                path = f"spritesheets/{src}/{sheet}/{color}.png" if precolored \
                    else f"spritesheets/{src}/{sheet}.png"
                part = crop_pose(Image.open(_bytes_io(fetch(path))), pose)
                if not precolored and color != base:
                    if color not in ramps:
                        raise KeyError(f"cor {color} nao existe na paleta {material}")
                    part = recolor(part, ramps[base], ramps[color])
                if strip is None:
                    strip = part
                else:
                    strip.alpha_composite(part)
            return None if strip is None or is_blank(strip) else strip

        variants = []
        for color in colors:
            try:
                frames = {name: render(pose, color) for name, pose in POSES.items()}
            except Exception as exc:  # noqa: BLE001
                print(f"  ! falhou {sources[0]} / {color}: {exc}", file=sys.stderr)
                continue

            # Sem a pose andando a peca sumiria no meio da fase — pior que nao existir.
            faltando = [name for name, strip in frames.items() if strip is None]
            if faltando:
                print(f"  ! {sources[0]} / {color}: sem {', '.join(faltando)}", file=sys.stderr)
                continue

            if category == "dress":
                check_dress_coverage(item["id"], frames["idle"])

            variant = {"color": color, "label": COLOR_LABELS.get(color, color)}
            for name, strip in frames.items():
                if strip is None:
                    continue
                filename = f"{item['id']}__{color}{POSES[name]['suffix']}.png"
                target = OUT_SPRITES / category / filename
                target.parent.mkdir(parents=True, exist_ok=True)
                strip.save(target, optimize=True)
                variant["file" if name == "idle" else name] = f"sprites/{category}/{filename}"

            variant["swatch"] = f"#{''.join(f'{c:02x}' for c in hex_to_rgb(ramps[color][4]))}" \
                if not precolored and color in ramps else dominant_color(frames["idle"])
            variants.append(variant)

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
    OUT_CATALOG.write_text(json.dumps({"z": CATEGORY_Z, "frames": {n: p["frames"] for n, p in POSES.items()}, "categories": catalog},
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
            srcs = spec["src"] if isinstance(spec["src"], list) else [spec["src"]]
            origem = ", ".join(f"`spritesheets/{s}`" for s in srcs)
            lines.append(f"- `{entry['id']}` ({entry['name']}) — {origem}")
        lines.append("")
    (ROOT / "CREDITS.md").write_text("\n".join(lines))


if __name__ == "__main__":
    os.makedirs(CACHE, exist_ok=True)
    build()
