import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ── SVG HELPERS ─────────────────────────────────────────────────── */
const G = '#C9A84C';
const W = '#F0EFE9';
const GR = '#8A8A96';
const WALL = '#D0D0D8';
const BG_FLOOR = '#2A2A35';

function floorPlan(rooms, doors, labels, entries, vw=200, vh=150) {
  const svgRooms = rooms.map(([x,y,w,h,fill]) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill||BG_FLOOR}" stroke="${WALL}" stroke-width="2" rx="1"/>`
  ).join('\n    ');
  const svgDoors = doors.map(([x,y,sw,open,rot]) => {
    const r = rot||0;
    return `<g transform="translate(${x},${y}) rotate(${r},0,0)">
      <line x1="0" y1="0" x2="0" y2="${sw}" stroke="${G}" stroke-width="1.5"/>
      <path d="M0,0 A${sw},${sw} 0 0,1 ${sw},0" fill="none" stroke="${G}" stroke-width="1" stroke-dasharray="2,1" opacity="0.7"/>
    </g>`;
  }).join('\n    ');
  const svgLabels = labels.map(([x,y,txt,fs]) =>
    `<text x="${x}" y="${y}" fill="${W}" font-size="${fs||7}" font-family="Helvetica,Arial" text-anchor="middle" opacity="0.85">${txt}</text>`
  ).join('\n    ');
  const svgEntries = entries.map(([x,y,dx,dy,lbl]) => {
    const len=14;
    const ex = x+dx*len, ey = y+dy*len;
    return `<line x1="${x}" y1="${y}" x2="${ex}" y2="${ey}" stroke="${G}" stroke-width="2" marker-end="url(#arr)"/>
    <text x="${ex+(dx*6)}" y="${ey+(dy*6)+2}" fill="${G}" font-size="6" font-family="Helvetica,Arial" text-anchor="middle">${lbl}</text>`;
  }).join('\n    ');
  return `<svg viewBox="0 0 ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
  <defs>
    <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6 Z" fill="${G}"/>
    </marker>
  </defs>
  <rect width="${vw}" height="${vh}" fill="#16161B" rx="3"/>
  <!-- grid -->
  ${Array.from({length:Math.floor(vw/10)+1},(_,i)=>`<line x1="${i*10}" y1="0" x2="${i*10}" y2="${vh}" stroke="rgba(201,168,76,0.06)" stroke-width="0.5"/>`).join('')}
  ${Array.from({length:Math.floor(vh/10)+1},(_,i)=>`<line x1="0" y1="${i*10}" x2="${vw}" y2="${i*10}" stroke="rgba(201,168,76,0.06)" stroke-width="0.5"/>`).join('')}
  ${svgRooms}
  ${svgDoors}
  ${svgEntries}
  ${svgLabels}
  <!-- Compass -->
  <g transform="translate(${vw-14},12)">
    <circle cx="0" cy="0" r="8" fill="rgba(17,17,20,0.8)" stroke="${G}" stroke-width="0.8"/>
    <text x="0" y="-10" fill="${G}" font-size="5" font-family="Helvetica" text-anchor="middle" font-weight="bold">N</text>
    <line x1="0" y1="-6" x2="0" y2="6" stroke="${WALL}" stroke-width="0.8"/>
    <line x1="-6" y1="0" x2="6" y2="0" stroke="${WALL}" stroke-width="0.8"/>
    <polygon points="0,-6 -2.5,0 0,-2 2.5,0" fill="${G}"/>
  </g>
</svg>`;
}

// ── FLOOR PLAN DATA ─────────────────────────────────────────────────
const fpPM = floorPlan(
  // rooms [x,y,w,h]
  [
    [10,10,50,40], [10,55,50,25], [10,85,50,50],
    [65,10,30,125], [100,10,90,50], [100,65,90,70]
  ],
  // doors [x,y,sw,_,rot]
  [[60,30,10,0,0],[60,68,10,0,0],[63,10,10,0,90],[100,36,10,0,90],[100,80,10,0,90]],
  // labels
  [
    [35,34,'SALLE PRINCIPALE',7],[35,68,'COULOIR',7],[35,113,'ZONE ATTENTE',7],
    [80,36,'ESCALIER',7],[145,36,'PIÈCE N°1',7],[145,102,'PIÈCE N°2',7]
  ],
  // entries [x,y,dx,dy,label]
  [[10,52,0,-1,'ENTRÉE A'],[190,85,1,0,'ENTRÉE B']],
  200,140
);

const fpGN = floorPlan(
  [
    [10,10,80,35],[10,50,35,35],[10,90,35,45],[50,50,40,85],
    [95,10,95,55],[95,70,40,65],[140,70,50,65]
  ],
  [[90,28,10,0,0],[45,50,10,0,90],[47,90,10,0,0],[95,45,10,0,90],[135,80,10,0,0]],
  [
    [50,30,'SALLE DE BRIEFING',7],[27,69,'ACCÈS',6],[27,114,'STOCKAGE',6],
    [69,95,'ESCALIER',6],[142,38,'ZONE OPS PRINCIPALE',7],[114,103,'SECTORISATION',7],[164,103,'NEUTRALISATION',7]
  ],
  [[10,75,0,1,'ALPHA'],[190,40,-1,0,'BRAVO'],[100,135,0,1,'DELTA']],
  200,145
);

const fpCDO = floorPlan(
  [
    [5,5,40,40],[5,50,40,40],[5,95,40,45],[50,5,55,130],[110,5,85,55],[110,65,40,75],[155,65,40,75]
  ],
  [[45,25,10,0,0],[45,68,10,0,0],[45,115,10,0,0],[107,32,10,0,90],[147,72,10,0,0]],
  [
    [25,27,'ZONE 1',7],[25,71,'ZONE 2',7],[25,118,'ZONE 3',7],[77,72,'COULOIR PRINCIPAL',6],
    [152,33,'SECTOR 4',7],[129,104,'SECTOR 5',7],[174,104,'SECTOR 6',7]
  ],
  [[5,72,-1,0,'BREACH'],[190,32,1,0,'ALPHA'],[82,135,0,1,'EXFIL']],
  200,145
);

const fpARMEE = floorPlan(
  [
    [5,5,185,25],  // Périmètre extérieur (top corridor)
    [5,35,25,100], // Couloir gauche
    [175,35,25,100],[5,140,185,25], // Périmètre bas
    [35,35,55,45],[95,35,80,45],    // Zone haute
    [35,85,55,50],[95,85,80,50],    // Zone basse
    [38,38,50,40,'rgba(201,168,76,0.08)'],[98,38,74,40,'rgba(201,168,76,0.05)'],
    [38,88,50,46,'rgba(201,168,76,0.05)'],[98,88,74,46,'rgba(201,168,76,0.05)']
  ],
  [
    [30,55,10,0,90],[30,100,10,0,90],[170,55,10,0,90],[170,100,10,0,90],
    [88,55,10,0,0],[88,100,10,0,0],[92,35,10,0,0]
  ],
  [
    [62,59,'BÂTIMENT A',7],[134,59,'BÂTIMENT B',7],
    [62,110,'BÂTIMENT C',7],[134,110,'BÂTIMENT D',7],
    [97,18,'PÉRIMÈTRE NORD',7],[97,152,'PÉRIMÈTRE SUD',7]
  ],
  [[5,88,-1,0,'ALPHA'],[190,88,1,0,'BRAVO'],[97,5,0,-1,'OVERWATCH'],[97,165,0,1,'EXFIL']],
  200,170
);

/* ── MAIN HTML ───────────────────────────────────────────────────── */
const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>CRBR Solutions — Catalogue Complémentaire V2</title>
<style>
:root {
  --gold: #C9A84C; --gold-l: #E2C068; --gold-d: #9C7A2E;
  --ga10: rgba(201,168,76,0.10); --ga20: rgba(201,168,76,0.20); --ga35: rgba(201,168,76,0.35);
  --bg: #111114; --bg2: #1a1a1e; --card: #1f1f26; --card2: #16161B; --acc: #2A2A35;
  --white: #F0EFE9; --grey: #8A8A96; --grey-l: #C0C0CA; --border: rgba(201,168,76,0.18);
}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#0a0a0d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;}
.page{
  width:210mm;min-height:297mm;max-height:297mm;
  background:var(--bg);overflow:hidden;position:relative;
  page-break-after:always;display:flex;flex-direction:column;
}
.gold{color:var(--gold);}
.white{color:var(--white);}
.grey{color:var(--grey);}
.label{font-size:7pt;letter-spacing:3px;text-transform:uppercase;color:var(--gold);}
.tag{display:inline-block;background:var(--ga20);border:1px solid var(--ga35);
  color:var(--gold);font-size:6.5pt;letter-spacing:2px;padding:2px 8px;text-transform:uppercase;}
.gold-line{width:40px;height:2px;background:var(--gold);display:inline-block;}
.card{background:var(--card);border:1px solid var(--border);border-radius:3px;padding:10px 12px;}
.card-lb{background:var(--card);border-left:3px solid var(--gold);border-radius:0 3px 3px 0;padding:8px 10px;}
.sep{width:100%;height:1px;background:var(--border);margin:8px 0;}
.spec-row{display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;border-bottom:1px solid rgba(201,168,76,0.08);}
.spec-key{font-size:7pt;color:var(--grey-l);letter-spacing:0.5px;}
.spec-val{font-size:8pt;color:var(--gold);font-weight:700;}
.badge{width:28px;height:28px;border:1.5px solid var(--gold);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:8pt;font-weight:700;}
.page-num{position:absolute;bottom:6mm;right:8mm;font-size:6.5pt;color:var(--grey);letter-spacing:2px;}
.hdr{position:absolute;bottom:6mm;left:8mm;font-size:6pt;color:var(--grey);letter-spacing:1.5px;opacity:0.7;}
.entry-badge{background:rgba(201,168,76,0.12);border:1px solid var(--gold);
  border-radius:2px;padding:6px 10px;display:flex;align-items:center;gap:8px;}
</style>
</head>
<body>

<!-- ═══════════════════════════════════════════
     PAGE 1 — COUVERTURE
═══════════════════════════════════════════ -->
<div class="page" style="position:relative;">
  <img src="../img/CRBR.Couverture.png" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;" alt="">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(17,17,20,0.3) 0%,rgba(17,17,20,0.1) 40%,rgba(17,17,20,0.85) 75%,#111114 100%);z-index:1;"></div>

  <!-- Logo top right -->
  <div style="position:absolute;top:10mm;right:10mm;z-index:2;">
    <img src="../img/CRBR.Logo CRBR Solutions avec tête de loup.png" style="height:14mm;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.8));" alt="CRBR Solution">
  </div>

  <!-- Top label -->
  <div style="position:absolute;top:10mm;left:12mm;z-index:2;">
    <span class="tag">Document Commercial Confidentiel</span>
  </div>

  <!-- Bottom content -->
  <div style="position:absolute;bottom:0;left:0;right:0;padding:12mm 14mm 14mm;z-index:2;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
      <div class="gold-line"></div>
      <span class="label" style="font-size:8pt;letter-spacing:4px;">CRBR SOLUTIONS</span>
      <div class="gold-line"></div>
    </div>
    <div style="font-size:32pt;font-weight:900;color:var(--white);text-transform:uppercase;line-height:1.05;letter-spacing:-0.5px;">
      CATALOGUE<br>COMPLÉMENTAIRE
    </div>
    <div style="font-size:11pt;color:var(--gold);margin-top:8px;font-weight:300;letter-spacing:2px;">
      Équipements · Installations · Configurations Opérationnelles
    </div>
    <div style="margin-top:16px;display:flex;gap:20px;">
      <div style="text-align:center;">
        <div style="font-size:18pt;font-weight:900;color:var(--gold);">3</div>
        <div style="font-size:6pt;color:var(--grey);letter-spacing:1.5px;text-transform:uppercase;">Gammes</div>
      </div>
      <div style="width:1px;background:var(--border);"></div>
      <div style="text-align:center;">
        <div style="font-size:18pt;font-weight:900;color:var(--gold);">4</div>
        <div style="font-size:6pt;color:var(--grey);letter-spacing:1.5px;text-transform:uppercase;">Configs Unités</div>
      </div>
      <div style="width:1px;background:var(--border);"></div>
      <div style="text-align:center;">
        <div style="font-size:18pt;font-weight:900;color:var(--gold);">Sur-mesure</div>
        <div style="font-size:6pt;color:var(--grey);letter-spacing:1.5px;text-transform:uppercase;">Clé en main</div>
      </div>
    </div>
    <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:7pt;color:var(--grey);letter-spacing:1px;">V2.0 — Édition 2026</span>
      <span style="font-size:7pt;color:var(--grey);letter-spacing:1px;">www.crbr-solution.fr</span>
    </div>
  </div>
  <span class="page-num">01</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 2 — INTRODUCTION & SOMMAIRE
═══════════════════════════════════════════ -->
<div class="page" style="padding:14mm 12mm;">
  <!-- Header bar -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10mm;">
    <div>
      <div class="label" style="margin-bottom:4px;">Catalogue Complémentaire — 2026</div>
      <div style="font-size:18pt;font-weight:900;color:var(--white);text-transform:uppercase;letter-spacing:-0.3px;">Introduction & Sommaire</div>
    </div>
    <img src="../img/CRBR.Logo CRBR Solutions avec tête de loup.png" style="height:11mm;opacity:0.9;" alt="">
  </div>
  <div style="height:1px;background:linear-gradient(90deg,var(--gold),transparent);margin-bottom:8mm;"></div>

  <!-- Intro text -->
  <div class="card-lb" style="margin-bottom:6mm;">
    <div style="font-size:11pt;font-weight:700;color:var(--white);margin-bottom:6px;">Conçu pour les professionnels du terrain.</div>
    <div style="font-size:8.5pt;color:var(--grey-l);line-height:1.6;">
      Ce catalogue présente l'ensemble des solutions complémentaires proposées par CRBR Solutions
      pour équiper, configurer et déployer vos installations d'entraînement opérationnel.
      Chaque solution est pensée à partir de retours d'expériences réels, en collaboration directe
      avec des unités de Police, Gendarmerie, forces spéciales et armées conventionnelles.
    </div>
  </div>

  <!-- 3 pillars -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8mm;">
    ${[
      ['MODULARITÉ','Reconfiguration totale en quelques heures sans outillage','◈'],
      ['RÉALISME','Standards opérationnels issus du terrain, validés par des unités actives','◉'],
      ['ÉVOLUTIVITÉ','Chaque installation grandit avec les besoins de votre unité','◆']
    ].map(([t,d,i])=>`
    <div class="card" style="text-align:center;padding:10px 8px;">
      <div style="font-size:16pt;color:var(--gold);margin-bottom:4px;">${i}</div>
      <div style="font-size:8pt;font-weight:700;color:var(--white);margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;">${t}</div>
      <div style="font-size:7pt;color:var(--grey);line-height:1.5;">${d}</div>
    </div>`).join('')}
  </div>

  <!-- Sommaire -->
  <div style="font-size:8.5pt;font-weight:700;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:5mm;">── Sommaire</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">
    ${[
      ['03','Shooting House — Gamme BASIC'],
      ['04','Shooting House — Gamme PRO'],
      ['05','Shooting House — Gamme PREMIUM'],
      ['06','Accessoires & Options'],
      ['07','Portes & Kit Effraction'],
      ['08','Structures & Équipements Tactiques'],
      ['09','Configurations PM & Gendarmerie'],
      ['10','Configurations Commando & Armée'],
      ['11','Modularité — Concept Avant/Après'],
      ['12','Contact & Commande Sur-Mesure'],
    ].map(([pg,title])=>`
    <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid rgba(201,168,76,0.08);">
      <span style="font-size:7.5pt;color:var(--gold);font-weight:700;min-width:18px;">${pg}</span>
      <span style="font-size:7.5pt;color:var(--grey-l);">${title}</span>
    </div>`).join('')}
  </div>

  <!-- Bottom strip -->
  <div style="margin-top:auto;padding-top:6mm;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:6.5pt;color:var(--grey);letter-spacing:1px;">CRBR Group SAS — 942 589 789 00018</span>
    <span style="font-size:6.5pt;color:var(--grey);">contact@crbr-group.fr · +33 (0)665 445 226</span>
  </div>
  <span class="hdr">CRBR SOLUTIONS — CATALOGUE COMPLÉMENTAIRE V2</span>
  <span class="page-num">02</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 3 — GAMME BASIC
═══════════════════════════════════════════ -->
<div class="page">
  <!-- Header strip -->
  <div style="background:var(--card2);padding:7mm 12mm 5mm;border-bottom:2px solid var(--gold);">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div class="label" style="margin-bottom:3px;">Shooting House Modulaire</div>
        <div style="font-size:22pt;font-weight:900;color:var(--white);text-transform:uppercase;letter-spacing:-0.3px;">Gamme <span style="color:var(--gold);">BASIC</span></div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:28pt;font-weight:900;color:var(--gold);line-height:1;">~40m²</div>
        <div style="font-size:7pt;color:var(--grey);text-transform:uppercase;letter-spacing:2px;">Surface type</div>
      </div>
    </div>
    <!-- Quick specs bar -->
    <div style="display:flex;gap:4mm;margin-top:4mm;">
      ${[['38–42','Panneaux'],['4–6','Portes'],['2–4','Fenêtres'],['1–2','Accès'],['≤4h','Montage']].map(([v,l])=>`
      <div style="background:var(--ga10);border:1px solid var(--border);border-radius:2px;padding:3px 8px;text-align:center;flex:1;">
        <div style="font-size:9pt;font-weight:700;color:var(--gold);">${v}</div>
        <div style="font-size:6pt;color:var(--grey);letter-spacing:1px;text-transform:uppercase;">${l}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- MAIN IMAGE -->
  <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#141418;padding:5mm;overflow:hidden;">
    <img src="../img/shooting_house_1.png" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 4px 20px rgba(0,0,0,0.6));" alt="Shooting House BASIC — 3 dispositions">
  </div>

  <!-- Bottom info strip -->
  <div style="background:var(--card2);padding:5mm 12mm;border-top:1px solid var(--border);display:flex;gap:6mm;align-items:center;">
    <div class="card-lb" style="flex:2;background:transparent;padding:4px 10px;">
      <div style="font-size:7pt;font-weight:700;color:var(--white);margin-bottom:3px;">Idéal pour</div>
      <div style="font-size:7pt;color:var(--grey);">Police Municipale · Premiers équipements · Entraînement initial CQB</div>
    </div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:7pt;color:var(--grey);margin-bottom:2px;text-transform:uppercase;letter-spacing:1px;">Délai livraison</div>
      <div style="font-size:9pt;font-weight:700;color:var(--gold);">4–6 semaines</div>
    </div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:7pt;color:var(--grey);margin-bottom:2px;text-transform:uppercase;letter-spacing:1px;">Garantie structure</div>
      <div style="font-size:9pt;font-weight:700;color:var(--gold);">5 ans</div>
    </div>
  </div>
  <span class="hdr">CRBR SOLUTIONS — CATALOGUE COMPLÉMENTAIRE V2</span>
  <span class="page-num">03</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 4 — GAMME PRO
═══════════════════════════════════════════ -->
<div class="page">
  <div style="background:var(--card2);padding:7mm 12mm 5mm;border-bottom:2px solid var(--gold);">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div class="label" style="margin-bottom:3px;">Shooting House Modulaire</div>
        <div style="font-size:22pt;font-weight:900;color:var(--white);text-transform:uppercase;">Gamme <span style="color:var(--gold);">PRO</span></div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:28pt;font-weight:900;color:var(--gold);line-height:1;">70–85m²</div>
        <div style="font-size:7pt;color:var(--grey);text-transform:uppercase;letter-spacing:2px;">Surface type</div>
      </div>
    </div>
    <div style="display:flex;gap:4mm;margin-top:4mm;">
      ${[['80–90','Panneaux'],['4–6','Portes'],['4–8','Fenêtres'],['2–3','Accès'],['6–8h','Montage']].map(([v,l])=>`
      <div style="background:var(--ga10);border:1px solid var(--border);border-radius:2px;padding:3px 8px;text-align:center;flex:1;">
        <div style="font-size:9pt;font-weight:700;color:var(--gold);">${v}</div>
        <div style="font-size:6pt;color:var(--grey);letter-spacing:1px;text-transform:uppercase;">${l}</div>
      </div>`).join('')}
    </div>
  </div>

  <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#141418;padding:5mm;overflow:hidden;">
    <img src="../img/shooting_house_2.png" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 4px 20px rgba(0,0,0,0.6));" alt="Shooting House PRO — 3 dispositions">
  </div>

  <div style="background:var(--card2);padding:5mm 12mm;border-top:1px solid var(--border);display:flex;gap:6mm;align-items:center;">
    <div class="card-lb" style="flex:2;background:transparent;padding:4px 10px;">
      <div style="font-size:7pt;font-weight:700;color:var(--white);margin-bottom:3px;">Idéal pour</div>
      <div style="font-size:7pt;color:var(--grey);">Gendarmerie Nationale · PSIG · Unités de premier rang · Scénarios complexes multi-pièces</div>
    </div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:7pt;color:var(--grey);margin-bottom:2px;text-transform:uppercase;letter-spacing:1px;">Délai livraison</div>
      <div style="font-size:9pt;font-weight:700;color:var(--gold);">6–8 semaines</div>
    </div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:7pt;color:var(--grey);margin-bottom:2px;text-transform:uppercase;letter-spacing:1px;">Garantie structure</div>
      <div style="font-size:9pt;font-weight:700;color:var(--gold);">5 ans</div>
    </div>
  </div>
  <span class="hdr">CRBR SOLUTIONS — CATALOGUE COMPLÉMENTAIRE V2</span>
  <span class="page-num">04</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 5 — GAMME PREMIUM
═══════════════════════════════════════════ -->
<div class="page">
  <div style="background:var(--card2);padding:7mm 12mm 5mm;border-bottom:2px solid var(--gold);">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div class="label" style="margin-bottom:3px;">Shooting House Modulaire</div>
        <div style="font-size:22pt;font-weight:900;color:var(--white);text-transform:uppercase;">Gamme <span style="color:var(--gold);">PREMIUM</span></div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:28pt;font-weight:900;color:var(--gold);line-height:1;">110–120m²</div>
        <div style="font-size:7pt;color:var(--grey);text-transform:uppercase;letter-spacing:2px;">Surface type</div>
      </div>
    </div>
    <div style="display:flex;gap:4mm;margin-top:4mm;">
      ${[['85–110','Panneaux'],['4–13','Portes'],['4–14','Fenêtres'],['3–5','Accès'],['1–2j','Montage']].map(([v,l])=>`
      <div style="background:var(--ga10);border:1px solid var(--border);border-radius:2px;padding:3px 8px;text-align:center;flex:1;">
        <div style="font-size:9pt;font-weight:700;color:var(--gold);">${v}</div>
        <div style="font-size:6pt;color:var(--grey);letter-spacing:1px;text-transform:uppercase;">${l}</div>
      </div>`).join('')}
    </div>
  </div>

  <div style="flex:1;display:flex;align-items:center;justify-content:center;background:#141418;padding:5mm;overflow:hidden;">
    <img src="../img/shooting_house_3.png" style="max-width:100%;max-height:100%;object-fit:contain;filter:drop-shadow(0 4px 20px rgba(0,0,0,0.6));" alt="Shooting House PREMIUM — 3 dispositions">
  </div>

  <div style="background:var(--card2);padding:5mm 12mm;border-top:1px solid var(--border);display:flex;gap:6mm;align-items:center;">
    <div class="card-lb" style="flex:2;background:transparent;padding:4px 10px;">
      <div style="font-size:7pt;font-weight:700;color:var(--white);margin-bottom:3px;">Idéal pour</div>
      <div style="font-size:7pt;color:var(--grey);">Commando Marine · Forces spéciales · Armée · Centres de formation permanents haute intensité</div>
    </div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:7pt;color:var(--grey);margin-bottom:2px;text-transform:uppercase;letter-spacing:1px;">Délai livraison</div>
      <div style="font-size:9pt;font-weight:700;color:var(--gold);">8–12 semaines</div>
    </div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:7pt;color:var(--grey);margin-bottom:2px;text-transform:uppercase;letter-spacing:1px;">Garantie structure</div>
      <div style="font-size:9pt;font-weight:700;color:var(--gold);">7 ans</div>
    </div>
  </div>
  <span class="hdr">CRBR SOLUTIONS — CATALOGUE COMPLÉMENTAIRE V2</span>
  <span class="page-num">05</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 6 — ACCESSOIRES & OPTIONS
═══════════════════════════════════════════ -->
<div class="page" style="padding:12mm;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6mm;">
    <div>
      <div class="label" style="margin-bottom:4px;">Shooting House</div>
      <div style="font-size:20pt;font-weight:900;color:var(--white);text-transform:uppercase;">Accessoires <span class="gold">&</span> Options</div>
    </div>
    <img src="../img/CRBR.Logo CRBR Solutions avec tête de loup.png" style="height:10mm;opacity:0.85;" alt="">
  </div>
  <div style="height:1px;background:linear-gradient(90deg,var(--gold),transparent);margin-bottom:6mm;"></div>

  <!-- Grid 2x3 -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:5mm;">
    ${[
      {icon:'⬛',t:'Panneaux Acoustiques',d:'Atténuation sonore ≥ 35dB — caoutchouc balistique 25mm. Compatible tous niveaux.',specs:['Épaisseur : 25mm','Finition : RAL 7016','Certifié NIJ IV']},
      {icon:'🔲',t:'Kit Fenêtres Tactiques',d:'Cadre aluminium + volet balistique. Ouverture manuelle ou commandée. 3 formats.',specs:['Small 40×40cm','Medium 60×40cm','Large 80×60cm']},
      {icon:'◼',t:'Toiture Modulaire',d:'Couverture légère aluminium + bâche anti-UV. Montage sans grue sur structure existante.',specs:['Charge max : 150kg/m²','IP65','Extension modulaire']},
      {icon:'⚙',t:'Système de Câblage',d:'Électricité 220V encastrée dans les panneaux. Sorties tous les 2m. Éclairage tactique LED.',specs:['Circuit 32A','Éclairage 3000K','Câblage encastré']},
      {icon:'🎯',t:'Cibles Mécaniques',d:'Cibles pop-up électriques compatibles IPSC. Commande déportée filaire ou radio 433MHz.',specs:['Temps réponse <0.3s','Radio 433MHz','Portée 200m']},
      {icon:'🔧',t:'Kit Extension',d:'Ajout de modules supplémentaires sur installation existante. Compatibilité garantie BASIC→PREMIUM.',specs:['Compatible toutes gammes','Installation ≤ 4h','Garantie 5 ans']},
    ].map(({icon,t,d,specs})=>`
    <div class="card" style="padding:10px 12px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
        <div style="font-size:14pt;">${icon}</div>
        <div style="font-size:8.5pt;font-weight:700;color:var(--white);text-transform:uppercase;letter-spacing:0.5px;">${t}</div>
      </div>
      <div style="font-size:7pt;color:var(--grey);line-height:1.5;margin-bottom:6px;">${d}</div>
      ${specs.map(s=>`<div style="font-size:6.5pt;color:var(--gold);margin-bottom:1px;">▸ ${s}</div>`).join('')}
    </div>`).join('')}
  </div>

  <!-- Compatibility table -->
  <div style="background:var(--card2);border:1px solid var(--border);border-radius:3px;padding:8px 12px;">
    <div style="font-size:7pt;font-weight:700;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Compatibilité par gamme</div>
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0;font-size:7pt;">
      <div style="color:var(--grey);padding:3px 0;border-bottom:1px solid var(--border);">Option</div>
      <div style="color:var(--gold);text-align:center;padding:3px 0;border-bottom:1px solid var(--border);">BASIC</div>
      <div style="color:var(--gold);text-align:center;padding:3px 0;border-bottom:1px solid var(--border);">PRO</div>
      <div style="color:var(--gold);text-align:center;padding:3px 0;border-bottom:1px solid var(--border);">PREMIUM</div>
      ${[
        ['Panneaux Acoustiques','●','●','●'],
        ['Kit Fenêtres Tactiques','●','●','●'],
        ['Toiture Modulaire','○','●','●'],
        ['Système de Câblage','○','●','●'],
        ['Cibles Mécaniques','●','●','●'],
        ['Kit Extension','—','●','●'],
      ].map(([n,...vals])=>`
      <div style="color:var(--grey-l);padding:3px 0;border-bottom:1px solid rgba(201,168,76,0.05);">${n}</div>
      ${vals.map(v=>`<div style="text-align:center;padding:3px 0;color:${v==='●'?'var(--gold)':v==='○'?'var(--grey)':'#444'};border-bottom:1px solid rgba(201,168,76,0.05);">${v}</div>`).join('')}`).join('')}
    </div>
  </div>

  <span class="hdr">CRBR SOLUTIONS — CATALOGUE COMPLÉMENTAIRE V2</span>
  <span class="page-num">06</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 7 — PORTES & KIT EFFRACTION
═══════════════════════════════════════════ -->
<div class="page" style="padding:12mm;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6mm;">
    <div>
      <div class="label" style="margin-bottom:4px;">Accessoires Opérationnels</div>
      <div style="font-size:20pt;font-weight:900;color:var(--white);text-transform:uppercase;">Portes <span class="gold">&</span> Kit Effraction</div>
    </div>
    <img src="../img/CRBR.Logo CRBR Solutions avec tête de loup.png" style="height:10mm;opacity:0.85;" alt="">
  </div>
  <div style="height:1px;background:linear-gradient(90deg,var(--gold),transparent);margin-bottom:6mm;"></div>

  <!-- PORTES section -->
  <div style="font-size:8pt;font-weight:700;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:4mm;">── Portes Tactiques</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin-bottom:6mm;">
    ${[
      {t:'Porte Standard',sub:'Acier 3mm — Battante',svg:`<svg viewBox="0 0 60 80" style="width:60px;height:80px;">
        <rect x="5" y="5" width="50" height="70" fill="#1f1f26" stroke="#C9A84C" stroke-width="1.5" rx="1"/>
        <rect x="8" y="8" width="44" height="64" fill="none" stroke="#8A8A96" stroke-width="0.5" stroke-dasharray="3,3"/>
        <circle cx="44" cy="40" r="3" fill="#C9A84C"/>
        <path d="M5 40 A44 44 0 0 1 49 40" fill="none" stroke="#C9A84C" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.5"/>
        <text x="30" y="78" fill="#8A8A96" font-size="5" text-anchor="middle" font-family="Helvetica">900×2100mm</text>
      </svg>`,specs:['Acier galvanisé 3mm','Serrure 3 points','Poignée barillet'],compat:'BASIC/PRO/PREMIUM'},
      {t:'Porte Balistique',sub:'Acier 8mm — NIJ III',svg:`<svg viewBox="0 0 60 80" style="width:60px;height:80px;">
        <rect x="5" y="5" width="50" height="70" fill="#1f1f26" stroke="#C9A84C" stroke-width="2" rx="1"/>
        <rect x="8" y="8" width="44" height="64" fill="#16161B" stroke="#C9A84C" stroke-width="0.5"/>
        <rect x="12" y="30" width="36" height="25" fill="none" stroke="#C9A84C" stroke-width="1" stroke-dasharray="2,2"/>
        <text x="30" y="44" fill="#C9A84C" font-size="5" text-anchor="middle" font-family="Helvetica">NIJ III</text>
        <circle cx="44" cy="20" r="3.5" fill="#C9A84C"/>
        <path d="M5 20 A44 44 0 0 1 49 20" fill="none" stroke="#C9A84C" stroke-width="0.8" stroke-dasharray="2,2" opacity="0.5"/>
        <text x="30" y="78" fill="#8A8A96" font-size="5" text-anchor="middle" font-family="Helvetica">900×2100mm</text>
      </svg>`,specs:['Acier 8mm + liner Kevlar','Résistance 7.62mm FMJ','Serrure anti-perçage'],compat:'PRO/PREMIUM'},
      {t:'Porte Soufflante',sub:'Formation explosion — Simulée',svg:`<svg viewBox="0 0 60 80" style="width:60px;height:80px;">
        <rect x="5" y="5" width="50" height="70" fill="#1f1f26" stroke="#C9A84C" stroke-width="1.5" rx="1"/>
        <line x1="5" y1="37" x2="55" y2="37" stroke="#C9A84C" stroke-width="1" stroke-dasharray="3,2"/>
        <rect x="5" y="5" width="50" height="32" fill="none" stroke="#C9A84C" stroke-width="0.5" opacity="0.5"/>
        <path d="M28,8 L32,8 L30,5 Z" fill="#C9A84C"/>
        <path d="M25,15 Q30,12 35,15 Q30,18 25,15" fill="none" stroke="#C9A84C" stroke-width="0.8"/>
        <circle cx="44" cy="55" r="3" fill="#C9A84C"/>
        <text x="30" y="78" fill="#8A8A96" font-size="5" text-anchor="middle" font-family="Helvetica">Soufflante training</text>
      </svg>`,specs:['Séparation haut/bas','Entraînement breach rapide','Réinitialisable en 30s'],compat:'PRO/PREMIUM'},
    ].map(({t,sub,svg,specs,compat})=>`
    <div class="card" style="text-align:center;padding:8px 10px;">
      <div style="display:flex;justify-content:center;margin-bottom:6px;">${svg}</div>
      <div style="font-size:8pt;font-weight:700;color:var(--white);margin-bottom:2px;">${t}</div>
      <div style="font-size:6.5pt;color:var(--grey);margin-bottom:6px;">${sub}</div>
      <div class="sep"></div>
      ${specs.map(s=>`<div style="font-size:6.5pt;color:var(--grey-l);text-align:left;margin-bottom:2px;">▸ ${s}</div>`).join('')}
      <div style="margin-top:4px;font-size:6pt;color:var(--gold);">● ${compat}</div>
    </div>`).join('')}
  </div>

  <!-- KIT EFFRACTION -->
  <div style="font-size:8pt;font-weight:700;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:4mm;">── Kit Effraction — Outils d'Entraînement</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
    ${[
      {t:'Ram Balistique',d:"Bélier d'assaut 12kg — Manche bi-matière antidérapant. Entraînement breach réaliste sans dommage sur structure.",cat:'Effraction mécanique'},
      {t:'Pied-de-Biche Tactique',d:'Levier forgé acier 60cm. Profil plat compatible serrures tubulaires. Finition phosphatée noire.',cat:'Effraction mécanique'},
      {t:'Masse 5kg',d:'Masse acier traitée. Manche composite 80cm. Simulation breach porte blindée. Certifié entraînement.',cat:'Effraction mécanique'},
      {t:'Charges à Blanc',d:'Charges de simulation pyrotechnique pour breaching. Détonateur électrique inclus. Homologué DGSI.',cat:'Pyrotechnie'},
    ].map(({t,d,cat})=>`
    <div class="card-lb" style="padding:8px 10px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
        <div style="font-size:8pt;font-weight:700;color:var(--white);">${t}</div>
        <span style="font-size:5.5pt;background:var(--ga10);color:var(--gold);padding:1px 5px;border:1px solid var(--border);">${cat}</span>
      </div>
      <div style="font-size:7pt;color:var(--grey);line-height:1.5;">${d}</div>
    </div>`).join('')}
  </div>

  <span class="hdr">CRBR SOLUTIONS — CATALOGUE COMPLÉMENTAIRE V2</span>
  <span class="page-num">07</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 8 — STRUCTURES & ÉQUIPEMENTS TACTIQUES
═══════════════════════════════════════════ -->
<div class="page" style="padding:12mm;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6mm;">
    <div>
      <div class="label" style="margin-bottom:4px;">Équipements Complémentaires</div>
      <div style="font-size:20pt;font-weight:900;color:var(--white);text-transform:uppercase;">Structures <span class="gold">&</span> Équipements Tactiques</div>
    </div>
    <img src="../img/CRBR.Logo CRBR Solutions avec tête de loup.png" style="height:10mm;opacity:0.85;" alt="">
  </div>
  <div style="height:1px;background:linear-gradient(90deg,var(--gold),transparent);margin-bottom:5mm;"></div>

  <!-- Structures de progression -->
  <div style="font-size:8pt;font-weight:700;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:4mm;">── Structures de Progression</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-bottom:5mm;">
    ${[
      {t:'Tour d\'Assaut 4m',svg:`<svg viewBox="0 0 80 100" style="width:80px;height:90px;">
        <rect x="10" y="5" width="60" height="90" fill="#1f1f26" stroke="#C9A84C" stroke-width="1.5" rx="2"/>
        ${[20,40,60,75].map(y=>`<line x1="10" y1="${y}" x2="70" y2="${y}" stroke="#8A8A96" stroke-width="0.8" stroke-dasharray="3,3"/>`).join('')}
        <rect x="20" y="8" width="40" height="12" fill="none" stroke="#C9A84C" stroke-width="1"/>
        <text x="40" y="17" fill="#C9A84C" font-size="5.5" text-anchor="middle" font-family="Helvetica">NIVEAU 3</text>
        <text x="40" y="30" fill="#8A8A96" font-size="4.5" text-anchor="middle" font-family="Helvetica">4m</text>
        <line x1="5" y1="90" x2="75" y2="90" stroke="#C9A84C" stroke-width="1.5"/>
        <rect x="15" y="75" width="12" height="20" fill="#16161B" stroke="#8A8A96" stroke-width="0.5"/>
        <rect x="53" y="75" width="12" height="20" fill="#16161B" stroke="#8A8A96" stroke-width="0.5"/>
        <text x="40" y="98" fill="#8A8A96" font-size="4" text-anchor="middle" font-family="Helvetica">Structure acier</text>
      </svg>`,specs:['Hauteur : 4m / 3 niveaux','Plateforme anti-dérapante','Capacité 500kg']},
      {t:'Mur d\'Escalade',svg:`<svg viewBox="0 0 80 100" style="width:80px;height:90px;">
        <rect x="15" y="5" width="50" height="90" fill="#1f1f26" stroke="#C9A84C" stroke-width="1.5" rx="2"/>
        ${[[20,20],[25,35],[18,50],[30,65],[22,80]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="#C9A84C" opacity="0.7"/>
        <circle cx="${80-x}" cy="${y+5}" r="2.5" fill="#8A8A96" opacity="0.7"/>`).join('')}
        <text x="40" y="50" fill="#C9A84C" font-size="6" text-anchor="middle" font-family="Helvetica">ESCALADE</text>
        <line x1="5" y1="95" x2="75" y2="95" stroke="#C9A84C" stroke-width="1.5"/>
        <text x="40" y="100" fill="#8A8A96" font-size="4" text-anchor="middle" font-family="Helvetica">Prises modulaires</text>
      </svg>`,specs:['Hauteur : 3.5m','Prises interchangeables','Inclinaison 0–30°']},
      {t:'Passerelle Suspendue',svg:`<svg viewBox="0 0 80 100" style="width:80px;height:90px;">
        <line x1="5" y1="40" x2="75" y2="40" stroke="#C9A84C" stroke-width="2"/>
        <rect x="5" y="38" width="70" height="6" fill="#1f1f26" stroke="#C9A84C" stroke-width="1"/>
        ${[10,20,30,40,50,60,70].map(x=>`<line x1="${x}" y1="10" x2="${x}" y2="38" stroke="#8A8A96" stroke-width="0.8" stroke-dasharray="2,2"/>`).join('')}
        <line x1="2" y1="10" x2="78" y2="10" stroke="#8A8A96" stroke-width="1"/>
        <line x1="5" y1="44" x2="5" y2="90" stroke="#C9A84C" stroke-width="1.5"/>
        <line x1="75" y1="44" x2="75" y2="90" stroke="#C9A84C" stroke-width="1.5"/>
        <rect x="0" y="88" width="15" height="8" fill="#1f1f26" stroke="#C9A84C" stroke-width="0.8"/>
        <rect x="65" y="88" width="15" height="8" fill="#1f1f26" stroke="#C9A84C" stroke-width="0.8"/>
        <text x="40" y="70" fill="#C9A84C" font-size="5.5" text-anchor="middle" font-family="Helvetica">5m / 3.5m haut</text>
        <text x="40" y="100" fill="#8A8A96" font-size="4" text-anchor="middle" font-family="Helvetica">Charge 300kg</text>
      </svg>`,specs:['Longueur : 5m','Hauteur sous passerelle : 3.5m','Anti-dérapant certifié']},
    ].map(({t,svg,specs})=>`
    <div class="card" style="text-align:center;padding:8px 10px;">
      <div style="display:flex;justify-content:center;margin-bottom:5px;">${svg}</div>
      <div style="font-size:8pt;font-weight:700;color:var(--white);margin-bottom:5px;">${t}</div>
      <div class="sep"></div>
      ${specs.map(s=>`<div style="font-size:6.5pt;color:var(--grey-l);text-align:left;margin-bottom:2px;">▸ ${s}</div>`).join('')}
    </div>`).join('')}
  </div>

  <!-- Équipements tactiques -->
  <div style="font-size:8pt;font-weight:700;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:4mm;">── Équipements Tactiques</div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
    ${[
      {t:'IFAK Tactique',d:'Kit premiers soins individuel. Formation TCCC.',i:'🩺'},
      {t:'Simulateurs Tir',d:'Systèmes laser SIRT compatibles toutes armes.',i:'🎯'},
      {t:'Radio Terrain',d:'Émetteurs-récepteurs formation PMR/DMR.',i:'📡'},
      {t:'Gilet de Protection',d:'NIJ IIIA — usage formation intensive.',i:'🛡'},
    ].map(({t,d,i})=>`
    <div class="card" style="text-align:center;padding:8px 6px;">
      <div style="font-size:20pt;margin-bottom:4px;">${i}</div>
      <div style="font-size:7pt;font-weight:700;color:var(--white);margin-bottom:3px;">${t}</div>
      <div style="font-size:6.5pt;color:var(--grey);line-height:1.4;">${d}</div>
    </div>`).join('')}
  </div>

  <span class="hdr">CRBR SOLUTIONS — CATALOGUE COMPLÉMENTAIRE V2</span>
  <span class="page-num">08</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 9 — CONFIGURATIONS PM & GN
═══════════════════════════════════════════ -->
<div class="page" style="padding:12mm;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6mm;">
    <div>
      <div class="label" style="margin-bottom:4px;">Configurations Clés en Main</div>
      <div style="font-size:20pt;font-weight:900;color:var(--white);text-transform:uppercase;">Police <span class="gold">&</span> Gendarmerie</div>
    </div>
    <img src="../img/CRBR.Logo CRBR Solutions avec tête de loup.png" style="height:10mm;opacity:0.85;" alt="">
  </div>
  <div style="height:1px;background:linear-gradient(90deg,var(--gold),transparent);margin-bottom:5mm;"></div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    <!-- PM Card -->
    <div style="display:flex;flex-direction:column;gap:5px;">
      <div style="background:var(--ga20);border:1px solid var(--gold);border-radius:3px 3px 0 0;padding:6px 10px;text-align:center;">
        <div style="font-size:8pt;font-weight:900;color:var(--gold);letter-spacing:3px;text-transform:uppercase;">Police Municipale</div>
        <div style="font-size:6.5pt;color:var(--grey);">Gamme recommandée : BASIC</div>
      </div>
      <div style="flex:1;border:1px solid var(--border);border-radius:0 0 3px 3px;overflow:hidden;">
        ${fpPM}
      </div>
      <div class="card" style="padding:8px 10px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">
          ${[['Surface','~40m²'],['Panneaux','42'],['Portes','4'],['Scénarios','6+'],['Montage','4h'],['Gamme','BASIC']].map(([k,v])=>`
          <div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${v}</span></div>`).join('')}
        </div>
      </div>
      <div class="card-lb" style="padding:5px 10px;">
        <div style="font-size:6.5pt;color:var(--grey-l);line-height:1.5;">
          Configuration légère pour unités de 6–10 opérateurs. Scénarios contrôle de zone,
          appréhension, fouille de local. Déploiement possible en gymnase municipal.
        </div>
      </div>
    </div>

    <!-- GN Card -->
    <div style="display:flex;flex-direction:column;gap:5px;">
      <div style="background:var(--ga20);border:1px solid var(--gold);border-radius:3px 3px 0 0;padding:6px 10px;text-align:center;">
        <div style="font-size:8pt;font-weight:900;color:var(--gold);letter-spacing:3px;text-transform:uppercase;">Gendarmerie Nationale</div>
        <div style="font-size:6.5pt;color:var(--grey);">Gamme recommandée : PRO</div>
      </div>
      <div style="flex:1;border:1px solid var(--border);border-radius:0 0 3px 3px;overflow:hidden;">
        ${fpGN}
      </div>
      <div class="card" style="padding:8px 10px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">
          ${[['Surface','~75m²'],['Panneaux','85'],['Portes','5'],['Scénarios','12+'],['Montage','7h'],['Gamme','PRO']].map(([k,v])=>`
          <div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${v}</span></div>`).join('')}
        </div>
      </div>
      <div class="card-lb" style="padding:5px 10px;">
        <div style="font-size:6.5pt;color:var(--grey-l);line-height:1.5;">
          Configuration polyvalente pour PSIG et brigades spécialisées. Multi-niveaux,
          couloir tactique, salle de briefing. Formation interpellation et neutralisation.
        </div>
      </div>
    </div>
  </div>

  <span class="hdr">CRBR SOLUTIONS — CATALOGUE COMPLÉMENTAIRE V2</span>
  <span class="page-num">09</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 10 — CONFIGURATIONS COMMANDO & ARMÉE
═══════════════════════════════════════════ -->
<div class="page" style="padding:12mm;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6mm;">
    <div>
      <div class="label" style="margin-bottom:4px;">Configurations Clés en Main</div>
      <div style="font-size:20pt;font-weight:900;color:var(--white);text-transform:uppercase;">Commando <span class="gold">&</span> Armée</div>
    </div>
    <img src="../img/CRBR.Logo CRBR Solutions avec tête de loup.png" style="height:10mm;opacity:0.85;" alt="">
  </div>
  <div style="height:1px;background:linear-gradient(90deg,var(--gold),transparent);margin-bottom:5mm;"></div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
    <!-- Commando Card -->
    <div style="display:flex;flex-direction:column;gap:5px;">
      <div style="background:var(--ga20);border:1px solid var(--gold);border-radius:3px 3px 0 0;padding:6px 10px;text-align:center;">
        <div style="font-size:8pt;font-weight:900;color:var(--gold);letter-spacing:3px;text-transform:uppercase;">Commando Marine</div>
        <div style="font-size:6.5pt;color:var(--grey);">Gamme recommandée : PRO / PREMIUM</div>
      </div>
      <div style="flex:1;border:1px solid var(--border);border-radius:0 0 3px 3px;overflow:hidden;">
        ${fpCDO}
      </div>
      <div class="card" style="padding:8px 10px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">
          ${[['Surface','~85m²'],['Panneaux','95'],['Portes','6+'],['Scénarios','20+'],['Montage','10h'],['Gamme','PRO+']].map(([k,v])=>`
          <div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${v}</span></div>`).join('')}
        </div>
      </div>
      <div class="card-lb" style="padding:5px 10px;">
        <div style="font-size:6.5pt;color:var(--grey-l);line-height:1.5;">
          Configuration forces spéciales. 6 secteurs indépendants, 3 points d'entrée,
          couloir principal CQB. Scénarios : hostage rescue, VBIED, capture/neutralisation.
        </div>
      </div>
    </div>

    <!-- Armée Card -->
    <div style="display:flex;flex-direction:column;gap:5px;">
      <div style="background:var(--ga20);border:1px solid var(--gold);border-radius:3px 3px 0 0;padding:6px 10px;text-align:center;">
        <div style="font-size:8pt;font-weight:900;color:var(--gold);letter-spacing:3px;text-transform:uppercase;">Armée de Terre</div>
        <div style="font-size:6.5pt;color:var(--grey);">Gamme recommandée : PREMIUM</div>
      </div>
      <div style="flex:1;border:1px solid var(--border);border-radius:0 0 3px 3px;overflow:hidden;">
        ${fpARMEE}
      </div>
      <div class="card" style="padding:8px 10px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">
          ${[['Surface','~115m²'],['Panneaux','110'],['Portes','13+'],['Scénarios','30+'],['Montage','2 jours'],['Gamme','PREMIUM']].map(([k,v])=>`
          <div class="spec-row"><span class="spec-key">${k}</span><span class="spec-val">${v}</span></div>`).join('')}
        </div>
      </div>
      <div class="card-lb" style="padding:5px 10px;">
        <div style="font-size:6.5pt;color:var(--grey-l);line-height:1.5;">
          Complexe FIBUA complet. 4 bâtiments + périmètre Nord/Sud. Formation
          COIN, sécurisation de zone, EVASAN, tir en zone habitée. Capacité 30+ opérateurs.
        </div>
      </div>
    </div>
  </div>

  <span class="hdr">CRBR SOLUTIONS — CATALOGUE COMPLÉMENTAIRE V2</span>
  <span class="page-num">10</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 11 — MODULARITÉ AVANT/APRÈS
═══════════════════════════════════════════ -->
<div class="page" style="padding:12mm;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6mm;">
    <div>
      <div class="label" style="margin-bottom:4px;">Concept Clé</div>
      <div style="font-size:20pt;font-weight:900;color:var(--white);text-transform:uppercase;">Modularité <span class="gold">— Avant / Après</span></div>
    </div>
    <img src="../img/CRBR.Logo CRBR Solutions avec tête de loup.png" style="height:10mm;opacity:0.85;" alt="">
  </div>
  <div style="height:1px;background:linear-gradient(90deg,var(--gold),transparent);margin-bottom:5mm;"></div>

  <!-- Intro -->
  <div class="card-lb" style="margin-bottom:6mm;padding:8px 12px;">
    <div style="font-size:9pt;font-weight:700;color:var(--white);margin-bottom:4px;">Une installation, des dizaines de scénarios.</div>
    <div style="font-size:7.5pt;color:var(--grey-l);line-height:1.6;">
      Chaque Shooting House CRBR peut être entièrement reconfigurée par 2 opérateurs sans outillage spécifique.
      Le système de panneaux à clippage rapide permet de modifier la topologie complète en moins de 4 heures —
      passant d'un appartement civil à un couloir tactique ou à un compound militaire.
    </div>
  </div>

  <!-- SVG Avant/Après diagram -->
  <div style="display:grid;grid-template-columns:1fr 60px 1fr;gap:0;align-items:center;margin-bottom:6mm;">
    <!-- AVANT -->
    <div>
      <div style="text-align:center;font-size:7.5pt;font-weight:700;color:var(--grey);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">CONFIGURATION A — Appartement Urbain</div>
      <svg viewBox="0 0 200 140" style="width:100%;border:1px solid var(--border);border-radius:3px;">
        <rect width="200" height="140" fill="#16161B"/>
        ${Array.from({length:21},(_,i)=>`<line x1="${i*10}" y1="0" x2="${i*10}" y2="140" stroke="rgba(201,168,76,0.05)" stroke-width="0.5"/>`).join('')}
        ${Array.from({length:15},(_,i)=>`<line x1="0" y1="${i*10}" x2="200" y2="${i*10}" stroke="rgba(201,168,76,0.05)" stroke-width="0.5"/>`).join('')}
        <!-- Rooms apartment style -->
        <rect x="10" y="10" width="80" height="60" fill="#1f1f26" stroke="#C0C0CA" stroke-width="1.5" rx="1"/>
        <text x="50" y="43" fill="#F0EFE9" font-size="7" text-anchor="middle" font-family="Helvetica">SALON / SÉJOUR</text>
        <rect x="95" y="10" width="95" height="55" fill="#1f1f26" stroke="#C0C0CA" stroke-width="1.5" rx="1"/>
        <text x="142" y="40" fill="#F0EFE9" font-size="7" text-anchor="middle" font-family="Helvetica">CHAMBRE 1</text>
        <rect x="10" y="75" width="55" height="55" fill="#1f1f26" stroke="#C0C0CA" stroke-width="1.5" rx="1"/>
        <text x="37" y="105" fill="#F0EFE9" font-size="7" text-anchor="middle" font-family="Helvetica">CHAMBRE 2</text>
        <rect x="70" y="75" width="40" height="55" fill="#1f1f26" stroke="#C0C0CA" stroke-width="1.5" rx="1"/>
        <text x="90" y="105" fill="#F0EFE9" font-size="6" text-anchor="middle" font-family="Helvetica">SDB</text>
        <rect x="115" y="70" width="75" height="60" fill="#1f1f26" stroke="#C0C0CA" stroke-width="1.5" rx="1"/>
        <text x="152" y="102" fill="#F0EFE9" font-size="7" text-anchor="middle" font-family="Helvetica">CUISINE</text>
        <!-- Entry arrows -->
        <line x1="10" y1="52" x2="0" y2="52" stroke="#C9A84C" stroke-width="1.5" marker-end="url(#arrowA)"/>
        <defs><marker id="arrowA" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#C9A84C"/></marker></defs>
        <text x="2" y="48" fill="#C9A84C" font-size="5" font-family="Helvetica">ENTRÉE</text>
        <text x="100" y="136" fill="#8A8A96" font-size="5.5" text-anchor="middle" font-family="Helvetica">Scénario interpellation domicile</text>
      </svg>
    </div>

    <!-- ARROW -->
    <div style="text-align:center;">
      <svg viewBox="0 0 60 60" style="width:50px;height:50px;">
        <line x1="5" y1="30" x2="50" y2="30" stroke="#C9A84C" stroke-width="2"/>
        <polygon points="50,25 60,30 50,35" fill="#C9A84C"/>
        <text x="30" y="22" fill="#C9A84C" font-size="6" text-anchor="middle" font-family="Helvetica">4h</text>
        <text x="30" y="44" fill="#8A8A96" font-size="5" text-anchor="middle" font-family="Helvetica">2 opérateurs</text>
      </svg>
    </div>

    <!-- APRÈS -->
    <div>
      <div style="text-align:center;font-size:7.5pt;font-weight:700;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">CONFIGURATION B — Couloir Tactique CQB</div>
      <svg viewBox="0 0 200 140" style="width:100%;border:1px solid var(--border);border-radius:3px;">
        <rect width="200" height="140" fill="#16161B"/>
        ${Array.from({length:21},(_,i)=>`<line x1="${i*10}" y1="0" x2="${i*10}" y2="140" stroke="rgba(201,168,76,0.05)" stroke-width="0.5"/>`).join('')}
        ${Array.from({length:15},(_,i)=>`<line x1="0" y1="${i*10}" x2="200" y2="${i*10}" stroke="rgba(201,168,76,0.05)" stroke-width="0.5"/>`).join('')}
        <!-- Tactical corridor layout -->
        <rect x="10" y="50" width="180" height="40" fill="#1f1f26" stroke="#C9A84C" stroke-width="1.5" rx="1"/>
        <text x="100" y="73" fill="#C9A84C" font-size="7" text-anchor="middle" font-family="Helvetica">COULOIR PRINCIPAL CQB</text>
        <rect x="10" y="10" width="45" height="35" fill="#1f1f26" stroke="#C0C0CA" stroke-width="1.5" rx="1"/>
        <text x="32" y="30" fill="#F0EFE9" font-size="6" text-anchor="middle" font-family="Helvetica">SECTOR A</text>
        <rect x="60" y="10" width="45" height="35" fill="#1f1f26" stroke="#C0C0CA" stroke-width="1.5" rx="1"/>
        <text x="82" y="30" fill="#F0EFE9" font-size="6" text-anchor="middle" font-family="Helvetica">SECTOR B</text>
        <rect x="110" y="10" width="45" height="35" fill="#1f1f26" stroke="#C0C0CA" stroke-width="1.5" rx="1"/>
        <text x="132" y="30" fill="#F0EFE9" font-size="6" text-anchor="middle" font-family="Helvetica">SECTOR C</text>
        <rect x="10" y="95" width="55" height="35" fill="#1f1f26" stroke="#C0C0CA" stroke-width="1.5" rx="1"/>
        <text x="37" y="115" fill="#F0EFE9" font-size="6" text-anchor="middle" font-family="Helvetica">ZONE HOLD</text>
        <rect x="70" y="95" width="120" height="35" fill="#1f1f26" stroke="#C0C0CA" stroke-width="1.5" rx="1"/>
        <text x="130" y="115" fill="#F0EFE9" font-size="7" text-anchor="middle" font-family="Helvetica">ZONE EXFIL</text>
        <!-- Entry arrows -->
        <line x1="0" y1="70" x2="10" y2="70" stroke="#C9A84C" stroke-width="2" marker-end="url(#arrowB)"/>
        <defs><marker id="arrowB" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#C9A84C"/></marker></defs>
        <line x1="200" y1="70" x2="190" y2="70" stroke="#C9A84C" stroke-width="2" marker-end="url(#arrowB2)"/>
        <defs><marker id="arrowB2" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#C9A84C"/></marker></defs>
        <text x="100" y="136" fill="#8A8A96" font-size="5.5" text-anchor="middle" font-family="Helvetica">Scénario tir en espace confiné</text>
      </svg>
    </div>
  </div>

  <!-- Key benefits -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
    ${[
      {n:'10+','l':'Configurations possibles','d':'par installation BASIC'},
      {n:'0','l':'Outil requis','d':'clippage sans clé'},
      {n:'4h','l':'Reconfiguration totale','d':'par 2 opérateurs'},
      {n:'∞','l':'Évolutivité','d':'ajout modules sans limite'},
    ].map(({n,l,d})=>`
    <div class="card" style="text-align:center;padding:8px 6px;">
      <div style="font-size:18pt;font-weight:900;color:var(--gold);line-height:1;">${n}</div>
      <div style="font-size:7pt;font-weight:700;color:var(--white);margin:3px 0;">${l}</div>
      <div style="font-size:6pt;color:var(--grey);">${d}</div>
    </div>`).join('')}
  </div>

  <span class="hdr">CRBR SOLUTIONS — CATALOGUE COMPLÉMENTAIRE V2</span>
  <span class="page-num">11</span>
</div>


<!-- ═══════════════════════════════════════════
     PAGE 12 — CONTACT & COMMANDE
═══════════════════════════════════════════ -->
<div class="page" style="position:relative;">
  <!-- Background texture -->
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.08) 0%, transparent 60%),radial-gradient(ellipse at 70% 80%, rgba(201,168,76,0.05) 0%, transparent 50%),#111114;z-index:0;"></div>

  <!-- Diagonal gold accent -->
  <svg style="position:absolute;inset:0;width:100%;height:100%;z-index:0;" preserveAspectRatio="none">
    <line x1="0" y1="0" x2="210" y2="297" stroke="rgba(201,168,76,0.06)" stroke-width="80"/>
  </svg>

  <div style="position:relative;z-index:1;padding:18mm 14mm;display:flex;flex-direction:column;height:100%;">
    <!-- Logo + tagline -->
    <div style="text-align:center;margin-bottom:12mm;">
      <img src="../img/CRBR.Logo CRBR Solutions avec tête de loup.png" style="height:16mm;margin-bottom:8mm;" alt="">
      <div style="font-size:22pt;font-weight:900;color:var(--white);text-transform:uppercase;line-height:1.1;">
        Passons à l'<span style="color:var(--gold);">opérationnel</span>
      </div>
      <div style="font-size:9pt;color:var(--grey-l);margin-top:6px;font-weight:300;letter-spacing:1px;">
        Étude gratuite · Devis personnalisé · Livraison clé en main
      </div>
    </div>

    <!-- Contact cards -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10mm;">
      ${[
        {ico:'📞',t:'Téléphone',v:'+33 (0)6 65 44 52 26',s:'Lun–Ven 8h–19h'},
        {ico:'✉',t:'Email',v:'contact@crbr-group.fr',s:'Réponse sous 24h'},
        {ico:'🌐',t:'Site Web',v:'www.crbr-solution.fr',s:'Catalogue complet en ligne'},
      ].map(({ico,t,v,s})=>`
      <div class="card" style="text-align:center;padding:12px 8px;">
        <div style="font-size:20pt;margin-bottom:6px;">${ico}</div>
        <div style="font-size:7pt;text-transform:uppercase;letter-spacing:2px;color:var(--gold);margin-bottom:4px;">${t}</div>
        <div style="font-size:8pt;font-weight:700;color:var(--white);margin-bottom:3px;">${v}</div>
        <div style="font-size:6.5pt;color:var(--grey);">${s}</div>
      </div>`).join('')}
    </div>

    <!-- Process sur-mesure -->
    <div style="background:var(--card2);border:1px solid var(--border);border-radius:3px;padding:10px 14px;margin-bottom:10mm;">
      <div style="font-size:8pt;font-weight:700;color:var(--gold);letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">── Notre processus clé en main</div>
      <div style="display:flex;gap:0;">
        ${[
          ['01','Analyse','Audit de vos besoins opérationnels et de votre site'],
          ['02','Conception','Plan 3D personnalisé avec configurations validées'],
          ['03','Livraison','Fabrication + transport + installation sur site'],
          ['04','Formation','Prise en main structure + scenarios d\'emploi'],
        ].map(([n,t,d],i,arr)=>`
        <div style="flex:1;padding:0 10px;${i<arr.length-1?'border-right:1px solid var(--border);':''}text-align:center;">
          <div style="font-size:14pt;font-weight:900;color:var(--gold);margin-bottom:3px;">${n}</div>
          <div style="font-size:7.5pt;font-weight:700;color:var(--white);margin-bottom:3px;">${t}</div>
          <div style="font-size:6.5pt;color:var(--grey);line-height:1.4;">${d}</div>
        </div>`).join('')}
      </div>
    </div>

    <!-- Company info -->
    <div style="margin-top:auto;padding-top:8mm;border-top:1px solid var(--border);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:7.5pt;font-weight:700;color:var(--white);margin-bottom:3px;">CRBR Group</div>
          <div style="font-size:6.5pt;color:var(--grey);line-height:1.6;">
            SAS au capital de 7 500€<br>
            SIREN : 942 589 789 — SIRET : 942 589 789 00018<br>
            TVA intracommunautaire : FR62942589789
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:6.5pt;color:var(--grey);line-height:1.6;">
            Catalogue Complémentaire V2.0 — 2026<br>
            Document confidentiel<br>
            Toute reproduction interdite
          </div>
        </div>
      </div>
    </div>
  </div>
  <span class="page-num">12</span>
</div>

</body>
</html>`;

writeFileSync(resolve(__dirname, 'vitrine/templates/catalogue-v2-template.html'), html, 'utf-8');
console.log('✅ catalogue-v2-template.html written — ' + Math.round(html.length/1024) + 'KB');
