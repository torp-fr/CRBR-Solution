'use strict';

const Export = {
  saveJSON() {
    const json = AppState.serialize();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${AppState.projectName.replace(/\s+/g, '_')}.cqb.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  loadJSON(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        AppState.load(e.target.result);
        document.getElementById('project-name').value = AppState.projectName;
        App.updateUI();
        Editor2D.centerView();
        Renderer3D.refresh();
      } catch (err) {
        alert('Fichier invalide ou corrompu.');
      }
    };
    reader.readAsText(file);
  },

  async exportPDF() {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { alert('jsPDF non disponible.'); return; }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW = 210, PH = 297, M = 12;
    const gold = [201, 168, 76];
    const dark = [17, 17, 20];
    const grey = [138, 138, 150];

    function page1Header(doc, title) {
      // Dark background
      doc.setFillColor(...dark);
      doc.rect(0, 0, PW, PH, 'F');
      // Gold left bar
      doc.setFillColor(...gold);
      doc.rect(0, 0, 5, PH, 'F');
      // Title
      doc.setTextColor(...gold);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('CRBR SOLUTIONS — SHOOTING HOUSE MODULAIRE', M + 2, 14);
      doc.setTextColor(240, 239, 233);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, M + 2, 22);
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.5);
      doc.line(M + 2, 25, PW - M, 25);
    }

    // ── Page 1: Plan 2D ──────────────────────────────────────
    const planImg = Editor2D.captureImage();
    doc.setFillColor(...dark);
    doc.rect(0, 0, PW, PH, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, 0, 5, PH, 'F');

    doc.setTextColor(...gold);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('CRBR SOLUTIONS — SHOOTING HOUSE MODULAIRE', M + 2, 14);
    doc.setTextColor(240, 239, 233);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Plan 2D — ' + AppState.projectName, M + 2, 22);
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(M + 2, 25, PW - M, 25);

    if (planImg) {
      doc.addImage(planImg, 'PNG', M + 2, 30, PW - M * 2 - 2, 130);
    }

    // Module count table on page 1
    const res = Calculator.compute();
    let ty = 168;
    doc.setTextColor(...gold);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('MODULES POSÉS', M + 2, ty); ty += 5;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.3);
    doc.line(M + 2, ty, PW - M, ty); ty += 4;

    const types = Object.keys(res.counts).filter(t => res.counts[t] > 0);
    types.forEach(t => {
      doc.setTextColor(192, 192, 202);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(MODULE_LABELS[t], M + 2, ty);
      doc.setTextColor(...gold);
      doc.setFont('helvetica', 'bold');
      doc.text(String(res.counts[t]), PW - M - 10, ty, { align: 'right' });
      ty += 6;
    });
    doc.setDrawColor(...gold);
    doc.line(M + 2, ty, PW - M, ty); ty += 4;
    doc.setTextColor(240, 239, 233);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL', M + 2, ty);
    doc.text(String(res.totalModules), PW - M - 10, ty, { align: 'right' }); ty += 5;

    // Page number
    doc.setTextColor(...grey);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('01', PW - M, PH - 8, { align: 'right' });
    doc.text('SHOOTING HOUSE MODULAIRE — ' + AppState.projectName, M + 2, PH - 8);

    // ── Page 2: Vue 3D ───────────────────────────────────────
    doc.addPage();
    doc.setFillColor(...dark);
    doc.rect(0, 0, PW, PH, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, 0, 5, PH, 'F');

    doc.setTextColor(...gold);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('CRBR SOLUTIONS — SHOOTING HOUSE MODULAIRE', M + 2, 14);
    doc.setTextColor(240, 239, 233);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Vue 3D', M + 2, 22);
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(M + 2, 25, PW - M, 25);

    try {
      const img3d = Renderer3D.captureImage();
      if (img3d) doc.addImage(img3d, 'PNG', M + 2, 30, PW - M * 2 - 2, 140);
    } catch(e) {}

    doc.setTextColor(...grey);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('02', PW - M, PH - 8, { align: 'right' });
    doc.text('SHOOTING HOUSE MODULAIRE — ' + AppState.projectName, M + 2, PH - 8);

    // ── Page 3: Devis ────────────────────────────────────────
    doc.addPage();
    doc.setFillColor(...dark);
    doc.rect(0, 0, PW, PH, 'F');
    doc.setFillColor(...gold);
    doc.rect(0, 0, 5, PH, 'F');

    doc.setTextColor(...gold);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('CRBR SOLUTIONS — SHOOTING HOUSE MODULAIRE', M + 2, 14);
    doc.setTextColor(240, 239, 233);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Devis estimatif', M + 2, 22);
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(M + 2, 25, PW - M, 25);

    let y = 35;
    const col = [M + 2, 90, 130, 175];

    // Table header
    doc.setFillColor(42, 42, 53);
    doc.rect(M + 2, y - 4, PW - M * 2 - 2, 8, 'F');
    doc.setTextColor(...gold);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('TYPE DE MODULE', col[0], y);
    doc.text('QTÉ', col[1], y, { align: 'right' });
    doc.text('COÛT UNIT.', col[2], y, { align: 'right' });
    doc.text('TOTAL', col[3], y, { align: 'right' });
    y += 4;
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.3);
    doc.line(M + 2, y, PW - M, y); y += 5;

    types.forEach((t, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(31, 31, 38);
        doc.rect(M + 2, y - 4, PW - M * 2 - 2, 6, 'F');
      }
      doc.setTextColor(192, 192, 202);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`${MODULE_ICONS[t]}  ${MODULE_LABELS[t]}`, col[0], y);
      doc.setTextColor(240, 239, 233);
      doc.text(String(res.counts[t]), col[1], y, { align: 'right' });
      doc.text(`${res.moduleCosts[t].unit.toFixed(2)} €`, col[2], y, { align: 'right' });
      doc.setTextColor(...gold);
      doc.setFont('helvetica', 'bold');
      doc.text(`${res.moduleCosts[t].total.toFixed(2)} €`, col[3], y, { align: 'right' });
      y += 7;
    });

    doc.setDrawColor(...gold);
    doc.setLineWidth(0.4);
    doc.line(M + 2, y, PW - M, y); y += 7;

    // Summary block
    const priceRows = [
      ['Coût matériaux total', res.totalMat.toFixed(2) + ' € HT'],
      [`Marge (${AppState.settings.business.margin}%)`, '+ ' + res.marginAmount.toFixed(2) + ' € HT'],
      ['Livraison', '+ ' + res.delivery.toFixed(2) + ' € HT'],
      ['Pose / installation', '+ ' + res.installation.toFixed(2) + ' € HT'],
    ];
    priceRows.forEach(([label, val]) => {
      doc.setTextColor(192, 192, 202);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(label, col[0], y);
      doc.setTextColor(240, 239, 233);
      doc.text(val, PW - M, y, { align: 'right' });
      y += 7;
    });

    doc.setDrawColor(...gold);
    doc.setLineWidth(0.5);
    doc.line(M + 2, y, PW - M, y); y += 8;

    doc.setFillColor(42, 42, 53);
    doc.rect(M + 2, y - 5, PW - M * 2 - 2, 10, 'F');
    doc.setTextColor(...gold);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('PRIX DE VENTE HT', col[0], y);
    doc.text(`${res.sellPrice.toFixed(2)} € HT`, PW - M, y, { align: 'right' });
    y += 12;

    doc.setTextColor(138, 138, 150);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`TVA 20% : ${(res.sellPrice * 0.2).toFixed(2)} €  |  Prix TTC : ${(res.sellPrice * 1.2).toFixed(2)} €`, col[0], y);

    doc.setTextColor(...grey);
    doc.setFontSize(7);
    doc.text('03', PW - M, PH - 8, { align: 'right' });
    doc.text('SHOOTING HOUSE MODULAIRE — ' + AppState.projectName, M + 2, PH - 8);

    doc.save(`${AppState.projectName.replace(/\s+/g, '_')}_devis.pdf`);
  },
};
