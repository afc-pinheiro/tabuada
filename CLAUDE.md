# Tabuada Mágica

Jogo de tabuada com dress-up em pixel art, feito para uma criança. React + Vite + TS,
sem backend: todo o estado mora no `localStorage`.

**Produção:** https://tabuada.192.236.168.214.sslip.io
**Repo:** https://github.com/afc-pinheiro/tabuada

## Como o jogo funciona

A home é um **mapa de fases**: uma trilha serpenteando pelas tabuadas de 1 a 10, cada
uma com um cenário próprio (campo/praia/floresta/neve/noite, ver `sceneFor`). O castelo
no fim é o desafio misturado e só abre depois da primeira medalha — antes disso ele
sortearia contas que a criança ainda não praticou.

Uma fase = 10 perguntas de múltipla escolha. A tela mostra a **trilha**: a personagem
começa na esquerda e **caminha um passo a cada acerto** até o presente no fim do
caminho. Cada acerto dá 3 ⭐, e a partir da 4ª seguida vale +2 de bônus. Estrelas
compram peças na lojinha; comprar já veste a peça. Cada peça vem com todas as cores — a
compra é por item, nunca por cor. Medalhas: 🥉 6+ acertos, 🥈 8+, 🥇 10.

## Personagem em camadas

O personagem é uma pilha de PNGs de 64×64 desenhados no mesmo quadro, ordenados por `z`:

```
body 10 → head 20 → eyes 25 → legs 30 → feet 35 → torso 40 → hair 60 → hat 70
```

Existem duas poses, definidas em `POSES` no script de assets e refletidas em
`catalog.frames`:

| Pose | Arquivo | Tamanho | Uso |
| --- | --- | --- | --- |
| `idle` | `<item>__<cor>.png` | 128×64 (2 quadros) | de frente, telas de vestir |
| `walk` | `<item>__<cor>--walk.png` | 576×64 (9 quadros) | de perfil, trilha da fase |

A animação é CSS puro: `.character__layer--idle` / `--walk` trocam o `background-size` e
o `steps()` juntos. Se acrescentar uma pose, os três lugares precisam casar — script,
`Pose` em `types.ts` e o CSS.

Nem toda peça do LPC tem folha de caminhada; `spriteUrl` devolve `undefined` nesse caso
e a camada simplesmente não entra na pose `walk`.

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

## Armadilhas já pagas

- `save.progress` é indexado por tabuada **e** pela chave `'mix'`. Qualquer código que
  transforme essas chaves em número precisa filtrar as não numéricas: um `NaN` vazando
  para `makeQuestion` já congelou a aba inteira num loop infinito.
- As perguntas da rodada são sorteadas **uma vez**, na montagem do `Quiz`. Não voltar a
  derivá-las de props que mudam de identidade a cada render.
- `npm test` cobre exatamente esses casos. Rodar antes de mexer em `src/game/quiz.ts`.

## Convenções

- Interface toda em português, texto curto e legível para criança.
- Código e comentários em português, sem acento em identificadores.
- Sem dependências além de React — os sons são WebAudio puro (`src/game/sfx.ts`).
