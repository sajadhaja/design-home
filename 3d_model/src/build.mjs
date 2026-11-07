import { build } from 'esbuild';
import fs from 'fs';

const r = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  minify: true,
  write: false,
  format: 'iife',
  loader: { '.json': 'json' }
});

const js = r.outputFiles[0].text.replace(/<\/script>/g, '<\\/script>');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Vyttila Flat — Photorealistic 3D Concept & Cinematic Tour</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      height: 100%;
      overflow: hidden;
      background: #0f1117;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2328;
      user-select: none;
    }

    /* Glassmorphism Floating UI */
    #hud {
      position: fixed;
      top: 14px;
      left: 14px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(229, 231, 235, 0.9);
      border-radius: 12px;
      padding: 14px 16px;
      font-size: 13px;
      color: #1f2328;
      max-width: 380px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05);
      transition: transform 0.2s ease, opacity 0.2s ease;
      z-index: 100;
      max-height: calc(100vh - 28px);
      overflow-y: auto;
    }

    .brand-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .brand-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.2px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge-live {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      background: #e0f2fe;
      color: #0369a1;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    /* Active Room Card */
    .room-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 12px;
    }
    .room-title {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 2px;
    }
    .room-desc {
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.4;
      margin: 0;
    }

    /* Cinematic Tour Controller */
    .tour-box {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      color: #fff;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .tour-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .tour-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #94a3b8;
    }
    .tour-counter {
      font-size: 11px;
      font-weight: 600;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.15);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .progress-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .progress-fill {
      width: 8%;
      height: 100%;
      background: #38bdf8;
      border-radius: 2px;
      transition: width 0.4s ease;
    }
    .tour-controls {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .btn-tour-play {
      flex: 1;
      background: #0284c7;
      color: #fff;
      border: none;
      padding: 7px 12px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: background 0.15s ease;
    }
    .btn-tour-play:hover { background: #0369a1; }
    .btn-tour-play.active { background: #e11d48; }
    .btn-tour-icon {
      background: rgba(255, 255, 255, 0.1);
      color: #f1f5f9;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 7px 10px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.15s ease;
    }
    .btn-tour-icon:hover { background: rgba(255, 255, 255, 0.2); }
    .tour-speed-select {
      background: rgba(255, 255, 255, 0.1);
      color: #f1f5f9;
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 6px 4px;
      border-radius: 6px;
      font-size: 11px;
      cursor: pointer;
      outline: none;
    }
    .tour-speed-select option { background: #0f172a; color: #fff; }

    /* Lighting Mode Tabs */
    .section-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin: 10px 0 6px;
    }
    .lighting-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 4px;
      margin-bottom: 12px;
    }
    .btn-lighting {
      padding: 6px 4px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
    }
    .btn-lighting:hover { background: #f1f5f9; border-color: #94a3b8; }
    .btn-lighting.active {
      background: #0f172a;
      color: #fff;
      border-color: #0f172a;
      font-weight: 600;
    }

    /* Room Views Grid */
    .views-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 12px;
    }
    .views-grid button {
      padding: 5px 9px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11.5px;
      font-weight: 500;
      transition: all 0.15s ease;
    }
    .views-grid button:hover {
      background: #e2e8f0;
      border-color: #94a3b8;
    }
    .views-grid button.active {
      background: #0284c7;
      color: #fff;
      border-color: #0284c7;
      font-weight: 600;
    }

    /* Action bar */
    .action-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 8px;
    }
    .btn-action {
      padding: 6px 10px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      transition: all 0.15s ease;
    }
    .btn-action:hover { background: #e2e8f0; }
    .btn-action.active {
      background: #0f172a;
      color: #fff;
      border-color: #0f172a;
    }

    .help-hint {
      margin: 10px 0 0;
      color: #64748b;
      font-size: 11px;
      line-height: 1.4;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
    }

    /* Keyboard shortcuts badge */
    .kbd {
      display: inline-block;
      padding: 1px 4px;
      font-size: 10px;
      font-weight: 600;
      color: #475569;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div id="hud">
    <div class="brand-header">
      <div class="brand-title">
        <span>🏢 Vyttila Flat</span>
        <span class="badge-live">3D Realistic</span>
      </div>
    </div>

    <!-- Active Room / Perspective Info Card -->
    <div class="room-card">
      <div class="room-title" id="hud-title">Dollhouse Overview</div>
      <p class="room-desc" id="hud-desc">Complete 3D perspective of the 3BHK flat layout with realistic lighting, textures and furniture.</p>
    </div>

    <!-- Cinematic Auto-Tour Controller -->
    <div class="tour-box">
      <div class="tour-top">
        <span class="tour-label">🎬 Cinematic Walkthrough</span>
        <span class="tour-counter" id="tour-step-counter">1 / 12</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" id="tour-progress-bar"></div>
      </div>
      <div class="tour-controls">
        <button class="btn-tour-icon" id="btn-prev-step" title="Previous Room">⏮</button>
        <button class="btn-tour-play" id="btn-play-tour">▶ Play Tour</button>
        <button class="btn-tour-icon" id="btn-next-step" title="Next Room">⏭</button>
        <select class="tour-speed-select" id="speed-select" title="Tour Speed">
          <option value="0.75">0.75x</option>
          <option value="1.0" selected>1.0x</option>
          <option value="1.5">1.5x</option>
          <option value="2.0">2.0x</option>
        </select>
      </div>
    </div>

    <!-- Lighting Preset Modes -->
    <div class="section-label">💡 Lighting & Atmosphere</div>
    <div class="lighting-grid">
      <button class="btn-lighting active" data-lighting="day">☀️ Daylight</button>
      <button class="btn-lighting" data-lighting="sunset">🌅 Sunset</button>
      <button class="btn-lighting" data-lighting="night">🌙 Night Lux</button>
    </div>

    <!-- Room Perspectives -->
    <div class="section-label">📍 Camera Views & Rooms</div>
    <div class="views-grid">
      <button data-view="dollhouse" class="active">Dollhouse</button>
      <button data-view="top">Top View</button>
      <button data-view="foyer">Foyer</button>
      <button data-view="living">Living Lounge</button>
      <button data-view="dining">Dining</button>
      <button data-view="kitchen">Kitchen Counter</button>
      <button data-view="kitchenW">Wash & Utility</button>
      <button data-view="kitchenB">Fridge & Oven Wall</button>
      <button data-view="master">Master Bedroom</button>
      <button data-view="masterB">Master Vanity</button>
      <button data-view="guest">Guest Bedroom</button>
      <button data-view="bedroom1">Bedroom 1 & Study</button>
    </div>

    <!-- Quick Tools -->
    <div class="action-grid">
      <button class="btn-action" id="btn-orbit">🔄 360° Auto-Orbit</button>
      <button class="btn-action" id="btn-snap">📸 Snapshot</button>
    </div>

    <p class="help-hint">
      <strong>Controls:</strong> Left-drag to rotate • Scroll to zoom • Right-drag to pan.<br>
      <strong>Hotkeys:</strong> <span class="kbd">Space</span> Play/Pause • <span class="kbd">←</span> <span class="kbd">→</span> Prev/Next • <span class="kbd">O</span> Orbit • <span class="kbd">1</span> <span class="kbd">2</span> <span class="kbd">3</span> Lighting
    </p>
  </div>

  <script>${js}</script>
</body>
</html>`;

const outPath = process.argv[2] || 'Vyttila_3D_Viewer.html';
fs.writeFileSync(outPath, html);
console.log('Successfully generated', outPath, 'Bytes:', html.length);
