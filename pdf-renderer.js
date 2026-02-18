// PDF Rendering Functions

function drawTireDiagram(doc, config, values, startX, startY, options={}) {
  if (!config || !config.data || !config.data.length) return startY;

  const rowHeight = options.rowHeight || 10;
  const tireW = options.tireW || 6;
  const tireH = options.tireH || 12;
  const tireR = options.tireR || 3;
  const gap = options.gap || 8;
  const leftX = startX;
  const rightX = startX + (options.rightOffset || 110);
  const labelX = startX + (options.labelOffset || 50);
  const fontSize = options.fontSize || 8;

  const leftCount = config.data.reduce((sum,a)=> sum + (a.type === 'dual' ? 2 : 1), 0);
  let leftIndex = 0;
  let rightIndex = leftCount;

  doc.setFontSize(fontSize);

  function getTireColor(value) {
    const v = Number(value || 0);
    if (v <= 5) return { r: 255, g: 220, b: 220 };
    if (v <= 9) return { r: 255, g: 250, b: 200 };
    return { r: 220, g: 255, b: 220 };
  }

  function drawTire(x, y, value) {
    const color = getTireColor(value);
    doc.setDrawColor(55, 65, 81);
    doc.setFillColor(color.r, color.g, color.b);
    doc.roundedRect(x, y, tireW, tireH, tireR, tireR, 'FD');
    doc.setTextColor(17, 24, 39);
    doc.text(formatMmValue(value || 0), x + tireW / 2, y + (tireH / 2) + 2, { align: 'center' });
  }

  config.data.forEach((axle, idx)=>{
    const y = startY + idx * rowHeight;
    doc.text(`A${idx+1}`, labelX, y + 4);

    const isDual = axle.type === 'dual';

    if (isDual) {
      const leftOuter = leftIndex++;
      const leftInner = leftIndex++;
      const rightInner = rightIndex++;
      const rightOuter = rightIndex++;

      drawTire(leftX, y, values[leftOuter]);
      drawTire(leftX + gap, y, values[leftInner]);
      drawTire(rightX, y, values[rightInner]);
      drawTire(rightX + gap, y, values[rightOuter]);
    } else {
      const leftPos = leftIndex++;
      const rightPos = rightIndex++;
      drawTire(leftX, y, values[leftPos]);
      drawTire(rightX + gap, y, values[rightPos]);
    }
  });

  return startY + config.data.length * rowHeight;
}

function buildDiagramHtml(config, values) {
  if (!config || !config.data || !config.data.length) return '';

  const leftCount = config.data.reduce((sum,a)=> sum + (a.type === 'dual' ? 2 : 1), 0);
  let leftIndex = 0;
  let rightIndex = leftCount;

  let html = '<div class="diagram">';
  config.data.forEach((axle, idx)=>{
    const isDual = axle.type === 'dual';
    html += '<div class="diagram-row">';
    html += '<div class="diagram-side">';
    if (isDual) {
      html += `<div class="diagram-tire">${formatMmValue(values[leftIndex++] || 0)}</div>`;
      html += `<div class="diagram-tire">${formatMmValue(values[leftIndex++] || 0)}</div>`;
    } else {
      html += `<div class="diagram-tire">${formatMmValue(values[leftIndex++] || 0)}</div>`;
    }
    html += '</div>';
    html += `<div class="diagram-label">A${idx+1}</div>`;
    html += '<div class="diagram-side right">';
    if (isDual) {
      html += `<div class="diagram-tire">${formatMmValue(values[rightIndex++] || 0)}</div>`;
      html += `<div class="diagram-tire">${formatMmValue(values[rightIndex++] || 0)}</div>`;
    } else {
      html += `<div class="diagram-tire">${formatMmValue(values[rightIndex++] || 0)}</div>`;
    }
    html += '</div>';
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function ensureSpace(doc, y, needed, page) {
  if (y + needed <= page.bottom) return y;
  doc.addPage();
  return page.top;
}

function drawSectionTitle(doc, title, y, page) {
  y = ensureSpace(doc, y, 10, page);
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text(title, page.left, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(page.left, y + 2, page.right, y + 2);
  return y + 8;
}

function drawKeyValues(doc, y, items, page) {
  const rowH = 6;
  const colGap = 10;
  const colW = (page.right - page.left - colGap) / 2;
  doc.setFontSize(9);

  for (let i = 0; i < items.length; i += 2) {
    y = ensureSpace(doc, y, rowH, page);
    const left = items[i];
    const right = items[i + 1];

    if (left) {
      doc.setTextColor(107, 114, 128);
      doc.text(left.label + ":", page.left, y);
      doc.setTextColor(17, 24, 39);
      doc.text(left.value || "-", page.left + 28, y);
    }

    if (right) {
      doc.setTextColor(107, 114, 128);
      doc.text(right.label + ":", page.left + colW + colGap, y);
      doc.setTextColor(17, 24, 39);
      doc.text(right.value || "-", page.left + colW + colGap + 28, y);
    }

    y += rowH;
  }

  return y + 2;
}

function drawTable(doc, y, headers, rows, colWidths, page) {
  const rowH = 6;
  const headerH = 7;
  const startX = page.left;
  const charWidth = 1.8;

  function truncateText(text, colWidth) {
    const maxChars = Math.floor((colWidth - 4) / charWidth);
    if (String(text).length > maxChars) {
      return String(text).substring(0, Math.max(1, maxChars - 1)) + '…';
    }
    return text;
  }

  function drawHeader() {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(startX, y - 5, page.right - page.left, headerH, "F");
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(9);
    let x = startX;
    headers.forEach((h, idx)=>{
      doc.text(truncateText(h, colWidths[idx]), x + 2, y);
      x += colWidths[idx];
    });
    y += headerH;
  }

  y = ensureSpace(doc, y, headerH + rowH, page);
  drawHeader();

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(9);

  rows.forEach(row=>{
    // Calculate actual row height needed for wrapped content
    let actualRowH = rowH;
    const cellContents = [];
    const lineHeight = 3.5;
    
    // Wrap all columns and calculate maximum height needed
    row.forEach((cell, idx)=>{
      const colWidth = colWidths[idx];
      const text = String(cell || "-");
      const wrappedLines = doc.splitTextToSize(text, colWidth - 4);
      const neededHeight = wrappedLines.length * lineHeight + 1;
      actualRowH = Math.max(actualRowH, neededHeight);
      cellContents[idx] = { lines: wrappedLines };
    });
    
    if (y + actualRowH > page.bottom) {
      doc.addPage();
      y = page.top + 5;
      drawHeader();
    }
    
    let x = startX;
    cellContents.forEach((content, idx)=>{
      // Calculate vertical center offset
      const textHeight = content.lines.length * lineHeight;
      const verticalOffset = (actualRowH - textHeight) / 2;
      doc.text(content.lines, x + 2, y + verticalOffset, { maxWidth: colWidths[idx] - 4 });
      x += colWidths[idx];
    });
    doc.setDrawColor(226, 232, 240);
    doc.line(startX, y + actualRowH - 2, page.right, y + actualRowH - 2);
    y += actualRowH;
  });

  return y + 4;
}

function drawPhotoGallery(doc, y, r, page) {
  const photos = (r.photos || []).map((p, idx)=>({ src: p, label: r.positions && r.positions[idx] ? r.positions[idx] : "" }))
    .filter(p=>p.src);
  if (!photos.length) return y;

  doc.addPage();
  y = page.top;
  doc.setFontSize(12);
  doc.setTextColor(31, 41, 55);
  doc.text("Kuvagalleria", page.left, y);
  y += 8;

  const colW = 80;
  const colGap = 10;
  const imgW = colW;
  const imgH = 50;
  const labelH = 5;
  const startX = page.left;

  let x = startX;
  let rowY = y;

  photos.forEach((p, idx)=>{
    if (rowY + imgH + labelH > page.bottom) {
      doc.addPage();
      rowY = page.top;
      x = startX;
    }

    try {
      const m = (p.src.match(/^data:image\/(\w+);base64,/) || [])[1] || "jpeg";
      const fmt = (m.toUpperCase()==='JPG'?'JPEG':m.toUpperCase());
      doc.addImage(p.src, fmt, x, rowY, imgW, imgH);
    } catch(e) {}

    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text(p.label || "", x, rowY + imgH + 4);

    if (x + colW + colGap + colW <= page.right) {
      x += colW + colGap;
    } else {
      x = startX;
      rowY += imgH + labelH + 8;
    }
  });

  return page.bottom;
}

function renderReport(doc, r, options={}) {
  const page = { left: 20, right: 190, top: 18, bottom: 280 };
  let y = page.top;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(page.left, y, page.right - page.left, 16, "F");
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.text("Rengastarkastusraportti", page.left + 4, y + 11);
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(r.date || "", page.right - 2, y + 11, { align: 'right' });
  y += 22;

  y = drawSectionTitle(doc, "Ajoneuvon tiedot", y, page);
  y = drawKeyValues(doc, y, [
    { label: "Rek", value: r.plate || "-" },
    { label: "Yritys", value: r.company || "-" },
    { label: "Merkki", value: r.make || "-" },
    { label: "Malli", value: r.model || "-" },
    { label: "Tyyppi", value: r.type || "-" },
    { label: "Akselien lkm", value: r.config && r.config.data ? String(r.config.data.length) : "-" }
  ], page);

  y = drawSectionTitle(doc, "Akselikonfiguraatio", y, page);
  
  // Build axle-level tire data from per-position data
  const axleRows = [];
  if (r.config && r.config.data) {
    const totalLeft = r.config.data.reduce((sum,a)=> sum + (a.type === 'dual' ? 2 : 1), 0);
    let leftIdx = 0, rightIdx = totalLeft;
    
    r.config.data.forEach((axle, axleNum)=>{
      const isDual = axle.type === 'dual';
      let tireSize = "-", tireRim = "-", tireET = "-";
      
      if (isDual) {
        const firstLeftIdx = leftIdx;
        tireSize = (r.tireSizes && r.tireSizes[firstLeftIdx]) ? r.tireSizes[firstLeftIdx] : axle.size || "-";
        tireRim = (r.tireRims && r.tireRims[firstLeftIdx]) ? r.tireRims[firstLeftIdx] : axle.rim || "-";
        tireET = (r.tireEts && r.tireEts[firstLeftIdx]) ? r.tireEts[firstLeftIdx] : axle.et || "-";
        leftIdx += 2;
        rightIdx += 2;
      } else {
        tireSize = (r.tireSizes && r.tireSizes[leftIdx]) ? r.tireSizes[leftIdx] : axle.size || "-";
        tireRim = (r.tireRims && r.tireRims[leftIdx]) ? r.tireRims[leftIdx] : axle.rim || "-";
        tireET = (r.tireEts && r.tireEts[leftIdx]) ? r.tireEts[leftIdx] : axle.et || "-";
        leftIdx += 1;
        rightIdx += 1;
      }
      
      axleRows.push([
        String(axleNum+1),
        tireSize,
        tireRim,
        tireET
      ]);
    });
  }
  y = drawTable(doc, y, ["Akseli","Koko","Vanne","ET"], axleRows, [16, 40, 30, 16], page);

  y = drawSectionTitle(doc, "Rengaskartta", y, page);
  y = ensureSpace(doc, y, 30, page);
  y = drawTireDiagram(doc, r.config, r.values || [], page.left, y, { rightOffset:110, labelOffset:50, tireW:6, tireH:12, tireR:3, gap:8 });
  y += 6;

  y = drawSectionTitle(doc, "Rengasmittaukset", y, page);
  const rows = (r.positions || []).map((p,i)=>{
    const v = r.values && r.values[i];
    const w = r.wear && r.wear[i];
    const size = r.tireSizes && r.tireSizes[i] ? r.tireSizes[i] : "-";
    const maker = r.tireMakes && r.tireMakes[i] ? r.tireMakes[i] : "-";
    const et = r.tireEts && r.tireEts[i] ? r.tireEts[i] : "-";
    let note = r.notes && r.notes[i] ? r.notes[i] : "";
    if (!note) { if (v < 2) note = "Vaihda"; else if (v < 4) note = "Seurattava"; }
    return [p, size, maker, et, formatMmValue(v), w != null ? String(w) : "-", note || "-"];
  });
  y = drawTable(doc, y, ["Sijainti","Koko","Merkki","ET","Mitta (mm)","Kuluminen","Huomio"], rows, [42, 32, 28, 14, 18, 20, 26], page);

  if (options.photoMode === 'gallery') {
    drawPhotoGallery(doc, y, r, page);
  }
}

function generatePdf(index) {
  if (!window.HistoryManager) return alert('Historia ei saatavilla');
  if (!window.jspdf) return alert('jsPDF ei ladattu - lataa sivu palvelimelta tai lisää jspdf paikallisesti');
  const { jsPDF } = window.jspdf;
  const list = window.HistoryManager.load();
  const r = list[index];
  if (!r) return;

  const doc = new jsPDF();
  renderReport(doc, r, { photoMode: 'gallery' });
  doc.save((r.plate||"raportti")+"_raportti.pdf");
}

function generateCompanyPdf(company) {
  if (!window.HistoryManager) return alert('Historia ei saatavilla');
  const raw = window.HistoryManager.load().filter(r => (r.company||"Ilman yritystä") === company);
  // Keep newest-first but only the newest record per vehicle (plate)
  const reversed = raw.slice().reverse();
  const seen = new Set();
  const list = [];
  for (const r of reversed) {
    if (!seen.has(r.plate)) { seen.add(r.plate); list.push(r); }
  }
  if (!list.length) return alert('Ei raportteja valitulle yritykselle');

  // If real jsPDF is available, produce a single PDF with one vehicle per page
  if (window.jspdf && window.jspdf.jsPDF && typeof window.jspdf.jsPDF === 'function') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    list.forEach((r, idx) => {
      if (idx > 0) doc.addPage();
      renderReport(doc, r, { photoMode: 'gallery' });
    });

    doc.save((company||'yritys')+"_raportit.pdf");
    return;
  }

  // Fallback: open printable HTML
  let html = '<!doctype html><html><head><meta charset="utf-8"><title>Raportit '+(company||'')+'</title>'+
    '<style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:12px} .page{page-break-after:always;margin-bottom:12px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:6px;text-align:left} .diagram{display:flex;flex-direction:column;gap:6px;margin:6px 0 12px} .diagram-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px} .diagram-side{display:flex;gap:6px;justify-content:flex-start} .diagram-side.right{justify-content:flex-end} .diagram-tire{width:20px;height:36px;border:1px solid #222;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;background:linear-gradient(180deg,#3a3a3a,#111)} .diagram-label{font-size:10px;color:#333}</style></head><body>';

  list.forEach(r=>{
    html += `<div class="page"><h2>Rek ${r.plate} — ${r.date}</h2><p>Yritys: ${r.company||'-'}<br/>Tyyppi: ${r.type||'-'}</p>`;
    html += '<h3>Akselikonfiguraatio</h3><table><tr><th>Akseli</th><th>Koko</th><th>Vanne</th><th>ET</th></tr>';
    (r.config && r.config.data || []).forEach((a,i)=>{ html += `<tr><td>${i+1}</td><td>${a.size||'-'}</td><td>${a.rim||'-'}</td><td>${a.et||'-'}</td></tr>`; });
    html += '</table>';
    html += '<h3>Rengaskartta</h3>';
    html += buildDiagramHtml(r.config, r.values || []);
    html += '<h3>Mittaukset</h3><table><tr><th>Sijainti</th><th>Koko</th><th>Merkki</th><th>ET</th><th>Mitta</th><th>Kuluminen</th><th>Huomio</th><th>Kuva</th></tr>';
    (r.positions || []).forEach((p,i)=>{
      const v = r.values && r.values[i];
      const w = r.wear && r.wear[i];
      const size = r.tireSizes && r.tireSizes[i] ? r.tireSizes[i] : "-";
      const maker = r.tireMakes && r.tireMakes[i] ? r.tireMakes[i] : "-";
      const et = r.tireEts && r.tireEts[i] ? r.tireEts[i] : "-";
      let note = r.notes && r.notes[i] ? r.notes[i] : "";
      if (!note) { if (v<2) note = 'Vaihda'; else if (v<4) note = 'Seurattava'; }
      const photo = r.photos && r.photos[i] ? r.photos[i] : null;
      html += `<tr><td>${p}</td><td>${size}</td><td>${maker}</td><td>${et}</td><td>${v}</td><td>${w!=null?w:'-'}</td><td>${note||'-'}</td><td>${photo?`<img src="${photo}" style="max-width:160px;max-height:90px">`:'-'}</td></tr>`;
    });
    html += '</table></div>';
  });
  html += '</body></html>';
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url);
}

function generateVehiclePdf(plate) {
  if (!window.HistoryManager) return alert('Historia ei saatavilla');
  const raw = window.HistoryManager.load().filter(r => r.plate === plate);
  if (!raw.length) return alert('Ei raportteja valitulle ajoneuvolle');

  // If real jsPDF is available, produce a single PDF with one record per page
  if (window.jspdf && window.jspdf.jsPDF && typeof window.jspdf.jsPDF === 'function') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    raw.forEach((r, idx) => {
      if (idx > 0) doc.addPage();
      renderReport(doc, r, { photoMode: 'gallery' });
    });

    doc.save((plate||'ajoneuvo')+"_raportit.pdf");
    return;
  }

  // Fallback: open printable HTML
  let html = '<!doctype html><html><head><meta charset="utf-8"><title>Raportit '+plate+'</title>'+
    '<style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:12px} .page{page-break-after:always;margin-bottom:12px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:6px;text-align:left} .diagram{display:flex;flex-direction:column;gap:6px;margin:6px 0 12px} .diagram-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px} .diagram-side{display:flex;gap:6px;justify-content:flex-start} .diagram-side.right{justify-content:flex-end} .diagram-tire{width:20px;height:36px;border:1px solid #222;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;background:linear-gradient(180deg,#3a3a3a,#111)} .diagram-label{font-size:10px;color:#333}</style></head><body>';

  raw.forEach(r=>{
    html += `<div class="page"><h2>Rek ${r.plate} — ${r.date}</h2><p>Yritys: ${r.company||'-'}<br/>Tyyppi: ${r.type||'-'}</p>`;
    html += '<h3>Akselikonfiguraatio</h3><table><tr><th>Akseli</th><th>Koko</th><th>Vanne</th><th>ET</th></tr>';
    (r.config && r.config.data || []).forEach((a,i)=>{ html += `<tr><td>${i+1}</td><td>${a.size||'-'}</td><td>${a.rim||'-'}</td><td>${a.et||'-'}</td></tr>`; });
    html += '</table>';
    html += '<h3>Rengaskartta</h3>';
    html += buildDiagramHtml(r.config, r.values || []);
    html += '<h3>Mittaukset</h3><table><tr><th>Sijainti</th><th>Koko</th><th>Merkki</th><th>ET</th><th>Mitta</th><th>Kuluminen</th><th>Huomio</th><th>Kuva</th></tr>';
    (r.positions || []).forEach((p,i)=>{
      const v = r.values && r.values[i];
      const w = r.wear && r.wear[i];
      const size = r.tireSizes && r.tireSizes[i] ? r.tireSizes[i] : "-";
      const maker = r.tireMakes && r.tireMakes[i] ? r.tireMakes[i] : "-";
      const et = r.tireEts && r.tireEts[i] ? r.tireEts[i] : "-";
      let note = r.notes && r.notes[i] ? r.notes[i] : "";
      if (!note) { if (v<2) note = 'Vaihda'; else if (v<4) note = 'Seurattava'; }
      const photo = r.photos && r.photos[i] ? r.photos[i] : null;
      html += `<tr><td>${p}</td><td>${size}</td><td>${maker}</td><td>${et}</td><td>${v}</td><td>${w!=null?w:'-'}</td><td>${note||'-'}</td><td>${photo?`<img src="${photo}" style="max-width:160px;max-height:90px">`:'-'}</td></tr>`;
    });
    html += '</table></div>';
  });
  html += '</body></html>';
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url);
}

// Export to window
window.generatePdf = generatePdf;
window.generateCompanyPdf = generateCompanyPdf;
window.generateVehiclePdf = generateVehiclePdf;
