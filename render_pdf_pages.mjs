import fs from "node:fs";
import * as pdfjs from "file:///C:/Users/Adit/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "file:///C:/Users/Adit/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas/index.js";

const [pdfPath, outDir, ...pageArgs] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });

const data = new Uint8Array(fs.readFileSync(pdfPath));
const doc = await pdfjs.getDocument({ data, disableWorker: true }).promise;

for (const arg of pageArgs) {
  const pageNo = Number(arg);
  const page = await doc.getPage(pageNo);
  const viewport = page.getViewport({ scale: 1.7 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
  fs.writeFileSync(`${outDir}/page-${pageNo}.png`, canvas.toBuffer("image/png"));
}
