import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import walls from './walls.json';

// ============================================================================
// COORDINATE SYSTEM & SCALE
// Traced page-1 pixels -> metres (0.0145 m per px)
// ============================================================================
const K = 0.0145, OX = 84, OY = 89;
const X = (px) => (px - OX) * K;
const Z = (py) => (py - OY) * K;
const WALL_H = 2.7;
const P = (px, py, h) => new THREE.Vector3(X(px), h, Z(py));

// ============================================================================
// PROCEDURAL TEXTURE GENERATION FOR PHOTOREALISTIC RENDERING
// ============================================================================
function createTexture(width, height, drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// Wood grain & planks texture
function makeWoodTexture(baseColor = '#c8a478', grainColor = '#9a7248', darkColor = '#6d4c2b', isFloor = false) {
  return createTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);
    
    // Subtle wood grain lines
    ctx.fillStyle = grainColor;
    for (let i = 0; i < 600; i++) {
      const y = Math.random() * h;
      const x = Math.random() * w;
      const len = 30 + Math.random() * 120;
      const alpha = 0.05 + Math.random() * 0.12;
      ctx.fillStyle = `rgba(${parseInt(grainColor.slice(1,3),16)}, ${parseInt(grainColor.slice(3,5),16)}, ${parseInt(grainColor.slice(5,7),16)}, ${alpha})`;
      ctx.fillRect(x, y, len, 1 + Math.random() * 2);
    }

    if (isFloor) {
      // Floor plank seams
      const plankHeight = h / 8;
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2;
      for (let y = 0; y <= h; y += plankHeight) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        // Vertical plank breaks (staggered)
        const row = Math.floor(y / plankHeight);
        const offset = (row % 3) * (w / 3);
        for (let x = offset; x < w; x += w / 2) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + plankHeight);
          ctx.stroke();
        }
      }
    }
  });
}

// Porcelain / Marble tile texture
function makeTileTexture(tileColor = '#ebe3d5', groutColor = '#b5ab9d', size = 4) {
  return createTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = tileColor;
    ctx.fillRect(0, 0, w, h);
    
    // Subtle surface noise
    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const alpha = 0.03 + Math.random() * 0.04;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(x, y, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }

    // Grout lines
    const step = w / size;
    ctx.strokeStyle = groutColor;
    ctx.lineWidth = 3;
    for (let i = 0; i <= w; i += step) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke();
    }
  });
}

// Marble / Quartz Veining
function makeMarbleTexture(baseColor = '#f5f3ef', veinColor = '#8c857b') {
  return createTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);
    
    // Organic subtle veins
    ctx.strokeStyle = veinColor;
    for (let v = 0; v < 7; v++) {
      let x = Math.random() * w;
      let y = 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineWidth = 1 + Math.random() * 3;
      ctx.strokeStyle = `rgba(130, 120, 110, ${0.12 + Math.random() * 0.18})`;
      while (y < h) {
        x += (Math.random() - 0.5) * 40;
        y += 15 + Math.random() * 25;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

// Fabric / Linen texture
function makeFabricTexture(baseColor = '#ded6c8', threadColor = '#bcaf9b') {
  return createTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = threadColor;
    for (let x = 0; x < w; x += 4) {
      for (let y = 0; y < h; y += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillStyle = 'rgba(0,0,0,0.06)';
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
  });
}

// Modern Scandinavian Rug Texture
function makeRugTexture() {
  return createTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e8e2d5';
    ctx.fillRect(0, 0, w, h);
    
    // Abstract geometric arcs / soft earthy shapes
    ctx.fillStyle = 'rgba(180, 150, 120, 0.25)';
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.5, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(120, 140, 120, 0.2)';
    ctx.beginPath();
    ctx.arc(w * 0.7, h * 0.4, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(200, 110, 80, 0.18)';
    ctx.fillRect(w * 0.2, h * 0.65, 200, 70);

    // Subtle wool pile noise
    for (let i = 0; i < 4000; i++) {
      ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
}

// Modern Abstract Art Canvas
function makeArtTexture(palette = 'warm') {
  return createTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f8f6f0';
    ctx.fillRect(0, 0, w, h);
    if (palette === 'warm') {
      ctx.fillStyle = '#c87d55'; // terracotta
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.4, 60, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#4a5d4e'; // sage deep
      ctx.fillRect(w * 0.2, h * 0.55, 140, 50);
      ctx.fillStyle = '#d4af37'; // gold arch
      ctx.beginPath(); ctx.arc(w * 0.65, h * 0.65, 40, Math.PI, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#3a4f66'; // slate
      ctx.fillRect(w * 0.25, h * 0.25, 120, 120);
      ctx.fillStyle = '#d9b48f'; // sand
      ctx.beginPath(); ctx.arc(w * 0.6, h * 0.6, 50, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, w, h);
  });
}

// Generate shared procedural textures
const texWoodFloor = makeWoodTexture('#caa472', '#a07a4a', '#543b20', true);
texWoodFloor.repeat.set(4, 4);
const texWoodFurniture = makeWoodTexture('#b88b56', '#8e6234', '#4e3318', false);
texWoodFurniture.repeat.set(2, 2);
const texWalnut = makeWoodTexture('#704626', '#4a2c14', '#281507', false);
const texTileFloor = makeTileTexture('#eee6d8', '#cac0af', 8);
texTileFloor.repeat.set(8, 8);
const texBathTile = makeTileTexture('#ded8cf', '#bab3a6', 6);
texBathTile.repeat.set(4, 4);
const texMarble = makeMarbleTexture('#f9f7f4', '#a69d90');
texMarble.repeat.set(2, 2);
const texFabricSofa = makeFabricTexture('#d8cbba', '#b8a892');
texFabricSofa.repeat.set(6, 6);
const texFabricBed = makeFabricTexture('#ede6d9', '#c9c0b0');
texFabricBed.repeat.set(4, 4);
const texRug = makeRugTexture();

// ============================================================================
// MATERIALS PALETTE (PHYSICALLY BASED RENDERING)
// ============================================================================
const C = {
  wall: 0xf4eee3, wallIn: 0xf6f1e8, floorTile: 0xeee6d8, floorWood: 0xc8a472, floorBath: 0xdcd6cd,
  wood: 0xb58955, walnut: 0x6e4726, cream: 0xeee4d2, greige: 0xbcb09f, stone: 0x3d3a37,
  sofa: 0xdcd0be, sage: 0x93a283, terracotta: 0xbf6c47, brass: 0xd8b257, white: 0xfcfaf6,
  glass: 0xcbe3ed, bed: 0xeee7dc, dark: 0x222120, green: 0x4f7c46, ceiling: 0xffffff,
  skirting: 0xe8decb
};

const mat = (c, o = {}) => new THREE.MeshStandardMaterial({
  color: c,
  roughness: o.roughness ?? 0.72,
  metalness: o.metalness ?? 0.04,
  ...o
});

// PBR materials
const M = {
  wall: mat(C.wall, { roughness: 0.88, metalness: 0.01 }),
  wallInner: mat(C.wallIn, { roughness: 0.85, metalness: 0.01 }),
  floorTile: new THREE.MeshStandardMaterial({ map: texTileFloor, roughness: 0.38, metalness: 0.06 }),
  floorWood: new THREE.MeshStandardMaterial({ map: texWoodFloor, roughness: 0.42, metalness: 0.04 }),
  floorBath: new THREE.MeshStandardMaterial({ map: texBathTile, roughness: 0.45, metalness: 0.05 }),
  balconyFloor: mat(0xbca282, { roughness: 0.8 }),
  wood: new THREE.MeshStandardMaterial({ map: texWoodFurniture, roughness: 0.5, metalness: 0.02 }),
  walnut: new THREE.MeshStandardMaterial({ map: texWalnut, roughness: 0.48, metalness: 0.02 }),
  marble: new THREE.MeshStandardMaterial({ map: texMarble, roughness: 0.22, metalness: 0.08 }),
  sofa: new THREE.MeshStandardMaterial({ map: texFabricSofa, roughness: 0.9, metalness: 0.01 }),
  bedLinen: new THREE.MeshStandardMaterial({ map: texFabricBed, roughness: 0.88, metalness: 0.01 }),
  brass: mat(C.brass, { roughness: 0.28, metalness: 0.88 }),
  chrome: mat(0xe5e7eb, { roughness: 0.15, metalness: 0.95 }),
  mirror: new THREE.MeshStandardMaterial({ color: 0xedf4f8, roughness: 0.04, metalness: 0.92 }),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xdff0f7,
    transparent: true,
    opacity: 0.35,
    roughness: 0.08,
    transmission: 0.75,
    ior: 1.52,
    thickness: 0.05
  }),
  ledWarm: new THREE.MeshStandardMaterial({
    color: 0xffeed0,
    emissive: 0xffc870,
    emissiveIntensity: 2.2,
    roughness: 0.2
  }),
  tvScreen: mat(0x0a0a0c, { roughness: 0.1, metalness: 0.5 }),
  skirting: mat(C.skirting, { roughness: 0.7 }),
};

// ============================================================================
// SCENE SETUP
// ============================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf1efe9);
const root = new THREE.Group();
scene.add(root);

const wallMeshes = [];
const tallMeshes = [];
const interiorLights = [];

// Base Box builder
function box(x0, y0, x1, y1, h, color, elev = 0, opts = {}) {
  const w = Math.abs(x1 - x0) * K, d = Math.abs(y1 - y0) * K;
  const meshMaterial = opts.material || (opts.pbr ? M[opts.pbr] : mat(color, opts.m));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), meshMaterial);
  m.position.set(X((x0 + x1) / 2), elev + h / 2, Z((y0 + y1) / 2));
  m.castShadow = !opts.noShadow;
  m.receiveShadow = true;
  if ((h >= 1.4 || opts.tall) && !opts.wall && elev < 1.0) tallMeshes.push(m);
  root.add(m);
  return m;
}

// Floor builder
const floor = (x0, y0, x1, y1, pbrMaterial, name) => {
  const w = Math.abs(x1 - x0) * K, d = Math.abs(y1 - y0) * K;
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.04, d), pbrMaterial);
  m.position.set(X((x0 + x1) / 2), -0.02, Z((y0 + y1) / 2));
  m.receiveShadow = true;
  m.userData.floor = name;
  root.add(m);
  return m;
};

// Soft Cylinder builder
const cyl = (x, y, h, r, color, elev = 0, opts = {}) => {
  const meshMaterial = opts.material || (opts.pbr ? M[opts.pbr] : mat(color));
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 28), meshMaterial);
  m.position.set(X(x), elev + h / 2, Z(y));
  m.castShadow = !opts.noShadow;
  m.receiveShadow = true;
  root.add(m);
  return m;
};

// Sphere builder (glowing bulbs / accents)
const sphere = (x, y, h, r, color, isGlow = true) => {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 20, 16),
    new THREE.MeshStandardMaterial({
      color,
      emissive: isGlow ? color : 0x000000,
      emissiveIntensity: isGlow ? 1.5 : 0,
      roughness: 0.2
    })
  );
  m.position.set(X(x), h, Z(y));
  root.add(m);
  return m;
};

// Warm Architectural Interior Light
const light = (x, y, h, intensity = 0.8, dist = 5.5, color = 0xffdfaa) => {
  const l = new THREE.PointLight(color, intensity, dist, 1.8);
  l.position.set(X(x), h, Z(y));
  l.castShadow = false; // Point lights kept soft for high performance
  root.add(l);
  interiorLights.push({ light: l, baseIntensity: intensity, baseColor: color });
  return l;
};

// ============================================================================
// WALLS (Traced from d2r floor plan)
// ============================================================================
walls.forEach(([x0, y0, x1, y1]) => {
  const m = box(x0, y0, x1, y1, WALL_H, C.wall, 0, { wall: true, material: M.wall });
  m.userData.isWall = true;
  wallMeshes.push(m);

  // Add subtle realistic skirting boards along bottom
  const sk = box(x0, y0, x1, y1, 0.08, C.skirting, 0, { noShadow: true, material: M.skirting });
  sk.scale.set(1.02, 1, 1.02);
});

// ============================================================================
// FLOORS
// ============================================================================
floor(104, 556, 252, 890, M.floorTile, 'kitchen');
floor(268, 513, 310, 571, M.floorBath, 'nook');
floor(86, 905, 268, 970, M.floorTile, 'foyer');
floor(268, 513, 616, 970, M.floorTile, 'living');
floor(268, 700, 821, 970, M.floorTile, 'living');
floor(455, 376, 616, 513, M.floorTile, 'living');
floor(268, 497, 616, 513, M.floorTile, 'living');
floor(616, 441, 640, 520, M.floorTile, 'living');
floor(616, 700, 640, 755, M.floorTile, 'living');
floor(332, 105, 631, 360, M.floorWood, 'bed1');
floor(332, 376, 438, 497, M.floorBath, 'bath1');
floor(637, 233, 926, 503, M.floorWood, 'master');
floor(942, 363, 1090, 503, M.floorBath, 'bathM');
floor(942, 234, 1057, 346, M.balconyFloor, 'balconyM');
floor(631, 521, 880, 753, M.floorWood, 'guest');
floor(897, 521, 1064, 627, M.floorBath, 'bathG');
floor(821, 772, 918, 964, M.balconyFloor, 'balconyL');
floor(440, 360, 616, 376, M.floorTile, 'living');

// ============================================================================
// ARCHITECTURAL WINDOWS, BALCONY SCREENS & DOORS
// ============================================================================
const glass = (x0, y0, x1, y1, h = 2.1, e = 0.3) => {
  const g = box(x0, y0, x1, y1, h, 0, e, { material: M.glass, noShadow: true });
  // Add dark metallic frame
  box(x0, y0, x1, y1, 0.05, C.dark, e + h, { noShadow: true, material: M.brass });
  return g;
};

glass(942, 232, 1058, 236); glass(1056, 232, 1060, 346); // master balcony
glass(918, 772, 922, 964); glass(821, 960, 922, 966);     // living balcony
glass(616, 105, 632, 360, 1.5, 0.9);                      // bedroom 1 window
glass(104, 552, 252, 558, 1.4, 0.9);                      // kitchen window

// Balcony parapets
box(942, 343, 1090, 349, 1.05, C.wall, 0, { material: M.wall });
box(1058, 234, 1064, 346, 1.05, C.wall, 0, { material: M.wall });
box(918, 772, 923, 964, 1.05, C.wall, 0, { material: M.wall });

// Main Entrance Door proxy with modern walnut grain & brass handle
box(85, 905, 88, 960, 2.2, 0, 0, { material: M.walnut });
box(88, 948, 90, 952, 0.25, 0, 1.0, { material: M.brass }); // door handle

// ============================================================================
// LUXURY FURNITURE & INTERIOR STYLING
// ============================================================================

// Fluted panel builder
function fluted(x0, y0, x1, y1, h, color, vertical, elev = 0.0, pbr = 'wood') {
  const n = Math.round(((vertical ? (y1 - y0) : (x1 - x0)) * K) / 0.065);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    if (vertical) {
      box(x0, y0 + t * (y1 - y0) - 1.2, x1, y0 + t * (y1 - y0) + 1.2, h, color, elev, { noShadow: true, material: M[pbr] });
    } else {
      box(x0 + t * (x1 - x0) - 1.2, y0, x0 + t * (x1 - x0) + 1.2, y1, h, color, elev, { noShadow: true, material: M[pbr] });
    }
  }
}

// Modern Styled Bed Builder
const bedFurn = (cx, headY, dir, widthM, throwColor, accentPillowColor = C.terracotta) => {
  const w = widthM / K / 2, len = 2.05 / K;
  const y0 = dir > 0 ? headY : headY - len, y1 = dir > 0 ? headY + len : headY;
  // Floating wooden base
  box(cx - w, y0, cx + w, y1, 0.32, 0, 0, { material: M.walnut });
  // Premium mattress with textured linen
  box(cx - w + 2, y0 + (dir > 0 ? 6 : 0), cx + w - 2, y1 - (dir > 0 ? 0 : 6), 0.24, 0, 0.32, { material: M.bedLinen });
  // Cushioned headboard
  const hy = dir > 0 ? headY : headY - 4;
  box(cx - w - 4, hy, cx + w + 4, hy + 4, 1.15, 0, 0, { material: M.sofa });
  // Plush pillows (2 main + 2 accent)
  const py = dir > 0 ? headY + 8 : headY - 22;
  box(cx - w + 6, py, cx - 4, py + 14, 0.16, C.white, 0.56, { material: M.bedLinen });
  box(cx + 4, py, cx + w - 6, py + 14, 0.16, C.white, 0.56, { material: M.bedLinen });
  // Accent cushions
  box(cx - w + 12, py + 5, cx - 10, py + 15, 0.14, accentPillowColor, 0.62);
  box(cx + 10, py + 5, cx + w - 12, py + 15, 0.14, accentPillowColor, 0.62);
  // Designer blanket / runner throw
  const ty = dir > 0 ? y1 - 42 : y0;
  box(cx - w + 1, ty, cx + w - 1, ty + 42, 0.035, throwColor, 0.56);
};

// Modern Rug builder
const createRug = (x0, y0, x1, y1) => {
  const w = Math.abs(x1 - x0) * K, d = Math.abs(y1 - y0) * K;
  const rugMat = new THREE.MeshStandardMaterial({ map: texRug, roughness: 0.95, metalness: 0.0 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, d), rugMat);
  m.position.set(X((x0 + x1) / 2), 0.008, Z((y0 + y1) / 2));
  m.receiveShadow = true;
  root.add(m);
  return m;
};

// Designer Wall Art Frame
const wallArt = (x0, y0, x1, y1, h, elev, palette = 'warm') => {
  const artTex = makeArtTexture(palette);
  const artMat = new THREE.MeshStandardMaterial({ map: artTex, roughness: 0.5 });
  box(x0, y0, x1, y1, h, 0, elev, { material: artMat, noShadow: true });
};

// Potted Indoor Plant
const pottedPlant = (x, y, potR = 0.14, plantH = 0.7) => {
  cyl(x, y, 0.35, potR, C.white, 0, { material: M.wall }); // ceramic pot
  cyl(x, y, 0.05, potR * 0.92, C.stone, 0.32);             // soil
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(potR * 1.3, 12, 8),
      new THREE.MeshStandardMaterial({ color: C.green, roughness: 0.4 })
    );
    leaf.scale.set(0.3, plantH, 0.8);
    leaf.rotation.y = angle;
    leaf.rotation.z = 0.25;
    leaf.position.set(X(x) + Math.cos(angle) * 0.08, 0.35 + plantH * 0.4, Z(y) + Math.sin(angle) * 0.08);
    leaf.castShadow = true;
    root.add(leaf);
  }
};

// ----------------------------------------------------------------------------
// 1. MASTER BEDROOM (Bedroom 2)
// ----------------------------------------------------------------------------
bedFurn(782, 234, +1, 1.6, C.terracotta, C.walnut);
createRug(680, 270, 880, 430);

// Fluted wooden acoustic panel wall + warm LED backlight
box(716, 234, 848, 238, 2.4, 0xd9c7a8, 0, { noShadow: true });
fluted(700, 234, 716, 238, 2.4, C.wood, false, 0, 'walnut');
fluted(848, 234, 866, 238, 2.4, C.wood, false, 0, 'walnut');
box(740, 235, 826, 237, 0.9, 0, 1.2, { material: M.brass, noShadow: true });

// Warm bedside pendants & lights
sphere(703, 255, 1.55, 0.09, C.brass);
sphere(861, 255, 1.55, 0.09, C.brass);
light(703, 260, 1.5, 0.65, 4.5);
light(861, 260, 1.5, 0.65, 4.5);

// Bedside nightstands
for (const bx of [688, 845]) {
  box(bx, 240, bx + 31, 268, 0.5, 0, 0, { material: M.walnut });
  box(bx - 1, 239, bx + 32, 269, 0.03, 0, 0.5, { material: M.marble });
  box(bx + 3, 268, bx + 28, 269, 0.16, 0, 0.28, { material: M.wood, noShadow: true });
  box(bx + 12, 269, bx + 19, 270, 0.02, 0, 0.34, { material: M.brass, noShadow: true });
  cyl(bx + 15, 254, 0.14, 0.05, C.sage, 0.53);
}

// 4-door floor-to-ceiling wardrobe with vertical brass profile handles
box(637, 232, 664, 388, 2.4, C.cream);
for (let y = 295; y < 390; y += 26) box(664, y, 666, y + 3, 0.9, 0, 0.9, { material: M.brass, noShadow: true });
box(882, 233, 926, 257, 2.4, C.cream); // loft storage

// Master Vanity: Floating curved dressing desk + fluted drawer + shelf niche + glowing oval mirror
box(896, 450, 926, 486, 0.04, 0, 0.74, { material: M.marble });
cyl(911, 486, 0.04, 0.2175, 0, 0.74, { material: M.marble });
box(898, 450, 926, 486, 0.16, C.cream, 0.58);
cyl(911, 486, 0.16, 0.2175, C.cream, 0.58);
fluted(896, 450, 898, 486, 0.16, C.cream, true, 0.58, 'wood');
box(896, 464, 897, 478, 0.012, 0, 0.66, { material: M.brass, noShadow: true });

// Shelf niche with under-shelf glowing LED strips
box(924, 432, 926, 450, 1.58, C.cream, 0.74);
box(912, 432, 926, 434, 1.58, C.cream, 0.74);
box(912, 448, 926, 450, 1.58, C.cream, 0.74);
[1.12, 1.5, 1.88, 2.26].forEach((e) => {
  box(912, 432, 926, 450, 0.03, 0, e, { material: M.marble });
  box(913, 435, 924, 447, 0.012, 0, e - 0.012, { material: M.ledWarm, noShadow: true });
});

// Shelf decor & styling
cyl(918, 438, 0.26, 0.045, C.terracotta, 0.77);
cyl(918, 445, 0.16, 0.05, C.white, 0.77);
cyl(918, 437, 0.2, 0.04, C.sage, 1.15);
cyl(918, 441, 0.12, 0.04, 0, 1.91, { material: M.brass });
cyl(918, 441, 0.2, 0.06, C.green, 2.03);

// Oval LED Mirror (Halo glow)
const ovalMirror = (xp, sy, sz) => {
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.015, 48), M.ledWarm);
  halo.rotation.z = Math.PI / 2; halo.scale.set(sy * 1.05, 1, sz * 1.05);
  halo.position.set(X(xp) + 0.005, 1.42, Z(476));
  root.add(halo);

  const glassMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.012, 48), M.mirror);
  glassMesh.rotation.z = Math.PI / 2; glassMesh.scale.set(sy, 1, sz);
  glassMesh.position.set(X(xp), 1.42, Z(476));
  root.add(glassMesh);
};
ovalMirror(924, 1.12, 0.58);

// Vanity Boucle stool with brass base ring
cyl(876, 476, 0.3, 0.19, 0, 0.12, { material: M.sofa });
cyl(876, 476, 0.12, 0.19, 0, 0, { material: M.brass });
light(905, 476, 1.7, 0.65, 3.5);

// ----------------------------------------------------------------------------
// 2. GUEST BEDROOM (Master Bedroom on Plan)
// ----------------------------------------------------------------------------
bedFurn(764, 522, +1, 1.6, C.sage, C.terracotta);
createRug(680, 560, 850, 710);

box(708, 522, 820, 526, 2.4, 0xd9c7a8, 0, { noShadow: true });
fluted(690, 522, 708, 526, 2.4, C.wood, false, 0, 'walnut');
fluted(820, 522, 840, 526, 2.4, C.wood, false, 0, 'walnut');
box(690, 522, 708, 548, 0.5, 0, 0, { material: M.walnut });
box(820, 522, 842, 548, 0.5, 0, 0, { material: M.walnut });
sphere(698, 560, 1.4, 0.09, C.brass);
sphere(832, 560, 1.4, 0.09, C.brass);
light(700, 560, 1.4, 0.55, 4);
light(832, 560, 1.4, 0.55, 4);

box(631, 519, 658, 660, 2.4, C.cream);
for (let y = 535; y < 660; y += 30) box(658, y, 660, y + 3, 0.9, 0, 0.9, { material: M.brass, noShadow: true });
box(800, 722, 880, 753, 0.74, 0, 0, { material: M.wood });
box(816, 750, 864, 753, 1.0, 0, 0.9, { material: M.mirror });

// ----------------------------------------------------------------------------
// 3. BEDROOM 1 & STUDY
// ----------------------------------------------------------------------------
bedFurn(473, 105, +1, 1.6, C.sage, C.brass);
createRug(390, 140, 550, 280);

box(406, 105, 540, 109, 2.4, 0x8d9a7a, 0, { noShadow: true }); // Sage feature wall
fluted(380, 105, 406, 109, 2.4, C.wood, false, 0, 'wood');
fluted(540, 105, 560, 109, 2.4, C.wood, false, 0, 'wood');
box(370, 105, 408, 130, 0.5, 0, 0, { material: M.wood });
box(332, 104, 364, 245, 2.4, C.cream);
for (let y = 120; y < 245; y += 30) box(364, y, 366, y + 3, 0.9, 0, 0.9, { material: M.brass, noShadow: true });
box(537, 104, 616, 131, 2.4, C.cream);

// Study table with bookshelf unit above
box(332, 285, 364, 350, 0.74, 0, 0, { material: M.wood });
box(332, 270, 340, 360, 1.1, 0, 1.35, { material: M.walnut });
for (let i = 0; i < 4; i++) {
  box(332, 272 + i * 2, 342, 358 - i * 2, 0.02, C.cream, 1.4 + i * 0.28, { noShadow: true });
}
cyl(392, 318, 0.45, 0.2, C.dark);

// ----------------------------------------------------------------------------
// 4. LIVING & DINING GRAND SPACE
// ----------------------------------------------------------------------------
// Modern geometric area rug
createRug(520, 780, 790, 970);

// TV Entertainment Console & Fluted Feature Wall
box(660, 774, 800, 794, 0.45, 0, 0, { material: M.walnut });
box(672, 779, 788, 782, 1.25, 0, 0.85, { material: M.marble, noShadow: true });
box(700, 782, 760, 786, 0.8, 0, 1.05, { material: M.tvScreen, noShadow: true });
fluted(640, 774, 668, 778, 2.4, C.walnut, false, 0, 'walnut');
fluted(792, 774, 820, 778, 2.4, C.walnut, false, 0, 'walnut');
box(668, 775, 792, 778, 2.4, 0xd8cdbb, 0, { noShadow: true });

// TV backdrop LED strip glow
box(670, 777, 790, 778, 0.02, 0, 2.1, { material: M.ledWarm, noShadow: true });
light(730, 790, 2.2, 0.8, 5.5);

// L-Shaped Sectional Sofa with plush cushions & chaise
box(545, 915, 770, 965, 0.44, 0, 0, { material: M.sofa });
box(545, 940, 770, 965, 0.46, 0, 0.44, { material: M.sofa });
box(722, 868, 770, 945, 0.44, 0, 0, { material: M.sofa }); // Chaise lounge
box(560, 920, 600, 940, 0.16, C.terracotta, 0.44);             // Accent cushion
box(670, 920, 710, 940, 0.16, C.sage, 0.44);                   // Accent cushion

// Coffee Table Set (Walnut + Marble dual tier)
box(620, 860, 700, 896, 0.38, 0, 0, { material: M.walnut });
cyl(605, 878, 0.42, 0.18, 0, 0, { material: M.marble });

// Single accent armchair
box(520, 880, 546, 905, 0.55, C.sage, 0, { material: M.sofa });

// Gallery Art Wall
wallArt(269, 780, 272, 830, 0.8, 1.2, 'warm');
wallArt(269, 845, 272, 895, 0.8, 1.2, 'slate');
light(300, 840, 1.8, 0.5, 3.5);

// Dining Set: 6-seater solid wood table with upholstered chairs
box(405, 592, 515, 656, 0.74, 0, 0, { material: M.wood });
for (const [cx, cy] of [[428, 578], [460, 578], [492, 578], [428, 670], [460, 670], [492, 670], [388, 624], [532, 624]]) {
  cyl(cx, cy, 0.45, 0.15, C.sage, 0, { material: M.sofa });
}
// Dining chandelier pendant
sphere(460, 624, 2.1, 0.14, C.brass);
light(460, 624, 2.0, 0.75, 4.5);

// Potted indoor trees & plants
pottedPlant(663, 805, 0.14, 0.8);
pottedPlant(525, 955, 0.12, 0.65);

// ----------------------------------------------------------------------------
// 5. KITCHEN & UTILITY SUITE
// ----------------------------------------------------------------------------
const KX0 = 104, KX1 = 146;
const clearMat = (c, o) => new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: o, roughness: 0.15 });

// Base Cabinets & Quartz Worktop
box(KX0, 658, KX1, 852, 0.85, C.greige);
box(KX0, 658, KX1 + 2, 852, 0.04, 0, 0.85, { material: M.marble });

// Wash Set & Utility (Washer-Dryer Tower + Pull-out MOAP Pantry)
const oak = 0xb48a5a, oakD = 0x8f6b45, graphite = 0x3e4247, TX = 154;

const wmRing = (y, e, r) => {
  const g = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 32), M.chrome);
  g.rotation.z = Math.PI / 2; g.position.set(X(TX) + 0.012, e, Z(y)); root.add(g);
  const gl = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.78, r * 0.78, 0.034, 32), mat(0x15181b, { roughness: 0.1 }));
  gl.rotation.z = Math.PI / 2; gl.position.set(X(TX) + 0.014, e, Z(y)); root.add(gl);
};

box(KX0, 572, TX, 614, 0.7, graphite, 0.15);
box(KX0, 572, TX, 614, 0.7, graphite, 0.85);
wmRing(593, 0.5, 0.2); wmRing(593, 1.2, 0.2);
box(TX, 576, TX + 1, 610, 0.07, 0x15181b, 0.78, { noShadow: true });
box(TX, 576, TX + 1, 610, 0.07, 0x15181b, 1.48, { noShadow: true });
fluted(TX, 572, TX + 2, 614, 0.15, oak, true, 0, 'wood');
box(KX0, 572, TX, 614, 0.6, oakD, 1.57);
fluted(TX, 572, TX + 2, 614, 0.6, oak, true, 1.57, 'wood');
box(TX + 2.5, 606, TX + 3.5, 609, 0.4, 0, 1.67, { material: M.brass, noShadow: true });

// Pull-out cleaning / MOAP cabinet
box(KX0, 616, KX0 + 3, 658, 2.17, oakD);
box(KX0, 616, TX, 618, 2.17, oakD);
box(KX0, 656, TX, 658, 2.17, oakD);
box(KX0, 616, TX, 658, 0.05, oakD, 2.12);
box(130, 618, 180, 619.5, 2.0, oakD, 0.05);
box(130, 654.5, 180, 656, 2.0, oakD, 0.05);
box(130, 619, 132, 655, 2.0, oakD, 0.05);
box(TX - 2, 656, 182, 658, 2.0, oak, 0.05);
fluted(TX - 2, 658, 182, 660, 2.0, oak, false, 0.05, 'wood');
box(TX, 660, TX + 2, 661.5, 0.9, 0, 0.7, { material: M.brass, noShadow: true });

[0.25, 0.7, 1.1, 1.5, 1.88].forEach((e) => {
  box(132, 619.5, 179, 654.5, 0.03, 0xd9cdb8, e);
  box(133, 620.5, 178, 653.5, 0.01, 0, e - 0.012, { material: M.ledWarm, noShadow: true });
});

[[640, 0x4a3426], [645, 0x4a3426], [650, 0x7a5a3a], [634, 0x4a3426]].forEach(([y, c]) => cyl(145, y, 0.22, 0.016, c, 1.91));
box(138, 624, 168, 640, 0.1, 0xe8dcc6, 1.53);
box(138, 644, 168, 652, 0.1, 0xe8dcc6, 1.53);
cyl(150, 636, 0.26, 0.055, 0xc7b290, 0.28);
cyl(150, 647, 0.18, 0.02, 0xc7b290, 0.73);
for (const y of [626, 632, 638, 644, 650]) cyl(134, y, 0.7, 0.008, 0xb99a6a, 0.75);
light(190, 620, 1.9, 0.7, 3.8);

// Kitchen Sink & Tap
box(KX0 + 4, 664, KX1 - 6, 690, 0.02, 0, 0.89, { material: M.chrome, noShadow: true });
for (let y = 692; y < 712; y += 4) box(KX0 + 4, y, KX1 - 6, y + 1.5, 0.02, 0, 0.89, { material: M.chrome, noShadow: true });
cyl(KX0 + 8, 677, 0.3, 0.02, 0, 0.89, { material: M.chrome });

// Glass-top 3-burner hob
box(KX0 + 6, 762, KX1 - 6, 818, 0.015, 0x1c1c1c, 0.89, { noShadow: true });
cyl(122, 776, 0.012, 0.07, 0x333333, 0.9);
cyl(122, 804, 0.012, 0.07, 0x333333, 0.9);
cyl(134, 790, 0.012, 0.06, 0x333333, 0.9);

// Dishwasher provision bay
box(KX1, 718, KX1 + 1.5, 756, 0.72, 0, 0.06, { material: clearMat(0x6fa8dc, 0.55), noShadow: true });

// Wall cabinets & under-cabinet LED strip
box(KX0, 658, 132, 852, 0.65, C.greige, 1.5);
box(132, 806, 134, 852, 0.55, 0, 1.55, { material: clearMat(0xbfd9e6, 0.45), noShadow: true });
box(KX0, 658, 132, 852, 0.015, 0, 1.485, { material: M.ledWarm, noShadow: true }); // Under-cabinet lighting strip
box(KX0, 577, 132, 852, 0.55, C.cream, 2.15); // Loft

// Fridge Wall (Elevation B)
box(190, 850, 238, 890, 1.9, 0, 0, { material: M.chrome }); // Stainless steel fridge
box(194, 848.5, 196, 850, 0.45, 0, 1.15, { material: M.dark, noShadow: true });
box(194, 848.5, 196, 850, 0.3, 0, 0.55, { material: M.dark, noShadow: true });
box(238, 850, 252, 890, 2.0, C.cream);
box(188, 850, 252, 890, 0.65, C.cream, 2.05);
box(148, 850, 188, 890, 0.85, C.greige);
box(148, 852, 188, 890, 0.7, C.greige, 0.85);
box(152, 849.5, 184, 852, 0.5, 0x222224, 0.95, { noShadow: true }); // Built-in wall oven
box(148, 850, 188, 890, 0.5, C.greige, 1.55);
box(148, 850, 188, 890, 0.65, C.cream, 2.05);
box(130, 850, 145, 890, 0.7, C.greige, 1.35);
box(130, 848.5, 145, 850, 0.64, 0, 1.38, { material: clearMat(0xbfd9e6, 0.4), noShadow: true });
box(107, 850, 130, 890, 0.7, C.cream, 1.35);
box(104, 850, 146, 890, 0.04, 0, 0.85, { material: M.marble });
box(107, 850, 145, 890, 0.85, C.cream);
for (let i = 0; i < 11; i++) box(107, 848.2, 145, 850, 0.062, 0xe2d4bb, 0.02 + i * 0.075, { noShadow: true });
box(104, 850, 146, 890, 0.55, C.cream, 2.15);

light(150, 700, 2.4, 0.6, 5);
light(200, 800, 2.3, 0.6, 4.5);

// ----------------------------------------------------------------------------
// 6. BATHROOMS & FOYER
// ----------------------------------------------------------------------------
const wc = (x, y) => { box(x - 7, y - 10, x + 7, y + 10, 0.4, C.white); };
wc(995, 420); box(960, 480, 1050, 500, 0.85, 0, 0, { material: M.marble });
wc(985, 560); box(920, 600, 1050, 622, 0.85, 0, 0, { material: M.marble });
wc(380, 450); box(345, 380, 420, 398, 0.85, 0, 0, { material: M.marble });
box(272, 520, 304, 560, 0.85, 0, 0, { material: M.marble }); // Dining basin nook
box(20, 880, 80, 925, 1.05, 0, 0, { material: M.wood });     // Entrance shoe console
box(20, 880, 80, 925, 0.04, 0, 1.05, { material: M.marble });

// Ground backdrop plane
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(160, 160),
  new THREE.MeshStandardMaterial({ color: 0xedebe5, roughness: 0.9 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.set(X(580), -0.06, Z(550));
ground.receiveShadow = true;
scene.add(ground);

// ============================================================================
// LIGHTING RIG & ENVIRONMENT
// ============================================================================
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xe2d6c3, 1.4);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xfff3e0, 1.1);
sun.position.set(X(450), 22, Z(250));
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.bias = -0.0001;
sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 0.5, far: 45 });
sun.target.position.set(X(580), 0, Z(550));
scene.add(sun, sun.target);

// Lighting Presets Configuration
const LIGHTING_MODES = {
  day: {
    bg: 0xf1efe9,
    hemi: { sky: 0xffffff, ground: 0xe2d6c3, int: 1.4 },
    sun: { color: 0xfff3e0, int: 1.1, pos: [X(450), 22, Z(250)] },
    interiorMult: 0.6,
    exposure: 1.05
  },
  sunset: {
    bg: 0xecd9c6,
    hemi: { sky: 0xffd1a4, ground: 0x8a6245, int: 1.0 },
    sun: { color: 0xff8c42, int: 1.3, pos: [X(900), 8, Z(600)] },
    interiorMult: 1.2,
    exposure: 1.15
  },
  night: {
    bg: 0x0f1118,
    hemi: { sky: 0x182236, ground: 0x0a0d14, int: 0.35 },
    sun: { color: 0x3a5585, int: 0.2, pos: [X(450), 18, Z(250)] },
    interiorMult: 2.2,
    exposure: 1.25
  }
};

let currentLightingMode = 'day';
function setLightingMode(mode) {
  const cfg = LIGHTING_MODES[mode] || LIGHTING_MODES.day;
  currentLightingMode = mode;
  scene.background.setHex(cfg.bg);
  hemiLight.color.setHex(cfg.hemi.sky);
  hemiLight.groundColor.setHex(cfg.hemi.ground);
  hemiLight.intensity = cfg.hemi.int;

  sun.color.setHex(cfg.sun.color);
  sun.intensity = cfg.sun.int;
  sun.position.set(...cfg.sun.pos);

  renderer.toneMappingExposure = cfg.exposure;

  interiorLights.forEach(({ light, baseIntensity }) => {
    light.intensity = baseIntensity * cfg.interiorMult;
  });

  document.querySelectorAll('[data-lighting]').forEach((b) => {
    b.classList.toggle('active', b.dataset.lighting === mode);
  });
}

// ============================================================================
// RENDERER & CAMERA SETUP
// ============================================================================
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxPolarAngle = Math.PI / 2.02;

// ============================================================================
// CAMERA VIEWS & PRESETS
// ============================================================================
const VIEWS = {
  dollhouse: { orbit: { c: [X(590), 0.3, Z(555)], d: 22, az: -22, el: 58 }, title: 'Dollhouse Overview', desc: 'Complete 3D perspective of the 3BHK flat layout.' },
  top:       { orbit: { c: [X(590), 0, Z(560)], d: 21.5, az: 0, el: 89 }, title: 'Architectural Top View', desc: 'Direct orthographic plan view tracing.' },
  foyer:     { p: P(200, 940, 1.8), t: P(420, 850, 1.2), room: [200, 920], fov: 65, title: 'Entrance Foyer', desc: 'Welcoming entrance with shoe console and corridor to living.' },
  living:    { p: P(520, 1060, 6.6), t: P(690, 820, 0.4), room: [700, 860], fov: 60, title: 'Living Lounge', desc: 'L-shaped sectional sofa facing fluted walnut TV console.' },
  dining:    { p: P(640, 700, 6.4), t: P(430, 600, 0.3), room: [450, 610], fov: 58, title: 'Dining Area', desc: '6-seater wooden dining table with pendant lighting.' },
  kitchen:   { p: P(330, 735, 5.6), t: P(140, 735, 0.9), fov: 52, title: 'Kitchen: Counter Run', desc: 'Quartz countertop, 3-burner hob, sink and dishwasher bay.' },
  kitchenW:  { p: P(245, 598, 2.3), t: P(130, 625, 1.0), fov: 70, title: 'Kitchen: Wash & Utility', desc: 'Stacked washer-dryer tower and pull-out MOAP pantry.' },
  kitchenB:  { p: P(205, 590, 4.4), t: P(190, 868, 1.0), room: [180, 760], fov: 54, title: 'Kitchen: Fridge & Oven Wall', desc: 'Stainless fridge, built-in oven tower, glass-door display.' },
  master:    { p: P(930, 560, 6.2), t: P(775, 340, 0.4), room: [780, 368], fov: 58, title: 'Master Bedroom', desc: 'Queen bed, fluted walnut headboard and bedside lights.' },
  masterB:   { p: P(745, 300, 4.0), t: P(915, 466, 1.4), room: [780, 368], fov: 56, title: 'Master: Vanity & Mirror', desc: 'Floating dressing table, backlit oval LED mirror & niche.' },
  guest:     { p: P(960, 800, 6.2), t: P(760, 600, 0.4), room: [755, 637], fov: 58, title: 'Guest Bedroom', desc: 'Warm minimalist guest suite with 4-door wardrobe.' },
  bedroom1:  { p: P(690, 410, 6.2), t: P(470, 215, 0.4), room: [480, 232], fov: 58, title: 'Bedroom 1 & Study', desc: 'Bed with sage accent wall, study desk and custom shelving.' },
};

// ============================================================================
// CAMERA ANIMATION & TRANSITION SYSTEM
// ============================================================================
const animState = {
  active: false,
  startTime: 0,
  duration: 1.5,
  startPos: new THREE.Vector3(),
  endPos: new THREE.Vector3(),
  startTarget: new THREE.Vector3(),
  endTarget: new THREE.Vector3(),
  startFov: 40,
  endFov: 40,
  viewName: 'dollhouse'
};

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateWallVisibility(viewName) {
  const v = VIEWS[viewName];
  if (!v) return;
  const rc = v.room ? new THREE.Vector2(X(v.room[0]), Z(v.room[1])) : null;
  const dir = rc ? new THREE.Vector2(camera.position.x - rc.x, camera.position.z - rc.y).normalize() : null;
  const near = (m) => {
    const d = new THREE.Vector2(m.position.x - rc.x, m.position.z - rc.y);
    return d.dot(dir) > 0.3;
  };
  wallMeshes.forEach((w) => {
    const low = !rc || near(w);
    w.scale.y = low ? 0.35 / WALL_H : 1;
    w.position.y = low ? 0.175 : WALL_H / 2;
  });
  tallMeshes.forEach((m) => {
    m.visible = !(rc && near(m));
  });
}

function getCameraConfigForView(name) {
  const v = VIEWS[name];
  if (!v) return null;
  let target, pos;
  if (v.orbit) {
    const o = v.orbit, az = THREE.MathUtils.degToRad(o.az), el = THREE.MathUtils.degToRad(o.el);
    target = new THREE.Vector3(...o.c);
    pos = new THREE.Vector3(
      target.x + o.d * Math.cos(el) * Math.sin(az),
      target.y + o.d * Math.sin(el),
      target.z + o.d * Math.cos(el) * Math.cos(az)
    );
  } else {
    target = v.t.clone();
    pos = v.p.clone();
  }
  return { pos, target, fov: v.fov || 40 };
}

function setView(name, smooth = true) {
  const cfg = getCameraConfigForView(name);
  if (!cfg) return;

  window.__view = name;
  updateHUDInfo(name);

  // Update button active state
  document.querySelectorAll('[data-view]').forEach((b) => {
    b.classList.toggle('active', b.dataset.view === name);
  });

  if (!smooth) {
    camera.position.copy(cfg.pos);
    controls.target.copy(cfg.target);
    camera.fov = cfg.fov;
    camera.updateProjectionMatrix();
    controls.update();
    updateWallVisibility(name);
    return;
  }

  // Initiate smooth cinematic transition
  animState.active = true;
  animState.startTime = performance.now();
  animState.duration = 1.4;
  animState.startPos.copy(camera.position);
  animState.endPos.copy(cfg.pos);
  animState.startTarget.copy(controls.target);
  animState.endTarget.copy(cfg.target);
  animState.startFov = camera.fov;
  animState.endFov = cfg.fov;
  animState.viewName = name;
}
window.setView = setView;

// ============================================================================
// CINEMATIC AUTOMATED TOUR SYSTEM
// ============================================================================
const TOUR_STOPS = [
  'dollhouse',
  'foyer',
  'living',
  'dining',
  'kitchen',
  'kitchenW',
  'kitchenB',
  'master',
  'masterB',
  'guest',
  'bedroom1',
  'dollhouse'
];

const tourState = {
  running: false,
  currentIndex: 0,
  stepTimer: null,
  dwellTime: 4000,
  speed: 1.0,
  orbiting: false
};

function startTour() {
  tourState.running = true;
  tourState.currentIndex = 0;
  updateTourUI();
  playTourStep();
}

function pauseTour() {
  tourState.running = false;
  if (tourState.stepTimer) clearTimeout(tourState.stepTimer);
  updateTourUI();
}

function toggleTour() {
  if (tourState.running) pauseTour();
  else startTour();
}

function playTourStep() {
  if (!tourState.running) return;
  const viewName = TOUR_STOPS[tourState.currentIndex];
  setView(viewName, true);
  updateTourProgress();

  const adjustedDwell = (tourState.dwellTime / tourState.speed);
  tourState.stepTimer = setTimeout(() => {
    if (!tourState.running) return;
    tourState.currentIndex = (tourState.currentIndex + 1) % TOUR_STOPS.length;
    playTourStep();
  }, adjustedDwell + 1500);
}

function nextTourStep() {
  tourState.currentIndex = (tourState.currentIndex + 1) % TOUR_STOPS.length;
  setView(TOUR_STOPS[tourState.currentIndex], true);
  updateTourProgress();
}

function prevTourStep() {
  tourState.currentIndex = (tourState.currentIndex - 1 + TOUR_STOPS.length) % TOUR_STOPS.length;
  setView(TOUR_STOPS[tourState.currentIndex], true);
  updateTourProgress();
}

function toggleAutoOrbit() {
  tourState.orbiting = !tourState.orbiting;
  controls.autoRotate = tourState.orbiting;
  controls.autoRotateSpeed = 1.2 * tourState.speed;
  const btn = document.getElementById('btn-orbit');
  if (btn) btn.classList.toggle('active', tourState.orbiting);
}

// ============================================================================
// UI & HUD MANAGEMENT
// ============================================================================
function updateHUDInfo(viewName) {
  const v = VIEWS[viewName];
  if (!v) return;
  const titleEl = document.getElementById('hud-title');
  const descEl = document.getElementById('hud-desc');
  const miniRoomEl = document.getElementById('mini-room-name');
  if (titleEl) titleEl.innerText = v.title || '3D Concept Viewer';
  if (descEl) descEl.innerText = v.desc || '';
  if (miniRoomEl) miniRoomEl.innerText = v.title?.split(' ')[0] || viewName;
}

function toggleHUD(forceState) {
  const hud = document.getElementById('hud');
  const toggleBtn = document.getElementById('btn-toggle-hud');
  if (!hud) return;
  const isMin = typeof forceState === 'boolean' ? forceState : !hud.classList.contains('minimized');
  hud.classList.toggle('minimized', isMin);
  if (toggleBtn) {
    toggleBtn.innerText = isMin ? '+' : '−';
    toggleBtn.title = isMin ? 'Expand Menu (M)' : 'Minimize Menu (M)';
  }
}

function updateTourUI() {
  const playBtn = document.getElementById('btn-play-tour');
  const miniPlayBtn = document.getElementById('btn-mini-play');
  if (playBtn) {
    playBtn.innerHTML = tourState.running ? '⏸ Pause Tour' : '▶ Play Cinematic Tour';
    playBtn.classList.toggle('active', tourState.running);
  }
  if (miniPlayBtn) {
    miniPlayBtn.innerHTML = tourState.running ? '⏸' : '▶ Tour';
    miniPlayBtn.classList.toggle('active', tourState.running);
  }
}

function updateTourProgress() {
  const bar = document.getElementById('tour-progress-bar');
  const counter = document.getElementById('tour-step-counter');
  if (bar) {
    const pct = ((tourState.currentIndex + 1) / TOUR_STOPS.length) * 100;
    bar.style.width = `${pct}%`;
  }
  if (counter) {
    counter.innerText = `${tourState.currentIndex + 1} / ${TOUR_STOPS.length}`;
  }
}

function captureScreenshot() {
  // Hide HUD briefly, render at full quality, and trigger download
  renderer.render(scene, camera);
  const dataURL = renderer.domElement.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `Vyttila_3D_${window.__view || 'view'}.png`;
  link.href = dataURL;
  link.click();
}

// URL Params & Initialization
const q = new URLSearchParams(location.search).get('view');
setView(q || 'dollhouse', false);

// Event Listeners
document.querySelectorAll('[data-view]').forEach((b) => {
  b.addEventListener('click', () => {
    if (tourState.running) pauseTour();
    setView(b.dataset.view, true);
  });
});

document.querySelectorAll('[data-lighting]').forEach((b) => {
  b.addEventListener('click', () => setLightingMode(b.dataset.lighting));
});

document.getElementById('btn-play-tour')?.addEventListener('click', toggleTour);
document.getElementById('btn-mini-play')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleTour();
});
document.getElementById('btn-next-step')?.addEventListener('click', nextTourStep);
document.getElementById('btn-prev-step')?.addEventListener('click', prevTourStep);
document.getElementById('btn-orbit')?.addEventListener('click', toggleAutoOrbit);
document.getElementById('btn-snap')?.addEventListener('click', captureScreenshot);
document.getElementById('btn-toggle-hud')?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleHUD();
});
document.getElementById('hud')?.addEventListener('click', (e) => {
  const hud = document.getElementById('hud');
  if (hud && hud.classList.contains('minimized')) {
    toggleHUD(false);
  }
});

const speedSelect = document.getElementById('speed-select');
if (speedSelect) {
  speedSelect.addEventListener('change', (e) => {
    tourState.speed = parseFloat(e.target.value);
    controls.autoRotateSpeed = 1.2 * tourState.speed;
  });
}

// Keyboard shortcuts
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM' || e.code === 'KeyH') {
    toggleHUD();
  } else if (e.code === 'Space') {
    e.preventDefault();
    toggleTour();
  } else if (e.code === 'ArrowRight') {
    nextTourStep();
  } else if (e.code === 'ArrowLeft') {
    prevTourStep();
  } else if (e.code === 'KeyO') {
    toggleAutoOrbit();
  } else if (e.code === 'Digit1') {
    setLightingMode('day');
  } else if (e.code === 'Digit2') {
    setLightingMode('sunset');
  } else if (e.code === 'Digit3') {
    setLightingMode('night');
  }
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ============================================================================
// MAIN RENDER LOOP
// ============================================================================
function animate() {
  requestAnimationFrame(animate);

  // Smooth camera interpolation
  if (animState.active) {
    const elapsed = (performance.now() - animState.startTime) / 1000;
    const t = Math.min(elapsed / animState.duration, 1.0);
    const ease = easeInOutCubic(t);

    camera.position.lerpVectors(animState.startPos, animState.endPos, ease);
    controls.target.lerpVectors(animState.startTarget, animState.endTarget, ease);
    camera.fov = THREE.MathUtils.lerp(animState.startFov, animState.endFov, ease);
    camera.updateProjectionMatrix();

    if (t >= 1.0) {
      animState.active = false;
      updateWallVisibility(animState.viewName);
    }
  }

  controls.update();
  renderer.render(scene, camera);
  window.__ready = true;
}

animate();
