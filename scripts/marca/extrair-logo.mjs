// Uso: node scripts/marca/extrair-logo.mjs scripts/marca/logo-original.png src/assets/marca
// (depois copie src/assets/marca/simbolo-claro.png para public/favicon.png). As coordenadas são da arte de 1600x1131.
// Extrai o logo da Steto da arte em fundo azul: fundo vira transparente (alfa pela projeção de cada pixel
// entre o fundo e a cor da tinta, para manter o antisserrilhado) e gera as versões para fundo escuro e claro.
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const [origem, destino] = process.argv.slice(2);
const img = PNG.sync.read(readFileSync(origem));
const { width: W, data } = img;
const FUNDO = [37, 62, 103];
const BRANCO = [255, 255, 255];
const SIMBOLO = [162, 195, 228];

const pixel = (x, y) => { const i = (y * W + x) * 4; return [data[i], data[i + 1], data[i + 2]]; };
const ehSimbolo = (x, y) => x >= 1035 && y >= 420 && y <= 665;
const ehRegistrado = (x, y) => x >= 1205 && y <= 412; // ® fica de fora das versões do app

function alfa(x, y) {
  if (ehRegistrado(x, y)) return 0;
  const F = ehSimbolo(x, y) ? SIMBOLO : BRANCO;
  const p = pixel(x, y);
  const d = F.map((c, i) => c - FUNDO[i]);
  const v = p.map((c, i) => c - FUNDO[i]);
  const a = (v[0] * d[0] + v[1] * d[1] + v[2] * d[2]) / (d[0] ** 2 + d[1] ** 2 + d[2] ** 2);
  return Math.max(0, Math.min(1, (a - 0.04) / 0.92)); // corta o ruído de compressão perto do fundo
}

/** Recorta [x0,x1]×[y0,y1], pinta letras e símbolo com as cores dadas e reduz pela metade (média em pré-multiplicado). */
function gerar(nome, [x0, x1, y0, y1], corLetras, corSimbolo) {
  const w = Math.floor((x1 - x0 + 1) / 2), h = Math.floor((y1 - y0 + 1) / 2);
  const saida = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const sx = x0 + x * 2 + dx, sy = y0 + y * 2 + dy;
        const al = alfa(sx, sy);
        const cor = ehSimbolo(sx, sy) ? corSimbolo : corLetras;
        r += cor[0] * al; g += cor[1] * al; b += cor[2] * al; a += al;
      }
      const i = (y * w + x) * 4;
      saida.data[i] = a ? Math.round(r / a) : 0;
      saida.data[i + 1] = a ? Math.round(g / a) : 0;
      saida.data[i + 2] = a ? Math.round(b / a) : 0;
      saida.data[i + 3] = Math.round((a / 4) * 255);
    }
  writeFileSync(`${destino}/${nome}.png`, PNG.sync.write(saida));
  console.log(nome, w, "x", h);
}

const COMPACTO = [328, 1283, 377, 664];
const COMPLETO = [328, 1283, 377, 741];
const SO_SIMBOLO = [1031, 1214, 422, 661];
const NAVY = [37, 62, 103];
const AZUL = [37, 99, 235];

gerar("steto-escuro", COMPACTO, BRANCO, SIMBOLO);
gerar("steto-claro", COMPACTO, NAVY, AZUL);
gerar("steto-contabilidade-escuro", COMPLETO, BRANCO, SIMBOLO);
gerar("steto-contabilidade-claro", COMPLETO, NAVY, AZUL);
gerar("simbolo-claro", SO_SIMBOLO, NAVY, AZUL);
