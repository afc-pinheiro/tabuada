# Tabuada Mágica

Jogo de tabuada com personagem para vestir. Acerta as contas → ganha estrelas → compra
roupinhas na lojinha → monta o visual no guarda-roupa. Tudo em pixel art, tudo salvo no
`localStorage` do próprio navegador (sem login, sem servidor, sem dados saindo do aparelho).

## Rodar local

```bash
npm install
npm run dev
```

## Assets

Os sprites vêm do [Universal LPC Spritesheet Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator)
(CC-BY-SA 3.0 / GPL 3.0). O script `tools/build_assets.py` baixa as folhas necessárias,
recorta o quadro frontal e gera as variações de cor por troca de paleta:

```bash
npm run assets
```

Ele escreve `public/sprites/`, `src/data/catalog.json` e `CREDITS.md`. Só precisa rodar
de novo quando o catálogo em `CATALOG_SPEC` mudar — a saída fica versionada no repo.

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
src/game/      regras: catálogo, save no localStorage, geração das perguntas, sons
src/components/ telas: Home, Quiz, Shop, Closet e o personagem em camadas
public/sprites/ PNGs gerados (128x64 = 2 quadros de 64x64, virados para a frente)
tools/         script de preparação dos assets
```

O personagem é uma pilha de camadas PNG posicionadas no mesmo quadro de 64×64, ordenadas
por `z` (corpo → rosto → olhos → pernas → sapatos → blusa → cabelo → cabeça). Adicionar
uma peça nova é acrescentar uma entrada em `CATALOG_SPEC` e rodar `npm run assets`.
