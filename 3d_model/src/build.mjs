import { build } from 'esbuild';
import fs from 'fs';
const r = await build({ entryPoints: ['src/main.js'], bundle: true, minify: true, write: false, format: 'iife', loader: { '.json': 'json' } });
const js = r.outputFiles[0].text.replace(/<\/script>/g, '<\\/script>');
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Vyttila Flat - 3D Concept</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%;overflow:hidden;background:#f3f1ed;font-family:-apple-system,"Segoe UI",system-ui,sans-serif}
#hud{position:fixed;top:12px;left:12px;background:rgba(255,255,255,.92);border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;font-size:13px;color:#1f2328;max-width:320px}
#hud b{display:block;margin-bottom:6px;font-size:14px}#hud button{margin:2px 2px 0 0;padding:4px 8px;border:1px solid #cfd4da;background:#f7f8fa;border-radius:4px;cursor:pointer;font-size:12px}
#hud p{margin:8px 0 0;color:#57606a;font-size:11.5px;line-height:1.4}</style></head><body>
<div id="hud"><b>Vyttila flat: 3D concept</b>
<button data-view="dollhouse">Dollhouse</button><button data-view="top">Top view</button><button data-view="living">Living</button><button data-view="kitchen">Kitchen: counter run</button><button data-view="kitchenW">Kitchen: utility</button><button data-view="kitchenB">Kitchen: fridge wall</button><button data-view="dining">Dining</button><button data-view="master">Master (Bedroom 2)</button><button data-view="masterB">Master: dressing table</button><button data-view="guest">Guest ("Master Bedroom")</button><button data-view="bedroom1">Bedroom 1</button>
<p>Drag to rotate, scroll to zoom, right-drag to pan. Layout traced from the d2r floor plan; furniture is a concept, not to exact scale.</p></div>
<script>${js}</script></body></html>`;
fs.writeFileSync(process.argv[2] || 'viewer.html', html);
console.log('bytes', html.length);
