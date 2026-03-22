const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  await page.setViewport({ width: 794, height: 1123 });

  console.log('Lancement du navigateur...');

  const filePath = path.resolve(__dirname, '../vitrine/plaquette.html');
  const fileUrl = 'file://' + filePath;

  console.log('Chargement :', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });

  console.log('Génération du PDF...');

  const outputPath = path.resolve(__dirname, '../vitrine/assets/DST_System_Plaquette.pdf');

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  });

  const stats = fs.statSync(outputPath);
  const sizeKb = (stats.size / 1024).toFixed(1);

  console.log('\n✓ PDF généré avec succès');
  console.log('  Chemin  :', outputPath);
  console.log('  Taille  :', sizeKb, 'KB');

  await browser.close();
})();
