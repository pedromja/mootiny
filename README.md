# Mootiny

Plataformas cómico 2D (PWA, PT-PT): a Mimosa, uma Holstein de bandana vermelha, acordou depois de comer um cogumelo da consciência e lidera a revolta das vacas.

**Jogar:** https://pedromja.github.io/mootiny/

- Mundo 1 · Ilha Verde — salto duplo, latas de leite com pernas, Mana Estrela.
- Mundo 2 · A Quinta — tratores, cercas elétricas, agricultores, arranque e o chefe Super Ordenhadeira 3000.
- Telemóvel: botões em marca de água em ecrã inteiro. Teclado: A/D andar, Espaço saltar, Shift/K arranque.
- Progresso gravado no aparelho (localStorage), sem contas. [Política de privacidade](https://pedromja.github.io/mootiny/privacidade/)

Arte (sprites 2x, fundos com paralaxe, intro animada de 6 painéis), efeitos sonoros (packs Clássico e Mootiny) e música são originais, gerados por código no projeto irmão `mootiny-art`; `node scripts/build-assets.mjs` (ART=../mootiny-art) copia/converte para `public/assets/` (sem .wav nem refs/). Fonte: Luckiest Guy (Apache 2.0, ver `public/assets/fonts/`). Phaser 3 + Vite.

```bash
npm install
npm run dev        # http://127.0.0.1:5173/mootiny/
npm run build      # dist/ (base /mootiny/; BASE_PATH=/ para a raiz)
npm run preview    # http://127.0.0.1:4173/mootiny/
npm test           # Chrome headless 390x844 + 1280x800 (com o preview ligado)
```

Publicação: o conteúdo de `dist/` vai para o ramo `gh-pages` (GitHub Pages, com `.nojekyll`).
