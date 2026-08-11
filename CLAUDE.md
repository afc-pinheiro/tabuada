# Tabuada Mágica

Jogo de tabuada com dress-up em pixel art, feito para uma criança. React + Vite + TS,
sem backend: todo o estado mora no `localStorage`.

**Produção:** https://tabuada.192.236.168.214.sslip.io
**Repo:** https://github.com/afc-pinheiro/tabuada

## Como o jogo funciona

Uma rodada = 10 perguntas de múltipla escolha. Cada acerto dá 3 ⭐, e a partir da 4ª
seguida vale +2 de bônus. Estrelas compram peças na lojinha; comprar já veste a peça.
Cada peça vem com todas as cores — a compra é por item, nunca por cor. Medalhas por
tabuada: 🥉 6+ acertos, 🥈 8+, 🥇 10.

## Personagem em camadas

O personagem é uma pilha de PNGs de 64×64 desenhados no mesmo quadro, ordenados por `z`:

```
body 10 → head 20 → eyes 25 → legs 30 → feet 35 → torso 40 → hair 60 → hat 70
```

Cada arquivo é `128x64`: dois quadros lado a lado, animados com `steps(2)` para o
personagem "respirar". Só existe a vista frontal (linha sul do spritesheet LPC).

**Cuidado:** `body` (corpo) e `head` (rosto) são categorias separadas de propósito —
`outfit` guarda um item por categoria, então juntar as duas faz uma sumir. A cor de pele
é sincronizada entre elas em `App.wear` via `SKIN_CATEGORIES`.

## Assets

`tools/build_assets.py` baixa as folhas do
[Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator)
(CC-BY-SA 3.0 / GPL 3.0), recorta o quadro frontal e gera as cores por troca de rampa de
paleta. O repositório LPC tem dois formatos: `<caminho>/idle.png` (uma cor só, recolorida
pela paleta do material) e `<caminho>/idle/<cor>.png` (já colorido). O script cobre os
dois — use `"precolored": True` no segundo caso.

Para acrescentar uma peça: entrada nova em `CATALOG_SPEC` + `npm run assets`. A saída
(`public/sprites/`, `src/data/catalog.json`, `CREDITS.md`) é versionada; o build do
Docker não roda Python.

## Deploy

`push` na `main` → GitHub Actions builda a imagem, publica em
`ghcr.io/afc-pinheiro/tabuada-web:latest` e chama o webhook do Coolify.

- Coolify: `https://coolify.acdev.com.br` (a porta 8000 do VPS está bloqueada no UFW —
  use sempre o domínio, não `http://192.236.168.214:8000`)
- App UUID: `xoxsq5xeo4xipaduki5snfuq`, projeto `tabuada` (`xeopf2epwrnfbsxjpo9pj3mc`)
- Domínio: sslip.io por enquanto. Para trocar por `tabuada.acdev.com.br`, criar o CNAME
  na Cloudflare e mudar o FQDN da aplicação no Coolify.

## Convenções

- Interface toda em português, texto curto e legível para criança.
- Código e comentários em português, sem acento em identificadores.
- Sem dependências além de React — os sons são WebAudio puro (`src/game/sfx.ts`).
