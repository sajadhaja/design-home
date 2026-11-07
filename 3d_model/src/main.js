import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import walls from './walls.json';

// ---- coordinate helpers: traced page-1 pixels -> metres (0.0145 m per px) ----
const K = 0.0145, OX = 84, OY = 89;
const X = (px) => (px - OX) * K;
const Z = (py) => (py - OY) * K;
const WALL_H = 2.7;

const C = {
  wall: 0xf1e9db, wallIn: 0xf4eee3, floorTile: 0xe4d9c6, floorWood: 0xc9a77c, floorBath: 0xcfc8bd,
  wood: 0xa97c50, walnut: 0x7b5232, cream: 0xeadfcc, greige: 0xb7ac9d, stone: 0x4a4744,
  sofa: 0xd6c6ac, sage: 0x9aa58a, terracotta: 0xb86f4e, brass: 0xc9a24a, white: 0xf7f4ee,
  glass: 0xbfd9e6, bed: 0xe8dfd0, dark: 0x2d2b29, green: 0x5f8a54,
};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0.02, ...o });

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3f1ed);
const root = new THREE.Group(); scene.add(root);
const wallMeshes = [];
const tallMeshes = [];

function box(x0, y0, x1, y1, h, color, elev = 0, opts = {}) {
  const w = Math.abs(x1 - x0) * K, d = Math.abs(y1 - y0) * K;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), opts.material || mat(color, opts.m));
  m.position.set(X((x0 + x1) / 2), elev + h / 2, Z((y0 + y1) / 2));
  m.castShadow = opts.noShadow ? false : true; m.receiveShadow = true;
  if ((h >= 1.4 || opts.tall) && !opts.wall && elev < 1.0) tallMeshes.push(m);
  root.add(m); return m;
}
const floor = (x0, y0, x1, y1, color, name) => {
  const m = box(x0, y0, x1, y1, 0.04, color, -0.04, { noShadow: true }); m.userData.floor = name; return m;
};

// ---- walls (traced from the d2r page-1 plan) ----
walls.forEach(([x0, y0, x1, y1]) => {
  const m = box(x0, y0, x1, y1, WALL_H, C.wall, 0, { wall: true }); m.userData.isWall = true; wallMeshes.push(m);
});

// ---- floors ----
const FOOT = [84, 89, 1091, 1017];
floor(104, 556, 252, 890, C.floorTile, 'kitchen');
floor(268, 513, 310, 571, C.floorBath, 'nook');
floor(86, 905, 268, 970, C.floorTile, 'foyer');
floor(268, 513, 616, 970, C.floorTile, 'living');
floor(268, 700, 821, 970, C.floorTile, 'living');
floor(455, 376, 616, 513, C.floorTile, 'living');
floor(268, 497, 616, 513, C.floorTile, 'living');
floor(616, 441, 640, 520, C.floorTile, 'living');
floor(616, 700, 640, 755, C.floorTile, 'living');
floor(332, 105, 631, 360, C.floorWood, 'bed1');
floor(332, 376, 438, 497, C.floorBath, 'bath1');
floor(637, 233, 926, 503, C.floorWood, 'master');
floor(942, 363, 1090, 503, C.floorBath, 'bathM');
floor(942, 234, 1057, 346, 0xb89c78, 'balconyM');
floor(631, 521, 880, 753, C.floorWood, 'guest');
floor(897, 521, 1064, 627, C.floorBath, 'bathG');
floor(821, 772, 918, 964, 0xb89c78, 'balconyL');
floor(440, 360, 616, 376, C.floorTile, 'living');

// glass windows / balcony screens
const glass = (x0, y0, x1, y1, h = 2.1, e = 0.3) =>
  box(x0, y0, x1, y1, h, 0, e, { material: new THREE.MeshStandardMaterial({ color: C.glass, transparent: true, opacity: 0.28, roughness: 0.1 }), noShadow: true });
glass(942, 232, 1058, 236); glass(1056, 232, 1060, 346);          // master balcony
glass(918, 772, 922, 964); glass(821, 960, 922, 966);             // living balcony
glass(616, 105, 632, 360, 1.5, 0.9);                              // bedroom 1 window (right)
glass(104, 552, 252, 558, 1.4, 0.9);                              // kitchen window (top)
// balcony parapets
box(942, 343, 1090, 349, 1.05, C.wall); box(1058, 234, 1064, 346, 1.05, C.wall);
box(918, 772, 923, 964, 1.05, C.wall);
// door leaf proxies (open: shown as thin panels beside the opening)
const door = (x0, y0, x1, y1) => box(x0, y0, x1, y1, 2.05, C.wood, 0, { noShadow: true });
door(85, 905, 88, 960);

// ---- helpers for furniture ----
function fluted(x0, y0, x1, y1, h, color, vertical, elev = 0.0) {
  const g = new THREE.Group();
  const n = Math.round(((vertical ? (y1 - y0) : (x1 - x0)) * K) / 0.07);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    if (vertical) box(x0, y0 + t * (y1 - y0) - 1.5, x1, y0 + t * (y1 - y0) + 1.5, h, color, elev, { noShadow: true });
    else box(x0 + t * (x1 - x0) - 1.5, y0, x0 + t * (x1 - x0) + 1.5, y1, h, color, elev, { noShadow: true });
  }
  return g;
}
const light = (x, y, h, intensity = 0.9, dist = 5, color = 0xffd9a0) => {
  const l = new THREE.PointLight(color, intensity, dist, 1.6); l.position.set(X(x), h, Z(y)); root.add(l);
};
const sphere = (x, y, h, r, color) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 }));
  m.position.set(X(x), h, Z(y)); root.add(m);
};
const cyl = (x, y, h, r, color, elev = 0) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20), mat(color));
  m.position.set(X(x), elev + h / 2, Z(y)); m.castShadow = true; root.add(m); return m;
};
const bedFurn = (cx, headY, dir, widthM, color) => { // dir=+1 headboard at top (moves +y), -1 headboard at bottom
  const w = widthM / K / 2, len = 2.05 / K;
  const y0 = dir > 0 ? headY : headY - len, y1 = dir > 0 ? headY + len : headY;
  box(cx - w, y0, cx + w, y1, 0.32, C.wood);                          // base
  box(cx - w + 2, y0 + (dir > 0 ? 6 : 0), cx + w - 2, y1 - (dir > 0 ? 0 : 6), 0.22, C.bed, 0.32); // mattress
  const hy = dir > 0 ? headY : headY - 4;
  box(cx - w - 4, hy, cx + w + 4, hy + 4, 1.05, C.wood);              // headboard
  // pillows
  const py = dir > 0 ? headY + 8 : headY - 22;
  box(cx - w + 6, py, cx - 4, py + 14, 0.14, C.white, 0.54); box(cx + 4, py, cx + w - 6, py + 14, 0.14, C.white, 0.54);
  // throw
  const ty = dir > 0 ? y1 - 40 : y0;
  box(cx - w + 1, ty, cx + w - 1, ty + 40, 0.03, color, 0.54);
};

// =========================== MASTER BEDROOM (labelled "Bedroom 2") ===========================
// existing queen bed (head on the top wall), NO bedside table, wall background + side lights
bedFurn(782, 234, +1, 1.6, C.terracotta);
box(716, 234, 848, 238, 2.4, 0xd9c7a8, 0, { noShadow: true });                // headboard wall panel (cream textured)
fluted(700, 234, 716, 238, 2.4, C.wood, false); fluted(848, 234, 866, 238, 2.4, C.wood, false);
box(740, 235, 826, 237, 0.9, C.brass, 1.2, { noShadow: true });                // feature frame
sphere(703, 255, 1.55, 0.09, C.brass); sphere(861, 255, 1.55, 0.09, C.brass);  // bedside pendants (over the bedside tables)
light(703, 260, 1.5, 0.5, 4); light(861, 260, 1.5, 0.5, 4);
// bedside tables, one each side of the bed (bed centre x782)
for (const bx of [688, 845]) {
  box(bx, 240, bx + 31, 268, 0.5, C.wood);                                     // body
  box(bx - 1, 239, bx + 32, 269, 0.03, C.white, 0.5);                          // top
  box(bx + 3, 268, bx + 28, 269, 0.16, C.walnut, 0.28, { noShadow: true });    // drawer front
  box(bx + 12, 269, bx + 19, 270, 0.02, C.brass, 0.34, { noShadow: true });    // handle
  cyl(bx + 15, 254, 0.14, 0.05, C.sage, 0.53);                                 // small vase
}
box(637, 282, 664, 388, 2.4, C.cream);                                         // 4-door wardrobe on left wall
box(637, 232, 664, 282, 2.4, C.cream);
for (let y = 295; y < 390; y += 26) box(664, y, 666, y + 3, 0.9, C.brass, 0.9, { noShadow: true });
box(882, 233, 926, 257, 2.4, C.cream);                                         // tall storage right of bed (loft), shortened to free the bedside table
// modern floating dressing desk on the right wall (cream, fluted drawer, rounded end) + LED-lit shelf niche + oval LED mirror
// room door is on the left wall (y441-503) so the mirror faces it; bathroom door is just above (y379-430)
const led = { material: new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd9a0, emissiveIntensity: 1.6 }) };
box(896, 450, 926, 486, 0.04, C.white, 0.74); cyl(911, 486, 0.04, 0.2175, C.white, 0.74);   // desk top with rounded front end
box(898, 450, 926, 486, 0.16, C.cream, 0.58); cyl(911, 486, 0.16, 0.2175, C.cream, 0.58);   // drawer body, rounded end
fluted(896, 450, 898, 486, 0.16, C.cream, true, 0.58);                                       // fluted drawer front
box(896, 464, 897, 478, 0.012, C.brass, 0.66, { noShadow: true });                           // brass pull
// shelf niche beside the mirror on the bathroom-door side: built-in cream column with 4 shelves, LED under each
box(924, 432, 926, 450, 1.58, C.cream, 0.74);                                                // back panel
box(912, 432, 926, 434, 1.58, C.cream, 0.74); box(912, 448, 926, 450, 1.58, C.cream, 0.74);  // side panels
[1.12, 1.5, 1.88, 2.26].forEach((e, n) => {
  box(912, 432, 926, 450, 0.03, C.white, e);                                                 // shelf board
  box(913, 435, 924, 447, 0.012, 0, e - 0.012, led);                                         // LED strip under the shelf
});
// shelf styling
const vase = (y, e, h, r, c) => cyl(918, y, h, r, c, e);
vase(438, 0.77, 0.26, 0.045, C.terracotta); vase(445, 0.77, 0.16, 0.05, C.white);
vase(437, 1.15, 0.2, 0.04, C.sage); box(913, 440, 923, 448, 0.05, C.greige, 1.15); box(914, 441, 922, 447, 0.04, C.white, 1.2);
vase(437, 1.53, 0.14, 0.05, C.white); vase(446, 1.53, 0.28, 0.035, C.terracotta);
cyl(918, 441, 0.12, 0.04, C.brass, 1.91); cyl(918, 441, 0.2, 0.06, C.green, 2.03);            // plant
vase(446, 1.91, 0.22, 0.04, C.sage);
// oval LED mirror (mirror faces the room, halo glows behind it)
const oval = (xp, sy, sz, m) => { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.012, 48), m);
  g.rotation.z = Math.PI / 2; g.scale.set(sy, 1, sz); g.position.set(X(xp), 1.42, Z(476)); root.add(g); };
oval(925, 1.16, 0.64, led.material);
oval(924, 1.06, 0.54, new THREE.MeshStandardMaterial({ color: 0xdfe9ee, roughness: 0.05, metalness: 0.6, emissive: 0xffe2b0, emissiveIntensity: 0.12 }));
// desk accessories: glass vase with flowers, small tray with bottles
cyl(917, 460, 0.16, 0.035, C.glass, 0.78); cyl(917, 460, 0.1, 0.002, C.green, 0.94); sphere(917, 460, 1.0, 0.07, 0xe9c9c0);
box(908, 468, 924, 484, 0.015, C.white, 0.78); cyl(912, 472, 0.1, 0.018, C.terracotta, 0.795); cyl(917, 478, 0.13, 0.015, C.sage, 0.795);
// round boucle stool with brass base
cyl(876, 476, 0.3, 0.19, C.white, 0.12); cyl(876, 476, 0.12, 0.19, C.brass, 0);
light(905, 476, 1.7, 0.55, 3);

// =========================== GUEST BEDROOM (labelled "Master Bedroom") ===========================
bedFurn(764, 522, +1, 1.6, C.sage);
box(708, 522, 820, 526, 2.4, 0xd9c7a8, 0, { noShadow: true });
fluted(690, 522, 708, 526, 2.4, C.wood, false); fluted(820, 522, 840, 526, 2.4, C.wood, false);
box(690, 522, 708, 548, 0.5, C.wood); box(820, 522, 842, 548, 0.5, C.wood);    // two existing bedside tables
sphere(698, 560, 1.4, 0.09, C.brass); sphere(832, 560, 1.4, 0.09, C.brass);
light(700, 560, 1.4, 0.5, 4); light(832, 560, 1.4, 0.5, 4);
box(631, 519, 658, 660, 2.4, C.cream);                                         // 4-door wardrobe
for (let y = 535; y < 660; y += 30) box(658, y, 660, y + 3, 0.9, C.brass, 0.9, { noShadow: true });
box(800, 722, 880, 753, 0.74, C.wood);                                         // existing dressing table
box(816, 750, 864, 753, 1.0, 0, 0.9, { material: new THREE.MeshStandardMaterial({ color: 0xdfe9ee, roughness: 0.05, metalness: 0.6 }) });

// =========================== BEDROOM 1 ===========================
bedFurn(473, 105, +1, 1.6, C.sage);
box(406, 105, 540, 109, 2.4, 0x8d9a7a, 0, { noShadow: true });                 // sage feature wall
fluted(380, 105, 406, 109, 2.4, C.wood, false); fluted(540, 105, 560, 109, 2.4, C.wood, false);
box(370, 105, 408, 130, 0.5, C.wood);                                          // bedside (left)
box(332, 104, 364, 245, 2.4, C.cream);                                         // wardrobe on left wall
for (let y = 120; y < 245; y += 30) box(364, y, 366, y + 3, 0.9, C.brass, 0.9, { noShadow: true });
box(537, 104, 616, 131, 2.4, C.cream);                                         // loft/wardrobe top-right
// mirror moved beside the bedside table (backlit)
box(406, 107, 418, 109, 1.55, 0, 0.85, { material: new THREE.MeshStandardMaterial({ color: 0xdfe9ee, roughness: 0.05, metalness: 0.6, emissive: 0xffe2b0, emissiveIntensity: 0.25 }) });
// study table stays + bookshelf above it
box(332, 285, 364, 350, 0.74, C.wood);
box(332, 270, 340, 360, 1.1, C.wood, 1.35);                                    // bookshelf unit above the desk
for (let i = 0; i < 4; i++) box(332, 272 + i * 2, 342, 358 - i * 2, 0.02, C.cream, 1.4 + i * 0.28, { noShadow: true });
cyl(392, 318, 0.45, 0.2, C.dark);                                              // chair

// =========================== LIVING / DINING ===========================
// TV unit on the north wall of the living space (moved slightly left to align with the L-sofa)
box(660, 774, 800, 794, 0.45, C.walnut);                                       // TV console (floating look)
box(672, 779, 788, 782, 1.25, C.stone, 0.85, { noShadow: true });                // TV panel
box(700, 782, 760, 786, 0.8, 0x0f0f10, 1.05, { noShadow: true });               // TV
fluted(640, 774, 668, 778, 2.4, C.walnut, false); fluted(792, 774, 820, 778, 2.4, C.walnut, false);
box(668, 775, 792, 778, 2.4, 0xd8cdbb, 0, { noShadow: true });
light(730, 790, 2.2, 0.6, 5);
// L-shaped sofa (3-seater along south wall + chaise on the east end, facing the TV)
box(545, 915, 770, 965, 0.42, C.sofa); box(545, 940, 770, 965, 0.45, C.sofa, 0.42);
box(722, 868, 770, 945, 0.42, C.sofa);                                         // chaise
box(560, 1012, 560, 1012, 0.01, C.sofa, 0, { noShadow: true });
box(620, 860, 700, 896, 0.38, C.wood);                                         // centre table
box(520, 880, 546, 905, 0.55, C.sage);                                         // accent chair
// frames/awards wall near the kitchen door (foyer-side wall)
box(269, 768, 272, 902, 1.5, C.wood, 0.7, { noShadow: true });
for (let y = 780; y < 900; y += 28) box(272, y, 274, y + 18, 0.38, C.white, 1.15, { noShadow: true });
light(300, 840, 1.8, 0.4, 3);
// dining: 6-seater
box(405, 592, 515, 656, 0.74, C.wood);
for (const [cx, cy] of [[428, 578], [460, 578], [492, 578], [428, 670], [460, 670], [492, 670], [388, 624], [532, 624]]) cyl(cx, cy, 0.45, 0.15, C.sage);
// plant
cyl(663, 805, 0.6, 0.12, C.green);

// =========================== KITCHEN ===========================
// Left-wall run (d2r elevation A): wash set at the north end, then sink, dishwasher bay and hob in one row
const KX0 = 104, KX1 = 146;                                                     // counter depth ~0.6 m
const clear = (c, o) => ({ material: new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: o, roughness: 0.2 }), noShadow: true });
box(KX0, 658, KX1, 852, 0.85, C.greige);                                        // base cabinets (start after the wash set)
box(KX0, 658, KX1 + 2, 852, 0.04, C.stone, 0.85);                               // stone worktop
// ---- WASH SET: same row as the sink and hob, at the north (right-hand) end of the left-wall run ----
// Builder plan (Prestige) lists the Utility as 8'0" x 4'6" (2.44 x 1.37 m); the right-hand end of the run has the room, so the set is bigger:
// washer + dryer tower 0.61 m wide x 0.70 m deep, then a pull-out cleaning/MOAP cabinet, 1.25 m of the run in total (sink, dishwasher bay and hob stay in line after it).
const oak = 0xb48a5a, oakD = 0x8f6b45, graphite = 0x5a5f66, TX = 154;
const wmRing = (y, e, r) => {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 32), new THREE.MeshStandardMaterial({ color: 0x9a9da0, roughness: 0.2, metalness: 0.7 }));
  g.rotation.z = Math.PI / 2; g.position.set(X(TX) + 0.012, e, Z(y)); root.add(g);
  const gl = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.78, 0.034, 32), new THREE.MeshStandardMaterial({ color: 0x15181b, roughness: 0.05, metalness: 0.5 }));
  gl.rotation.z = Math.PI / 2; gl.position.set(X(TX) + 0.014, e, Z(y)); root.add(gl);
};
box(KX0, 572, TX, 614, 0.7, graphite, 0.15); box(KX0, 572, TX, 614, 0.7, graphite, 0.85);   // washer (bottom) + dryer (top)
wmRing(593, 0.5, 0.2); wmRing(593, 1.2, 0.2);
box(TX, 576, TX + 1, 610, 0.07, 0x15181b, 0.78, { noShadow: true }); box(TX, 576, TX + 1, 610, 0.07, 0x15181b, 1.48, { noShadow: true });   // control panels
fluted(TX, 572, TX + 2, 614, 0.15, oak, true, 0);                                    // fluted plinth
box(KX0, 572, TX, 614, 0.6, oakD, 1.57); fluted(TX, 572, TX + 2, 614, 0.6, oak, true, 1.57);   // fluted cabinet above the tower
box(TX + 2.5, 606, TX + 3.5, 609, 0.4, C.brass, 1.67, { noShadow: true });           // brass pull
// pull-out cleaning / MOAP cabinet (shown pulled out ~0.4 m, door swung aside), reference photo
box(KX0, 616, KX0 + 3, 658, 2.17, oakD); box(KX0, 616, TX, 618, 2.17, oakD); box(KX0, 656, TX, 658, 2.17, oakD); box(KX0, 616, TX, 658, 0.05, oakD, 2.12);
box(130, 618, 180, 619.5, 2.0, oakD, 0.05); box(130, 654.5, 180, 656, 2.0, oakD, 0.05);   // pull-out side boards
box(130, 619, 132, 655, 2.0, oakD, 0.05);                                             // pull-out back board
box(TX - 2, 656, 182, 658, 2.0, oak, 0.05); fluted(TX - 2, 658, 182, 660, 2.0, oak, false, 0.05);   // fluted door, swung open to the side
box(TX, 660, TX + 2, 661.5, 0.9, C.brass, 0.7, { noShadow: true });                  // long brass pull on the door
[0.25, 0.7, 1.1, 1.5, 1.88].forEach((e) => { box(132, 619.5, 179, 654.5, 0.03, 0xd9cdb8, e); box(133, 620.5, 178, 653.5, 0.01, 0, e - 0.012, led); });   // shelves + LED
[[640, 0x4a3426], [645, 0x4a3426], [650, 0x7a5a3a], [634, 0x4a3426]].forEach(([y, c]) => cyl(145, y, 0.22, 0.016, c, 1.91));   // amber bottles, top shelf
box(138, 624, 168, 640, 0.1, 0xe8dcc6, 1.53); box(138, 644, 168, 652, 0.1, 0xe8dcc6, 1.53);   // towels
cyl(150, 636, 0.26, 0.055, 0xc7b290, 0.28); cyl(150, 647, 0.18, 0.02, 0xc7b290, 0.73);       // bucket, dispenser
for (const y of [626, 632, 638, 644, 650]) cyl(134, y, 0.7, 0.008, 0xb99a6a, 0.75);   // hung mops / brooms
light(190, 620, 1.9, 0.7, 3.5);
// sink with drainer (moved 1.25 m along the run)
box(KX0 + 4, 664, KX1 - 6, 690, 0.02, 0xb9c2c7, 0.89, { noShadow: true });
for (let y = 692; y < 712; y += 4) box(KX0 + 4, y, KX1 - 6, y + 1.5, 0.02, 0xcfd6d9, 0.89, { noShadow: true });
cyl(KX0 + 8, 677, 0.3, 0.02, 0x9a9a9a, 0.89);                                   // tap
// hob (3 burners)
box(KX0 + 6, 762, KX1 - 6, 818, 0.015, 0x1c1c1c, 0.89, { noShadow: true });
cyl(122, 776, 0.012, 0.07, 0x444444, 0.9); cyl(122, 804, 0.012, 0.07, 0x444444, 0.9); cyl(134, 790, 0.012, 0.06, 0x444444, 0.9);
// dishwasher provision (blue marker on the base run, ~554 mm bay)
box(KX1, 718, KX1 + 1.5, 756, 0.72, 0, 0.06, clear(0x6fa8dc, 0.55));
// wall cabinets (greige) with two glass-shutter doors near the fridge end, plus loft
box(KX0, 658, 132, 852, 0.65, C.greige, 1.5);
box(132, 806, 134, 852, 0.55, 0, 1.55, clear(0xbfd9e6, 0.45));
box(KX0, 577, 132, 852, 0.55, C.cream, 2.15);                                   // loft frame & shutter
for (const y of [622, 665, 710, 755, 800]) box(132, y, 133, y + 1.2, 0.55, 0xcdbfa6, 2.15, { noShadow: true });   // loft box joints
// the free-standing MOAP block (partition) next to the washing machine is removed, as requested

// ---- fridge wall = short end wall (d2r elevation B), seen from inside ----
box(190, 850, 238, 890, 1.9, 0xdcdcdc);                                         // fridge
box(194, 848.5, 196, 850, 0.45, 0x8a8a8a, 1.15, { noShadow: true }); box(194, 848.5, 196, 850, 0.3, 0x8a8a8a, 0.55, { noShadow: true });
box(236, 849, 238, 850, 1.88, 0xbfbfbf, 0.01, { noShadow: true });
box(238, 850, 252, 890, 2.0, C.cream);                                          // filler where the MOAP used to be
box(188, 850, 252, 890, 0.65, C.cream, 2.05);                                   // loft box work over the fridge
box(148, 850, 188, 890, 0.85, C.greige);                                        // oven tower: base
box(148, 852, 188, 890, 0.7, C.greige, 0.85);
box(152, 849.5, 184, 852, 0.5, 0x2b2b2b, 0.95, { noShadow: true });             // built-in oven
box(158, 849, 178, 849.8, 0.22, 0x555e63, 1.0, { noShadow: true });
box(148, 850, 188, 890, 0.5, C.greige, 1.55);                                   // upper cabinets
box(148, 850, 188, 890, 0.65, C.cream, 2.05);                                   // loft frame & shutter
box(130, 850, 145, 890, 0.7, C.greige, 1.35);                                   // tall glass-door cabinets (220 mm)
box(130, 848.5, 145, 850, 0.64, 0, 1.38, clear(0xbfd9e6, 0.4));
box(107, 850, 130, 890, 0.7, C.cream, 1.35);                                    // 350 mm bay above
box(104, 850, 146, 890, 0.04, C.stone, 0.85);                                   // worktop over the corner
box(107, 850, 145, 890, 0.85, C.cream);                                         // former "null space": proposed roller-shutter storage
for (let i = 0; i < 11; i++) box(107, 848.2, 145, 850, 0.062, 0xe2d4bb, 0.02 + i * 0.075, { noShadow: true });
box(104, 850, 146, 890, 0.55, C.cream, 2.15);                                   // loft over the corner
light(150, 700, 2.4, 0.5, 5); light(200, 800, 2.3, 0.5, 4);

// =========================== BATHS ===========================
const wc = (x, y) => { box(x - 7, y - 10, x + 7, y + 10, 0.4, C.white); };
wc(995, 420); box(960, 480, 1050, 500, 0.85, C.white); wc(985, 560); box(920, 600, 1050, 622, 0.85, C.white);
wc(380, 450); box(345, 380, 420, 398, 0.85, C.white);
// basin nook
box(272, 520, 304, 560, 0.85, C.white);

// shoe rack OUTSIDE the main entrance (as marked on drawing)
box(20, 880, 80, 925, 1.05, C.wood);
box(20, 880, 80, 925, 0.04, C.cream, 1.05);

// ---------- footprint ground ----------
const ground = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), mat(0xeceae5));
ground.rotation.x = -Math.PI / 2; ground.position.set(X(580), -0.08, Z(550)); ground.receiveShadow = true; scene.add(ground);

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0xffffff, 0xe6dccb, 1.6));
const sun = new THREE.DirectionalLight(0xfff1dc, 0.9);
sun.position.set(X(450), 22, Z(250)); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 0.5, far: 40 });
sun.target.position.set(X(580), 0, Z(550)); scene.add(sun, sun.target);

// ---------- renderer / camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.maxPolarAngle = Math.PI / 2.02;

const P = (px, py, h) => new THREE.Vector3(X(px), h, Z(py));
const VIEWS = {
  dollhouse: { orbit: { c: [X(590), 0.3, Z(555)], d: 22, az: -22, el: 58 } },
  top:       { orbit: { c: [X(590), 0, Z(560)], d: 21.5, az: 0, el: 89 } },
  master:    { p: P(930, 560, 6.2), t: P(775, 340, 0.4), room: [780, 368], fov: 58 },
  masterB:   { p: P(745, 300, 4.0), t: P(915, 466, 1.4), room: [780, 368], fov: 56 },
  guest:     { p: P(960, 800, 6.2), t: P(760, 600, 0.4), room: [755, 637], fov: 58 },
  bedroom1:  { p: P(690, 410, 6.2), t: P(470, 215, 0.4), room: [480, 232], fov: 58 },
  living:    { p: P(520, 1060, 6.6), t: P(690, 820, 0.4), room: [700, 860], fov: 60 },
  kitchen:   { p: P(330, 735, 5.6), t: P(140, 735, 0.9), fov: 52 },   // no room cull: all kitchen units stay visible
  kitchenW:  { p: P(245, 598, 2.3), t: P(130, 625, 1.0), fov: 70 },
  kitchenB:  { p: P(205, 590, 4.4), t: P(190, 868, 1.0), room: [180, 760], fov: 54 },
  dining:    { p: P(640, 700, 6.4), t: P(430, 600, 0.3), room: [450, 610], fov: 58 },
};
function setView(name) {
  const v = VIEWS[name]; if (!v) return;
  let c;
  if (v.orbit) {
    const o = v.orbit, az = THREE.MathUtils.degToRad(o.az), el = THREE.MathUtils.degToRad(o.el);
    c = new THREE.Vector3(...o.c);
    camera.position.set(c.x + o.d * Math.cos(el) * Math.sin(az), c.y + o.d * Math.sin(el), c.z + o.d * Math.cos(el) * Math.cos(az));
  } else { c = v.t.clone(); camera.position.copy(v.p); }
  camera.fov = v.fov || 40; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(c); controls.target.copy(c); controls.update();
  const rc = v.room ? new THREE.Vector2(X(v.room[0]), Z(v.room[1])) : null;
  const dir = rc ? new THREE.Vector2(camera.position.x - rc.x, camera.position.z - rc.y).normalize() : null;
  const near = (m) => { const d = new THREE.Vector2(m.position.x - rc.x, m.position.z - rc.y); return d.dot(dir) > 0.3; };
  wallMeshes.forEach((w) => {
    const low = !rc || near(w);
    w.scale.y = low ? 0.35 / WALL_H : 1; w.position.y = low ? 0.175 : WALL_H / 2;
  });
  tallMeshes.forEach((m) => { m.visible = !(rc && near(m)); });
  window.__view = name;
}
window.setView = setView;
const q = new URLSearchParams(location.search).get('view');
setView(q || 'dollhouse');
if (q) { controls.enabled = false; document.getElementById('hud')?.remove(); }
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
(function loop() { controls.update(); renderer.render(scene, camera); window.__ready = true; requestAnimationFrame(loop); })();
