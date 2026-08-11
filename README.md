# Tabuada Mágica

Jogo de tabuada com personagem para vestir. Um mapa de fases leva pelas tabuadas de 1 a
10; em cada fase a personagem caminha por um cenário, um passo a cada acerto, até o
presente no fim da trilha. Quem trava numa conta pede ajuda e vê a multiplicação virar
grupos para contar ("3 grupos de 9"), sem receber a resposta pronta. Acertar rende estrelas, estrelas compram roupinhas na lojinha
e o guarda-roupa monta o visual. Tudo em pixel art e tudo salvo no `localStorage` do
próprio navegador (sem login, sem servidor, sem dados saindo do aparelho).

## Rodar local

```bash
npm install
npm run dev
npm test    # gerador de perguntas: cobre as entradas que ja travaram o jogo
```

## Assets

Os sprites vêm do [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator)
(CC-BY-SA 3.0 / GPL 3.0). O script `tools/build_assets.py` baixa as folhas necessárias,
recorta o quadro frontal e gera as variações de cor por troca de paleta:

```bash
npm run assets
```

Ele escreve `public/sprites/`, `src/data/catalog.json` e `CREDITS.md`. Cada peça sai em
duas poses: parada de frente (2 quadros) e andando de perfil (9 quadros). Só precisa
rodar de novo quando o catálogo em `CATALOG_SPEC` mudar — a saída fica versionada.

São 12 categorias (cabelo, blusa, vestido, saia/calça, sapato, cabeça, colar, óculos,
mãos, além de pele, rosto e olhos) e mais de 100 peças, cada uma em várias cores.

## Deploy

`git push` na `main` → GitHub Actions builda a imagem Docker (Vite + nginx), publica em
`ghcr.io/afc-pinheiro/tabuada-web:latest` e chama o webhook de deploy do Coolify.

Secrets necessários no repositório (`Settings → Secrets → Actions`):

| Secret | Valor |
| --- | --- |
| `COOLIFY_URL` | `https://coolify.acdev.com.br` |
| `COOLIFY_TOKEN` | token de API do Coolify com permissão de `deploy` |
| `COOLIFY_APP_UUID` | UUID da aplicação no Coolify |

## Estrutura

```
src/game/       regras: catálogo, save no localStorage, geração das perguntas, sons
src/components/ Home + LevelMap (mapa de fases), Quiz + Trail (cena da fase),
                Shop, Closet e o personagem em camadas
public/sprites/ PNGs gerados, nas poses parada e andando
tools/          script de preparação dos assets
tests/          teste do gerador de perguntas
```

O personagem é uma pilha de camadas PNG posicionadas no mesmo quadro de 64×64, ordenadas
por `z` (corpo → rosto → olhos → pernas → sapatos → blusa → cabelo → cabeça). Adicionar
uma peça nova é acrescentar uma entrada em `CATALOG_SPEC` e rodar `npm run assets`.
