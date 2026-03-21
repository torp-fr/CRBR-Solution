#!/usr/bin/env node
/**
 * DST System — Générateur PDF plaquette
 * Utilise Puppeteer pour ouvrir plaquette.html et exporter un PDF propre A4.
 *
 * Usage : node scripts/generate-pdf.js
 *         npm run generate:pdf
 */

const puppeteer = require('puppeteer');
const path      = require('path');
const fs        = require('fs');

async function generatePDF() {
  const htmlFile   = path.resolve(__dirname, '../vitrine/plaquette.html');
  const outputPath = path.resolve(__dirname, '../vitrine/assets/DST_System_Plaquette.pdf');

  if (!fs.existsSync(htmlFile)) {
    throw new Error(`HTML introuvable : ${htmlFile}`);
  }
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  console.log('Lancement du navigateur...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--allow-file-access-from-files',
      '--disable-web-security',
    ],
  });

  const page = await browser.newPage();

  // Chemin file:// Windows-compatible
  const fileUrl = `file:///${htmlFile.replace(/\\/g, '/')}`;
  console.log(`Chargement : ${fileUrl}`);

  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // Attendre le chargement des polices Google Fonts
  await page.evaluate(() => document.fonts.ready);

  // Injecter CSS pour supprimer les hauteurs fixes et laisser le contenu
  // dicter la densité — Puppeteer pagine selon format A4 et page-break-after
  await page.addStyleTag({
    content: `
      body  { background: white !important; }

      /* Masquer éléments d'interface */
      .dl-btn, .dl-hint { display: none !important; }

      /* Supprimer hauteur forcée 297mm — le contenu dicte la taille */
      .page {
        height: auto !important;
        min-height: 0 !important;
        overflow: visible !important;
        margin: 0 !important;
        box-shadow: none !important;
      }

      /* Les flex-1 internes s'adaptent au contenu naturel */
      .pc, .cv-mid, .porteur-grid { flex: none !important; }

      /* Les containers space-between passent en flex-start */
      .iblocks, .blist { justify-content: flex-start !important; }

      /* Garder les page breaks entre sections */
      .page { page-break-after: always; break-after: page; }
      .page:last-child { page-break-after: auto; break-after: auto; }
    `,
  });

  console.log('Génération du PDF...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: false,
  });

  await browser.close();

  const stats = fs.statSync(outputPath);
  const sizeKB = (stats.size / 1024).toFixed(1);

  if (stats.size < 5000) {
    throw new Error(`PDF suspect — taille trop faible : ${sizeKB} KB`);
  }

  console.log(`\n✓ PDF généré avec succès`);
  console.log(`  Chemin  : ${outputPath}`);
  console.log(`  Taille  : ${sizeKB} KB`);
}

generatePDF().catch(err => {
  console.error(`\n✗ Erreur : ${err.message}`);
  process.exit(1);
});
