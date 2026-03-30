// PDF Rendering Functions

function getDefaultReportThresholds() {
  if (typeof window.getDefaultMeasureThresholds === 'function') {
    return window.getDefaultMeasureThresholds();
  }
  return { danger: 5, warning: 9 };
}

function getReportThresholds(company) {
  if (typeof window.getCompanyMeasureThresholds === 'function') {
    return window.getCompanyMeasureThresholds(company || '');
  }
  return getDefaultReportThresholds();
}

function getTireColor(value, thresholds) {
  const limits = thresholds || getDefaultReportThresholds();
  const v = Number(value || 0);
  if (v <= limits.danger) return { r: 255, g: 220, b: 220, css: '#fee2e2', text: '#991b1b' };
  if (v <= limits.warning) return { r: 255, g: 243, b: 199, css: '#fef3c7', text: '#92400e' };
  return { r: 220, g: 255, b: 220, css: '#dcfce7', text: '#166534' };
}

function hasMeasurementValue(value) {
  if (value == null) return false;
  const raw = String(value).trim();
  if (!raw) return false;
  return Number.isFinite(Number(raw.replace(',', '.')));
}

function drawTireDiagram(doc, config, values, startX, startY, options={}) {
  if (!config || !config.data || !config.data.length) return startY;

  const rowHeight = options.rowHeight || 10;
  const tireW = options.tireW || 6;
  const tireH = options.tireH || 12;
  const tireR = options.tireR || 3;
  const gap = options.gap || 8;
  const leftX = startX + (options.leftOffset || 0);
  const rightX = startX + (options.rightOffset || 110);
  const labelX = startX + (options.labelOffset || 50);
  const fontSize = options.fontSize || 8;
  const detailByIndex = options.detailByIndex || null;
  const detailMetaByIndex = options.detailMetaByIndex || null;
  const detailFontSize = options.detailFontSize || 6.8;
  const detailLineHeight = options.detailLineHeight || 3.1;
  const detailPadding = options.detailPadding || 1.6;
  const leftDetailMaxWidth = options.leftDetailMaxWidth || 34;
  const rightDetailMaxWidth = options.rightDetailMaxWidth || 40;
  const detailLayout = options.detailLayout || 'side';
  const symmetricCenterX = typeof options.symmetricCenterX === 'number' ? options.symmetricCenterX : null;
  const sideGap = typeof options.sideGap === 'number' ? options.sideGap : 180;
  const showAxleLabels = options.showAxleLabels !== false;
  const minDetailFontSize = options.minDetailFontSize || 4.6;

  const leftCount = config.data.reduce((sum,a)=> sum + (a.type === 'dual' ? 2 : 1), 0);
  let leftIndex = 0;
  let rightIndex = leftCount;
  const thresholds = options.thresholds || getDefaultReportThresholds();

  doc.setFontSize(fontSize);

  function getDetailText(index) {
    if (!detailByIndex) return '';
    return String(detailByIndex[index] || '').trim();
  }

  function getDetailMeta(index) {
    if (!detailMetaByIndex) return {};
    return detailMetaByIndex[index] || {};
  }

  function buildSideDetail(indices) {
    if (!indices || !indices.length) {
      return { text: '', isHighlighted: false };
    }

    const texts = [];
    let isHighlighted = false;

    indices.forEach(idx=>{
      const text = getDetailText(idx);
      if (text) texts.push(text);
      if (getDetailMeta(idx).highlight) isHighlighted = true;
    });

    return {
      text: texts.join('\n\n'),
      isHighlighted
    };
  }

  function getDetailLines(text) {
    if (!text) return [];
    return String(text || '')
      .split('\n')
      .map(line=>String(line || '').trim())
      .filter(Boolean);
  }

  function fitDetailFontSize(line, maxWidth) {
    let size = detailFontSize;
    const text = String(line || '').trim();
    if (!text) return size;

    while (size > minDetailFontSize) {
      doc.setFontSize(size);
      if (doc.getTextWidth(text) <= maxWidth) {
        return size;
      }
      size = Number((size - 0.2).toFixed(2));
    }
    return minDetailFontSize;
  }

  function truncateToWidth(text, maxWidth) {
    let value = String(text || '').trim();
    if (!value) return '';
    if (doc.getTextWidth(value) <= maxWidth) return value;

    while (value.length > 1 && doc.getTextWidth(value + '...') > maxWidth) {
      value = value.slice(0, -1);
    }
    return value.length ? (value + '...') : '...';
  }

  function getTextHeight(text, maxWidth) {
    const lineCount = getDetailLines(text).length;
    if (!lineCount) return 0;
    return (lineCount * detailLineHeight) + (detailPadding * 2) + 1;
  }

  function drawDetailBlock(text, x, y, maxWidth, options={}) {
    if (!text) return;
    const lines = getDetailLines(text);
    if (!lines.length) return;
    const textInsetX = detailPadding;
    const innerWidth = Math.max(4, maxWidth - (textInsetX * 2));
    const isHighlighted = !!options.isHighlighted;

    const boxH = (lines.length * detailLineHeight) + (detailPadding * 2) + 1;
    doc.setFillColor(255, 255, 255);
    if (isHighlighted) {
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.7);
    } else {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
    }
    doc.roundedRect(x, y, maxWidth, boxH, 1.4, 1.4, 'FD');
    doc.setLineWidth(0.2);

    doc.setTextColor(55, 65, 81);
    lines.forEach((line, index)=>{
      const fittedSize = fitDetailFontSize(line, innerWidth);
      doc.setFontSize(fittedSize);
      const safeLine = truncateToWidth(line, innerWidth);
      doc.text(safeLine, x + textInsetX, y + detailPadding + 2 + (index * detailLineHeight));
    });
    doc.setFontSize(fontSize);
    doc.setTextColor(17, 24, 39);
  }

  function drawTire(x, y, value) {
    if (!hasMeasurementValue(value)) {
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, tireW, tireH, tireR, tireR, 'FD');
      return;
    }

    const color = getTireColor(value, thresholds);
    doc.setDrawColor(55, 65, 81);
    doc.setFillColor(color.r, color.g, color.b);
    doc.roundedRect(x, y, tireW, tireH, tireR, tireR, 'FD');
    doc.setTextColor(17, 24, 39);
    doc.text(formatMmValue(value), x + tireW / 2, y + (tireH / 2) + 2, { align: 'center' });
  }

  let y = startY;

  config.data.forEach((axle, idx)=>{
    const rowY = y;
    if (showAxleLabels) {
      doc.text(`A${idx+1}`, labelX, rowY + 4);
    }

    const isDual = axle.type === 'dual';
    let leftIndices = [];
    let rightIndices = [];
    const dualSpan = (tireW * 2) + gap;
    const maxSideSpan = dualSpan;

    let rowLeftGroupX = leftX;
    let rowRightGroupX = rightX;
    if (symmetricCenterX != null) {
      rowLeftGroupX = symmetricCenterX - (sideGap / 2) - maxSideSpan;
      rowRightGroupX = symmetricCenterX + (sideGap / 2);
    }

    let leftStartX = rowLeftGroupX;
    let rightStartX = rowRightGroupX;

    if (!isDual) {
      // Center a single tire inside the same visual side width as a dual axle.
      const inset = (maxSideSpan - tireW) / 2;
      leftStartX = rowLeftGroupX + inset;
      rightStartX = rowRightGroupX + inset;
      if (detailLayout !== 'below' && symmetricCenterX == null) {
        rightStartX = rightX + gap;
      }
    }

    if (isDual) {
      const leftOuter = leftIndex++;
      const leftInner = leftIndex++;
      const rightInner = rightIndex++;
      const rightOuter = rightIndex++;
      leftIndices = [leftOuter, leftInner];
      rightIndices = [rightInner, rightOuter];

      drawTire(leftStartX, rowY, values[leftOuter]);
      drawTire(leftStartX + gap, rowY, values[leftInner]);
      drawTire(rightStartX, rowY, values[rightInner]);
      drawTire(rightStartX + gap, rowY, values[rightOuter]);
    } else {
      const leftPos = leftIndex++;
      const rightPos = rightIndex++;
      leftIndices = [leftPos];
      rightIndices = [rightPos];
      drawTire(leftStartX, rowY, values[leftPos]);
      drawTire(rightStartX, rowY, values[rightPos]);
    }

    const leftDetail = buildSideDetail(leftIndices);
    const rightDetail = buildSideDetail(rightIndices);
    const leftHeight = getTextHeight(leftDetail.text, leftDetailMaxWidth);
    const rightHeight = getTextHeight(rightDetail.text, rightDetailMaxWidth);

    let contentHeight = Math.max(tireH, leftHeight, rightHeight);
    if (detailLayout === 'below') {
      const leftTireSpan = isDual ? dualSpan : tireW;
      const rightTireSpan = isDual ? dualSpan : tireW;
      const leftCenterX = leftStartX + (leftTireSpan / 2);
      const rightCenterX = rightStartX + (rightTireSpan / 2);
      const leftDetailX = leftCenterX - (leftDetailMaxWidth / 2);
      const rightDetailX = rightCenterX - (rightDetailMaxWidth / 2);

      drawDetailBlock(leftDetail.text, leftDetailX, rowY + tireH + 1, leftDetailMaxWidth, { isHighlighted: leftDetail.isHighlighted });
      drawDetailBlock(rightDetail.text, rightDetailX, rowY + tireH + 1, rightDetailMaxWidth, { isHighlighted: rightDetail.isHighlighted });

      const belowHeight = Math.max(leftHeight, rightHeight);
      contentHeight = tireH + (belowHeight > 0 ? (belowHeight + 3) : 0);
    } else {
      // Left side details are shown to the right of the left tires.
      drawDetailBlock(leftDetail.text, leftX + gap + tireW + 2, rowY, leftDetailMaxWidth, { isHighlighted: leftDetail.isHighlighted });
      // Right side details are shown on the tire side (left of right tires).
      drawDetailBlock(rightDetail.text, rightX - rightDetailMaxWidth - 2, rowY, rightDetailMaxWidth, { isHighlighted: rightDetail.isHighlighted });
    }

    y += Math.max(rowHeight, contentHeight + 2);
  });

  return y;
}

function buildDiagramHtml(config, values, thresholds) {
  if (!config || !config.data || !config.data.length) return '';

  const leftCount = config.data.reduce((sum,a)=> sum + (a.type === 'dual' ? 2 : 1), 0);
  let leftIndex = 0;
  let rightIndex = leftCount;
  const limits = thresholds || getDefaultReportThresholds();

  function buildTireHtml(value) {
    if (!hasMeasurementValue(value)) {
      return '<div class="diagram-tire" style="background:#fff;color:#64748b;border-color:#cbd5e1;"></div>';
    }
    const color = getTireColor(value, limits);
    return `<div class="diagram-tire" style="background:${color.css};color:${color.text};border-color:${color.text};">${formatMmValue(value)}</div>`;
  }

  let html = '<div class="diagram">';
  config.data.forEach((axle, idx)=>{
    const isDual = axle.type === 'dual';
    html += '<div class="diagram-row">';
    html += '<div class="diagram-side">';
    if (isDual) {
      html += buildTireHtml(values[leftIndex++]);
      html += buildTireHtml(values[leftIndex++]);
    } else {
      html += buildTireHtml(values[leftIndex++]);
    }
    html += '</div>';
    html += `<div class="diagram-label">A${idx+1}</div>`;
    html += '<div class="diagram-side right">';
    if (isDual) {
      html += buildTireHtml(values[rightIndex++]);
      html += buildTireHtml(values[rightIndex++]);
    } else {
      html += buildTireHtml(values[rightIndex++]);
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

function drawReportHeader(doc, r, y, page) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.rect(page.left, y, page.right - page.left, 16, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(15);
  doc.text('Rengastarkastusraportti', page.left + 4, y + 11);
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(r.date || '', page.right - 2, y + 11, { align: 'right' });
  return y + 22;
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

function parseWorkItems(raw) {
  const text = String(raw || '');
  const items = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(') {
      depth++;
      current += ch;
      continue;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }
    if (ch === ',' && depth === 0) {
      const item = current.trim();
      if (item) items.push(item);
      current = '';
      continue;
    }
    current += ch;
  }

  const tail = current.trim();
  if (tail) items.push(tail);
  return items;
}

function isRimChangeWork(work) {
  return /^Vanteen vaihto(\s*\(|$)/i.test(String(work || '').trim());
}

function getReportWorkItems(raw) {
  return parseWorkItems(raw).filter(item => !isRimChangeWork(item));
}

function buildWorkProductLabel(r, index) {
  const make = r.tireMakes && r.tireMakes[index] ? r.tireMakes[index] : '';
  const size = r.tireSizes && r.tireSizes[index] ? r.tireSizes[index] : '';

  const isSizeOnlyTyreLabel = (value)=>{
    const text = String(value || '').trim().toUpperCase();
    if (!text) return false;
    const match = text.match(/^\d{3}\/\d{2}R\d{2}(?:[.,]\d)?C?$/);
    return !!match;
  };

  const normalizedMake = String(make || '').trim();
  if (normalizedMake && !isSizeOnlyTyreLabel(normalizedMake)) {
    return normalizedMake;
  }

  return '-';
}

function buildWorkSummaryRows(r) {
  const workSummary = new Map();
  const productSummary = new Map();
  const positions = r.positions || [];

  positions.forEach((_, i)=>{
    const items = parseWorkItems(r.tireWorks && r.tireWorks[i] ? r.tireWorks[i] : '');

    const reportItems = items.filter(item => !isRimChangeWork(item));

    reportItems.forEach(work=>{
      workSummary.set(work, (workSummary.get(work) || 0) + 1);
    });

    const hasTireChange = !!(r.tireChanges && r.tireChanges[i]);
    if (hasTireChange) {
      const tireProduct = buildWorkProductLabel(r, i);
      if (tireProduct && tireProduct !== '-') {
        const key = tireProduct;
        productSummary.set(key, (productSummary.get(key) || 0) + 1);
      }
    }

    const hasRimWork = items.some(isRimChangeWork);

    if (hasRimWork) {
      const rimFromWork = items
        .map(work=>{
          const match = String(work || '').trim().match(/^Vanteen vaihto\s*\(([^)]+)\)$/i);
          return match && match[1] ? match[1].trim() : '';
        })
        .find(Boolean);
      const rimProduct = rimFromWork || (r.tireRims && r.tireRims[i] ? r.tireRims[i] : '');
      if (rimProduct) {
        const key = rimProduct;
        productSummary.set(key, (productSummary.get(key) || 0) + 1);
      }
    }
  });

  const rows = [];
  [...workSummary.entries()]
    .sort((a,b)=>a[0].localeCompare(b[0], 'fi-FI'))
    .forEach(([work, count])=>{
      rows.push([work, `${count} kpl`]);
    });

  [...productSummary.entries()]
    .sort((a,b)=>a[0].localeCompare(b[0], 'fi-FI'))
    .forEach(([product, count])=>{
      rows.push([product, `${count} kpl`]);
    });

  return rows;
}

function renderReport(doc, r, options={}) {
  const page = { left: 20, right: 190, top: 18, bottom: 280 };
  let y = page.top;
  const isWorkReport = (r.mode === 'work');
  const thresholds = getReportThresholds(r && r.company ? r.company : '');

  y = drawReportHeader(doc, r, y, page);

  y = drawSectionTitle(doc, "Ajoneuvon tiedot", y, page);
  y = drawKeyValues(doc, y, [
    { label: "Rek", value: r.plate || "-" },
    { label: "Yritys", value: r.company || "-" },
    { label: "Ajokilometrit", value: (r.ajokilometrit != null && String(r.ajokilometrit).trim() !== '') ? `${r.ajokilometrit} km` : "-" },
    { label: "Merkki", value: r.make || "-" },
    { label: "Malli", value: r.model || "-" },
    { label: "Tyyppi", value: r.type || "-" },
    { label: "Akselien lkm", value: r.config && r.config.data ? String(r.config.data.length) : "-" }
  ], page);

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
  if (!isWorkReport) {
    y = drawSectionTitle(doc, "Akselikonfiguraatio", y, page);
    y = drawTable(doc, y, ["Akseli","Koko","Vanne","ET"], axleRows, [16, 40, 30, 16], page);
  }

  if (!isWorkReport) {
    y = drawSectionTitle(doc, "Rengaskartta", y, page);
    y = ensureSpace(doc, y, 30, page);
    y = drawTireDiagram(doc, r.config, r.values || [], page.left, y, { rightOffset:110, labelOffset:50, tireW:6, tireH:12, tireR:3, gap:8, thresholds });
    y += 6;

    y = drawSectionTitle(doc, "Rengasmittaukset", y, page);
    const rows = (r.positions || []).map((p,i)=>{
      const v = r.values && r.values[i];
      const w = r.wear && r.wear[i];
      const size = r.tireSizes && r.tireSizes[i] ? r.tireSizes[i] : "-";
      const maker = r.tireMakes && r.tireMakes[i] ? r.tireMakes[i] : "-";
      let note = r.notes && r.notes[i] ? r.notes[i] : "";
      if (!note && hasMeasurementValue(v)) { if (v < 2) note = "Vaihda"; else if (v < 4) note = "Seurattava"; }
      return [p, size, maker, formatMmValue(v), w != null ? String(w) : "-", note || "-"];
    });
    y = drawTable(doc, y, ["Sijainti","Koko","Merkki","Mitta (mm)","Kuluminen","Huomio"], rows, [48, 36, 34, 20, 20, 32], page);
  }

  if (isWorkReport) {
    y = drawSectionTitle(doc, "Työyhteenveto", y, page);
    const workSummaryRows = buildWorkSummaryRows(r);
    if (!workSummaryRows.length) workSummaryRows.push(["-", "-"]);
    y = drawTable(doc, y, ["Nimike","Määrä"], workSummaryRows, [130, 40], page);
  }

  if (isWorkReport) {
    doc.addPage();
    y = drawReportHeader(doc, r, page.top, page);
    y = drawSectionTitle(doc, "Rengaskartta", y, page);
    y = ensureSpace(doc, y, 60, page);

    const buildTireLabel = (size, make)=>{
      const s = String(size || '').trim();
      const m = String(make || '').trim();
      if (!s) return m || '-';
      if (!m) return s;
      return String(m).toUpperCase().startsWith(String(s).toUpperCase()) ? m : `${s} ${m}`;
    };

    const buildOldTireLabel = (oldMake, oldRunko)=>{
      const make = String(oldMake || '').trim();
      const runko = String(oldRunko || '').trim();
      if (make && runko) return `${make} (${runko})`;
      if (make) return make;
      if (runko) return runko;
      return '';
    };

    const detailByIndex = {};
    const detailMetaByIndex = {};
    const isRetorqueWork = (work)=> /^Allevaihto$/i.test(String(work || '').trim());
    const retorquePositions = [];
    (r.positions || []).forEach((pos, i)=>{
      const items = parseWorkItems(r.tireWorks && r.tireWorks[i] ? r.tireWorks[i] : '');
      const works = items.filter(item => !isRimChangeWork(item)).join(', ') || '-';
      const hasTireChange = !!(r.tireChanges && r.tireChanges[i]);
      const needsRetorque = hasTireChange || items.some(isRetorqueWork);

      const lines = [String(pos || '-')];

      if (hasTireChange) {
        const newTire = buildTireLabel(
          r.tireSizes && r.tireSizes[i] ? r.tireSizes[i] : '',
          r.tireMakes && r.tireMakes[i] ? r.tireMakes[i] : ''
        );
        lines.push(newTire && newTire !== '-' ? `Rengas: ${newTire}` : 'Rengas vaihdettu');

        const oldTire = buildOldTireLabel(
          r.tireOldMakes && r.tireOldMakes[i] ? r.tireOldMakes[i] : '',
          r.tireOldRunkos && r.tireOldRunkos[i] ? r.tireOldRunkos[i] : ''
        );
        if (oldTire) {
          lines.push(`Vanha rengas: ${oldTire}`);
        }
      }

      const rimFromWork = items
        .map(work => {
          const match = String(work || '').trim().match(/^Vanteen vaihto\s*\(([^)]+)\)$/i);
          return match && match[1] ? match[1].trim() : '';
        })
        .find(Boolean);

      if (items.some(isRimChangeWork)) {
        const rimLabel = rimFromWork || (r.tireRims && r.tireRims[i] ? r.tireRims[i] : '');
        lines.push(rimLabel ? `Vanne: ${rimLabel}` : 'Vanne vaihdettu');
      }

      if (works !== '-') {
        lines.push(`Työt: ${works}`);
      }

      detailByIndex[i] = lines.join('\n');
      detailMetaByIndex[i] = { highlight: needsRetorque };
      if (needsRetorque) retorquePositions.push(String(pos || '-'));
    });

    if (retorquePositions.length) {
      y = ensureSpace(doc, y, 18, page);
      doc.setFontSize(14);
      doc.setTextColor(185, 28, 28);
      doc.text('JÄLKIKIRITYS VAADITAAN MERKITYILLE RENKAILLE', (page.left + page.right) / 2, y, { align: 'center' });
      doc.setTextColor(17, 24, 39);
      y += 10;
    }

    y = drawTireDiagram(doc, r.config, r.values || [], page.left, y, {
      leftOffset:9,
      rightOffset:139,
      labelOffset:50,
      tireW:7,
      tireH:14,
      tireR:3,
      gap:9,
      symmetricCenterX:(page.left + page.right) / 2,
      sideGap:74,
      thresholds,
      rowHeight:22,
      fontSize:10,
      showAxleLabels:false,
      detailByIndex,
      detailMetaByIndex,
      detailLayout:'below',
      detailFontSize:8.6,
      detailLineHeight:4.2,
      leftDetailMaxWidth:62,
      rightDetailMaxWidth:62,
      minDetailFontSize:7.4
    });
    y += 6;

  }

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
  const modeLabel = (r.mode === 'work') ? 'tyo' : 'mittaus';
  doc.save((r.plate||"raportti")+"_"+modeLabel+"_raportti.pdf");
}

function generateCompanyPdf(company, mode = 'all') {
  if (!window.HistoryManager) return alert('Historia ei saatavilla');
  const normalizedMode = mode || 'all';
  const raw = window.HistoryManager.load().filter(r => {
    if ((r.company||"Ilman yritystä") !== company) return false;
    if (normalizedMode === 'all') return true;
    const recMode = r.mode === 'work' ? 'work' : 'measurement';
    return recMode === normalizedMode;
  });
  // Keep newest-first but only the newest record per vehicle (plate)
  const reversed = raw.slice().reverse();
  const seen = new Set();
  const list = [];
  for (const r of reversed) {
    if (!seen.has(r.plate)) { seen.add(r.plate); list.push(r); }
  }
  if (!list.length) {
    const label = normalizedMode === 'work' ? 'töitä' : (normalizedMode === 'measurement' ? 'mittauksia' : 'raportteja');
    return alert(`Ei ${label} valitulle yritykselle`);
  }

  // If real jsPDF is available, produce a single PDF with one vehicle per page
  if (window.jspdf && window.jspdf.jsPDF && typeof window.jspdf.jsPDF === 'function') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    list.forEach((r, idx) => {
      if (idx > 0) doc.addPage();
      renderReport(doc, r, { photoMode: 'gallery' });
    });

    const suffix = normalizedMode === 'work' ? 'tyot' : (normalizedMode === 'measurement' ? 'mittaukset' : 'raportit');
    doc.save((company||'yritys')+`_${suffix}.pdf`);
    return;
  }

  // Fallback: open printable HTML
  const modeTitle = normalizedMode === 'work' ? 'Työt' : (normalizedMode === 'measurement' ? 'Mittaukset' : 'Raportit');
  let html = '<!doctype html><html><head><meta charset="utf-8"><title>'+modeTitle+' '+(company||'')+'</title>'+
    '<style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:12px} .page{page-break-after:always;margin-bottom:12px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:6px;text-align:left} .diagram{display:flex;flex-direction:column;gap:6px;margin:6px 0 12px} .diagram-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px} .diagram-side{display:flex;gap:6px;justify-content:flex-start} .diagram-side.right{justify-content:flex-end} .diagram-tire{width:20px;height:36px;border:1px solid #222;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;background:linear-gradient(180deg,#3a3a3a,#111)} .diagram-label{font-size:10px;color:#333}</style></head><body>';

  list.forEach(r=>{
    const isWorkReport = (r.mode === 'work');
    const km = (r.ajokilometrit != null && String(r.ajokilometrit).trim() !== '') ? `${r.ajokilometrit} km` : '-';
    const thresholds = getReportThresholds(r && r.company ? r.company : '');
    html += `<div class="page"><h2>Rek ${r.plate} — ${r.date}</h2><p>Yritys: ${r.company||'-'}<br/>Ajokilometrit: ${km}<br/>Tyyppi: ${r.type||'-'}</p>`;
    const cfgRows = ((r.config && r.config.data) || []).map((a, i)=>([
      i+1,
      a.size || '-',
      a.rim || '-',
      a.et || '-'
    ]));
    if (!isWorkReport) {
      html += '<h3>Akselikonfiguraatio</h3><table><tr><th>Akseli</th><th>Koko</th><th>Vanne</th><th>ET</th></tr>';
      cfgRows.forEach(row=>{ html += `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td></tr>`; });
      html += '</table>';
    }
    if (!isWorkReport) {
      html += '<h3>Rengaskartta</h3>';
      html += buildDiagramHtml(r.config, r.values || [], thresholds);
      html += '<h3>Mittaukset</h3><table><tr><th>Sijainti</th><th>Koko</th><th>Merkki</th><th>Mitta</th><th>Kuluminen</th><th>Huomio</th><th>Kuva</th></tr>';
      (r.positions || []).forEach((p,i)=>{
        const v = r.values && r.values[i];
        const w = r.wear && r.wear[i];
        const size = r.tireSizes && r.tireSizes[i] ? r.tireSizes[i] : "-";
        const maker = r.tireMakes && r.tireMakes[i] ? r.tireMakes[i] : "-";
        const newTire = r.tireRunkos && r.tireRunkos[i] ? r.tireRunkos[i] : ((r.tireNewRunkos && r.tireNewRunkos[i]) ? r.tireNewRunkos[i] : '-');
        let note = r.notes && r.notes[i] ? r.notes[i] : "";
        if (!note && hasMeasurementValue(v)) { if (v<2) note = 'Vaihda'; else if (v<4) note = 'Seurattava'; }
        const photo = r.photos && r.photos[i] ? r.photos[i] : null;
        const measureStyle = hasMeasurementValue(v)
          ? (()=>{
              const measureColor = getTireColor(v, thresholds);
              return `background:${measureColor.css};color:${measureColor.text};font-weight:600;`;
            })()
          : 'background:#fff;color:#64748b;';
        html += `<tr><td>${p}</td><td>${size}</td><td>${maker}</td><td style="${measureStyle}">${hasMeasurementValue(v) ? formatMmValue(v) : ''}</td><td>${w!=null?w:'-'}</td><td>${note||'-'}</td><td>${photo?`<img src="${photo}" style="max-width:160px;max-height:90px">`:'-'}</td></tr>`;
      });
      html += '</table>';
    }

    if (isWorkReport) {
      html += '<h3>Työyhteenveto</h3><table><tr><th>Nimike</th><th>Määrä</th></tr>';
      const workSummaryRows = buildWorkSummaryRows(r);
      if (!workSummaryRows.length) {
        html += '<tr><td>-</td><td>-</td></tr>';
      } else {
        workSummaryRows.forEach(row=>{
          html += `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`;
        });
      }
      html += '</table>';

      html += '</div><div class="page"><h3>Rengaskartta</h3>';
      html += buildDiagramHtml(r.config, r.values || [], thresholds);
    }
    html += '</div>';
  });
  html += '</body></html>';
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url);
}

function generateVehiclePdf(plate, mode = 'all') {
  if (!window.HistoryManager) return alert('Historia ei saatavilla');
  const normalizedMode = mode || 'all';
  const raw = window.HistoryManager.load().filter(r => {
    if (r.plate !== plate) return false;
    if (normalizedMode === 'all') return true;
    const recMode = r.mode === 'work' ? 'work' : 'measurement';
    return recMode === normalizedMode;
  });
  if (!raw.length) {
    const label = normalizedMode === 'work' ? 'töitä' : (normalizedMode === 'measurement' ? 'mittauksia' : 'raportteja');
    return alert(`Ei ${label} valitulle ajoneuvolle`);
  }

  // If real jsPDF is available, produce a single PDF with one record per page
  if (window.jspdf && window.jspdf.jsPDF && typeof window.jspdf.jsPDF === 'function') {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    raw.forEach((r, idx) => {
      if (idx > 0) doc.addPage();
      renderReport(doc, r, { photoMode: 'gallery' });
    });

    const suffix = normalizedMode === 'work' ? 'tyot' : (normalizedMode === 'measurement' ? 'mittaukset' : 'raportit');
    doc.save((plate||'ajoneuvo')+`_${suffix}.pdf`);
    return;
  }

  // Fallback: open printable HTML
  const modeTitle = normalizedMode === 'work' ? 'Työt' : (normalizedMode === 'measurement' ? 'Mittaukset' : 'Raportit');
  let html = '<!doctype html><html><head><meta charset="utf-8"><title>'+modeTitle+' '+plate+'</title>'+
    '<style>body{font-family:Arial,Helvetica,sans-serif;font-size:12px;padding:12px} .page{page-break-after:always;margin-bottom:12px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:6px;text-align:left} .diagram{display:flex;flex-direction:column;gap:6px;margin:6px 0 12px} .diagram-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px} .diagram-side{display:flex;gap:6px;justify-content:flex-start} .diagram-side.right{justify-content:flex-end} .diagram-tire{width:20px;height:36px;border:1px solid #222;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#fff;background:linear-gradient(180deg,#3a3a3a,#111)} .diagram-label{font-size:10px;color:#333}</style></head><body>';

  raw.forEach(r=>{
    const isWorkReport = (r.mode === 'work');
    const km = (r.ajokilometrit != null && String(r.ajokilometrit).trim() !== '') ? `${r.ajokilometrit} km` : '-';
    const thresholds = getReportThresholds(r && r.company ? r.company : '');
    html += `<div class="page"><h2>Rek ${r.plate} — ${r.date}</h2><p>Yritys: ${r.company||'-'}<br/>Ajokilometrit: ${km}<br/>Tyyppi: ${r.type||'-'}</p>`;
    const cfgRows = ((r.config && r.config.data) || []).map((a, i)=>([
      i+1,
      a.size || '-',
      a.rim || '-',
      a.et || '-'
    ]));
    if (!isWorkReport) {
      html += '<h3>Akselikonfiguraatio</h3><table><tr><th>Akseli</th><th>Koko</th><th>Vanne</th><th>ET</th></tr>';
      cfgRows.forEach(row=>{ html += `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td></tr>`; });
      html += '</table>';
    }
    if (!isWorkReport) {
      html += '<h3>Rengaskartta</h3>';
      html += buildDiagramHtml(r.config, r.values || [], thresholds);
      html += '<h3>Mittaukset</h3><table><tr><th>Sijainti</th><th>Koko</th><th>Merkki</th><th>Mitta</th><th>Kuluminen</th><th>Huomio</th><th>Kuva</th></tr>';
      (r.positions || []).forEach((p,i)=>{
        const v = r.values && r.values[i];
        const w = r.wear && r.wear[i];
        const size = r.tireSizes && r.tireSizes[i] ? r.tireSizes[i] : "-";
        const maker = r.tireMakes && r.tireMakes[i] ? r.tireMakes[i] : "-";
        const newTire = r.tireRunkos && r.tireRunkos[i] ? r.tireRunkos[i] : ((r.tireNewRunkos && r.tireNewRunkos[i]) ? r.tireNewRunkos[i] : '-');
        let note = r.notes && r.notes[i] ? r.notes[i] : "";
        if (!note && hasMeasurementValue(v)) { if (v<2) note = 'Vaihda'; else if (v<4) note = 'Seurattava'; }
        const photo = r.photos && r.photos[i] ? r.photos[i] : null;
        const measureStyle = hasMeasurementValue(v)
          ? (()=>{
              const measureColor = getTireColor(v, thresholds);
              return `background:${measureColor.css};color:${measureColor.text};font-weight:600;`;
            })()
          : 'background:#fff;color:#64748b;';
        html += `<tr><td>${p}</td><td>${size}</td><td>${maker}</td><td style="${measureStyle}">${hasMeasurementValue(v) ? formatMmValue(v) : ''}</td><td>${w!=null?w:'-'}</td><td>${note||'-'}</td><td>${photo?`<img src="${photo}" style="max-width:160px;max-height:90px">`:'-'}</td></tr>`;
      });
      html += '</table>';
    }

    if (isWorkReport) {
      html += '<h3>Työyhteenveto</h3><table><tr><th>Nimike</th><th>Määrä</th></tr>';
      const workSummaryRows = buildWorkSummaryRows(r);
      if (!workSummaryRows.length) {
        html += '<tr><td>-</td><td>-</td></tr>';
      } else {
        workSummaryRows.forEach(row=>{
          html += `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`;
        });
      }
      html += '</table>';

      html += '</div><div class="page"><h3>Rengaskartta</h3>';
      html += buildDiagramHtml(r.config, r.values || [], thresholds);
    }
    html += '</div>';
  });
  html += '</body></html>';
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url);
}

function generateCompanyFleetOverviewReport(company) {
  if (!window.HistoryManager) return alert('Historia ei saatavilla');

  const all = window.HistoryManager.load().filter(r =>
    (r.company || 'Ilman yritystä') === company &&
    (r.mode || 'measurement') !== 'work'
  );

  if (!all.length) return alert('Ei mittauksia yritykselle: ' + company);

  // Latest measurement per plate
  const reversed = all.slice().reverse();
  const seen = new Set();
  const latestPerPlate = [];
  for (const r of reversed) {
    if (!seen.has(r.plate)) {
      seen.add(r.plate);
      latestPerPlate.push(r);
    }
  }
  latestPerPlate.sort((a, b) => String(a.plate).localeCompare(String(b.plate), 'fi-FI'));

  const thresholds = getReportThresholds(company);

  // Build per-axle tire groups from record config + positions + values
  function buildAxleGroups(r) {
    const cfg = r.config && r.config.data ? r.config.data : [];
    const positions = r.positions || [];
    const vals = r.values || [];
    if (!cfg.length) {
      // No config: flat list
      return positions.map((p, i) => ({ axle: null, tires: [{ label: p, value: vals[i] }] }));
    }
    const totalLeft = cfg.reduce((sum, a) => sum + (a.type === 'dual' ? 2 : 1), 0);
    let li = 0, ri = totalLeft;
    return cfg.map((axle, axleNum) => {
      const isDual = axle.type === 'dual';
      let tires;
      if (isDual) {
        tires = [
          { label: positions[li]   || ('A' + (axleNum+1) + ' vasen ulompi'),  value: vals[li] },
          { label: positions[li+1] || ('A' + (axleNum+1) + ' vasen sisempi'), value: vals[li+1] },
          { label: positions[ri]   || ('A' + (axleNum+1) + ' oikea sisempi'), value: vals[ri] },
          { label: positions[ri+1] || ('A' + (axleNum+1) + ' oikea ulompi'),  value: vals[ri+1] },
        ];
        li += 2; ri += 2;
      } else {
        tires = [
          { label: positions[li] || ('A' + (axleNum+1) + ' vasen'), value: vals[li] },
          { label: positions[ri] || ('A' + (axleNum+1) + ' oikea'), value: vals[ri] },
        ];
        li++; ri++;
      }
      return { axle: axleNum + 1, isDual, tires };
    });
  }

  // Determine worst status for a record (for summary badge)
  function worstStatus(r) {
    const vals = r.values || [];
    let worst = 'ok';
    vals.forEach(v => {
      if (!hasMeasurementValue(v)) return;
      const n = Number(v);
      if (n <= thresholds.danger) worst = 'danger';
      else if (n <= thresholds.warning && worst !== 'danger') worst = 'warning';
    });
    return worst;
  }

  // HTML report
  const dangerCount  = latestPerPlate.filter(r => worstStatus(r) === 'danger').length;
  const warningCount = latestPerPlate.filter(r => worstStatus(r) === 'warning').length;
  const okCount      = latestPerPlate.filter(r => worstStatus(r) === 'ok').length;

  let html = '<!doctype html><html><head><meta charset="utf-8"><title>Kalustoraportti ' + company + '</title><style>' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    'body{font-family:Arial,Helvetica,sans-serif;font-size:13px;background:#f1f5f9;color:#111827;padding:20px}' +
    '.report-header{background:#1e293b;color:#fff;border-radius:10px;padding:20px 24px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-end}' +
    '.report-title{font-size:20px;font-weight:700;margin-bottom:4px}' +
    '.report-sub{font-size:13px;color:#94a3b8}' +
    '.summary-pills{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap}' +
    '.pill{padding:6px 14px;border-radius:20px;font-size:13px;font-weight:600}' +
    '.pill-danger{background:#fee2e2;color:#991b1b}' +
    '.pill-warn{background:#fef3c7;color:#92400e}' +
    '.pill-ok{background:#dcfce7;color:#166534}' +
    '.pill-neutral{background:#e2e8f0;color:#475569}' +
    '.vehicle-card{background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.08);margin-bottom:16px;overflow:hidden}' +
    '.vehicle-header{display:flex;align-items:center;gap:16px;padding:12px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc}' +
    '.plate{font-size:18px;font-weight:800;letter-spacing:1px;color:#0f172a;min-width:90px}' +
    '.vehicle-meta{font-size:12px;color:#64748b;line-height:1.6}' +
    '.status-dot{width:12px;height:12px;border-radius:50%;display:inline-block;margin-left:auto;flex-shrink:0}' +
    '.dot-danger{background:#dc2626}' +
    '.dot-warning{background:#d97706}' +
    '.dot-ok{background:#16a34a}' +
    '.axles-grid{display:flex;flex-wrap:wrap;gap:0;padding:12px 16px}' +
    '.axle-group{display:flex;flex-direction:column;align-items:center;margin-right:20px;margin-bottom:8px}' +
    '.axle-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px}' +
    '.axle-tires{display:flex;gap:6px;align-items:flex-start}' +
    '.axle-side{display:flex;flex-direction:column;gap:6px}' +
    '.axle-divider{width:1px;background:#e2e8f0;margin:0 4px;align-self:stretch}' +
    '.tire-chip{display:flex;flex-direction:column;align-items:center;min-width:52px}' +
    '.tire-pos{font-size:9px;color:#94a3b8;margin-bottom:3px;text-align:center;line-height:1.2;max-width:60px}' +
    '.tire-val{font-size:14px;font-weight:800;border-radius:6px;padding:5px 8px;text-align:center;width:100%;line-height:1}' +
    '.tire-val-empty{background:#f1f5f9;color:#cbd5e1;border:1px dashed #cbd5e1}' +
    '@media print{body{background:#fff;padding:8px}.vehicle-card{box-shadow:none;border:1px solid #e2e8f0;break-inside:avoid}}' +
    '</style></head><body>';

  html += '<div class="report-header">';
  html += '<div><div class="report-title">Kalustoraportti</div><div class="report-sub">' + company + '</div></div>';
  html += '<div style="text-align:right;font-size:12px;color:#94a3b8">' + new Date().toLocaleDateString('fi-FI') + '<br>' + latestPerPlate.length + ' ajoneuvoa</div>';
  html += '</div>';

  html += '<div class="summary-pills">';
  if (dangerCount)  html += '<span class="pill pill-danger">&#9679; ' + dangerCount  + ' kriittinen</span>';
  if (warningCount) html += '<span class="pill pill-warn">&#9679; '   + warningCount + ' seurattava</span>';
  if (okCount)      html += '<span class="pill pill-ok">&#9679; '     + okCount      + ' kunnossa</span>';
  html += '<span class="pill pill-neutral">' + latestPerPlate.length + ' ajoneuvoa yhteensä</span>';
  html += '</div>';

  latestPerPlate.forEach(r => {
    const groups = buildAxleGroups(r);
    const status = worstStatus(r);
    const dotClass = status === 'danger' ? 'dot-danger' : status === 'warning' ? 'dot-warning' : 'dot-ok';
    const km = (r.ajokilometrit != null && String(r.ajokilometrit).trim() !== '') ? r.ajokilometrit + ' km' : null;

    html += '<div class="vehicle-card">';
    html += '<div class="vehicle-header">';
    html += '<span class="plate">' + r.plate + '</span>';
    html += '<div class="vehicle-meta">';
    if (r.type)  html += r.type + '<br>';
    if (r.make)  html += r.make + (r.model ? ' ' + r.model : '') + '<br>';
    if (km)      html += km + '<br>';
    html += r.date || '-';
    html += '</div>';
    html += '<span class="status-dot ' + dotClass + '" title="' + (status === 'danger' ? 'Kriittinen' : status === 'warning' ? 'Seurattava' : 'Kunnossa') + '"></span>';
    html += '</div>';

    html += '<div class="axles-grid">';
    groups.forEach(group => {
      html += '<div class="axle-group">';
      if (group.axle) html += '<div class="axle-label">Akseli ' + group.axle + '</div>';
      html += '<div class="axle-tires">';

      if (group.isDual) {
        // Left pair | divider | Right pair
        const [lo, li_, ri_, ro] = group.tires;
        html += '<div class="axle-side">';
        html += buildTireChipHtml(lo, thresholds);
        html += buildTireChipHtml(li_, thresholds);
        html += '</div>';
        html += '<div class="axle-divider"></div>';
        html += '<div class="axle-side">';
        html += buildTireChipHtml(ri_, thresholds);
        html += buildTireChipHtml(ro, thresholds);
        html += '</div>';
      } else {
        const [left, right] = group.tires;
        html += '<div class="axle-side">' + buildTireChipHtml(left, thresholds) + '</div>';
        html += '<div class="axle-divider"></div>';
        html += '<div class="axle-side">' + buildTireChipHtml(right, thresholds) + '</div>';
      }

      html += '</div></div>';
    });
    html += '</div></div>';
  });

  html += '</body></html>';

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url);
}

function buildTireChipHtml(tire, thresholds) {
  const label = String(tire.label || '')
    .replace(/^Akseli \d+ /i, '')   // strip "Akseli N " prefix — axle shown in axle-label
    .replace(/ulompi/i, 'ulompi')
    .replace(/sisempi/i, 'sisempi');

  if (!hasMeasurementValue(tire.value)) {
    return '<div class="tire-chip"><div class="tire-pos">' + label + '</div><div class="tire-val tire-val-empty">—</div></div>';
  }
  const color = getTireColor(tire.value, thresholds);
  return '<div class="tire-chip">' +
    '<div class="tire-pos">' + label + '</div>' +
    '<div class="tire-val" style="background:' + color.css + ';color:' + color.text + ';">' + formatMmValue(tire.value) + ' mm</div>' +
    '</div>';
}

function positionToShortCode(label) {
  const s = String(label || '').trim();
  // Match: "Akseli N vasen/oikea [ulompi/sisempi]"
  const m = s.match(/^Akseli\s+(\d+)\s+(vasen|oikea)(?:\s+(ulompi|sisempi))?$/i);
  if (!m) return s; // fallback: return as-is
  const n    = m[1];
  const side = m[2].toLowerCase() === 'vasen' ? 'V' : 'O';
  const qual = m[3] ? (m[3].toLowerCase() === 'ulompi' ? 'U' : 'S') : '';
  return side + n + qual;
}

function generateCompanyFleetTableReport(company) {
  if (!window.HistoryManager) return alert('Historia ei saatavilla');

  const all = window.HistoryManager.load().filter(r =>
    (r.company || 'Ilman yritystä') === company &&
    (r.mode || 'measurement') !== 'work'
  );
  if (!all.length) return alert('Ei mittauksia yritykselle: ' + company);

  // Latest measurement per plate
  const reversed = all.slice().reverse();
  const seen = new Set();
  const latestPerPlate = [];
  for (const r of reversed) {
    if (!seen.has(r.plate)) { seen.add(r.plate); latestPerPlate.push(r); }
  }
  latestPerPlate.sort((a, b) => String(a.plate).localeCompare(String(b.plate), 'fi-FI'));

  const thresholds = getReportThresholds(company);

  // Collect all unique position labels across all vehicles
  const allPositions = [];
  const positionSet = new Set();
  latestPerPlate.forEach(r => {
    (r.positions || []).forEach(p => {
      if (p && !positionSet.has(p)) { positionSet.add(p); allPositions.push(p); }
    });
  });

  // PDF version
  if (window.jspdf && window.jspdf.jsPDF) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // landscape
    const page = { left: 12, right: 284, top: 14, bottom: 198 };
    let y = page.top;

    // Header bar
    doc.setFillColor(30, 41, 59);
    doc.rect(page.left, y, page.right - page.left, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('Kalustoraportti (taulukko): ' + company, page.left + 4, y + 9);
    doc.setFontSize(8);
    doc.text(new Date().toLocaleDateString('fi-FI') + '  |  ' + latestPerPlate.length + ' ajoneuvoa', page.right - 3, y + 9, { align: 'right' });
    y += 18;

    // Build column widths: plate + date fixed, then equal share for each position
    const fixedW = 24 + 20; // plate + date
    const posW = Math.max(12, Math.min(22, Math.floor((page.right - page.left - fixedW) / Math.max(1, allPositions.length))));
    const colWidths = [24, 20, ...allPositions.map(() => posW)];
    const headers = ['Rekisteri', 'Päivä', ...allPositions.map(p => positionToShortCode(p))];

    const rows = latestPerPlate.map(r => {
      const rowVals = allPositions.map(pos => {
        const idx = (r.positions || []).indexOf(pos);
        if (idx === -1) return '-';
        const v = r.values && r.values[idx];
        return hasMeasurementValue(v) ? formatMmValue(v) : '-';
      });
      return [r.plate, r.date || '-', ...rowVals];
    });

    // Custom colored table draw
    const rowH = 7;
    const headerH = 8;
    const startX = page.left;

    function drawFleetHeader(yy) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.rect(startX, yy - 5, page.right - page.left, headerH, 'F');
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(7);
      let x = startX;
      headers.forEach((h, i) => {
        const maxC = Math.floor((colWidths[i] - 2) / 1.5);
        const txt = h.length > maxC ? h.substring(0, Math.max(1, maxC - 1)) + '…' : h;
        doc.text(txt, x + 1.5, yy);
        x += colWidths[i];
      });
      return yy + headerH;
    }

    y = drawFleetHeader(y);
    doc.setFontSize(7.5);

    rows.forEach((row, rowIdx) => {
      if (y + rowH > page.bottom) {
        doc.addPage();
        y = page.top;
        y = drawFleetHeader(y);
        doc.setFontSize(7.5);
      }
      if (rowIdx % 2 === 0) {
        doc.setFillColor(252, 252, 253);
        doc.rect(startX, y - 4, page.right - page.left, rowH, 'F');
      }
      let x = startX;
      row.forEach((cell, ci) => {
        if (ci >= 2) {
          // measurement cell — color background
          const pos = allPositions[ci - 2];
          const posIdx = (latestPerPlate[rowIdx].positions || []).indexOf(pos);
          const rawVal = posIdx !== -1 && latestPerPlate[rowIdx].values ? latestPerPlate[rowIdx].values[posIdx] : null;
          if (hasMeasurementValue(rawVal)) {
            const col = getTireColor(rawVal, thresholds);
            doc.setFillColor(col.r, col.g, col.b);
            doc.rect(x + 0.5, y - 3.5, colWidths[ci] - 1, rowH - 1, 'F');
            doc.setTextColor(col.text.startsWith('#99') ? 153 : (col.text.startsWith('#92') ? 146 : 22), col.text.startsWith('#99') ? 27 : (col.text.startsWith('#92') ? 64 : 101), col.text.startsWith('#99') ? 27 : (col.text.startsWith('#92') ? 14 : 52));
          } else {
            doc.setTextColor(148, 163, 184);
          }
        } else {
          doc.setTextColor(17, 24, 39);
          if (ci === 0) { doc.setFontSize(8); }
        }
        const maxC = Math.floor((colWidths[ci] - 2) / 1.5);
        const txt = String(cell);
        const safe = txt.length > maxC ? txt.substring(0, Math.max(1, maxC - 1)) + '…' : txt;
        doc.text(safe, x + 1.5, y);
        if (ci === 0) doc.setFontSize(7.5);
        x += colWidths[ci];
      });
      doc.setDrawColor(226, 232, 240);
      doc.line(startX, y + rowH - 4, page.right, y + rowH - 4);
      y += rowH;
    });

    doc.save((company || 'yritys') + '_kalustotaulukko.pdf');
    return;
  }

  // HTML fallback — compact table
  const colorStyle = (v) => {
    if (!hasMeasurementValue(v)) return 'background:#f8fafc;color:#cbd5e1;';
    const c = getTireColor(v, thresholds);
    return 'background:' + c.css + ';color:' + c.text + ';font-weight:700;';
  };

  let html = '<!doctype html><html><head><meta charset="utf-8"><title>Kalustotaulukko ' + company + '</title><style>' +
    '*{box-sizing:border-box;margin:0;padding:0}' +
    'body{font-family:Arial,Helvetica,sans-serif;font-size:12px;background:#f1f5f9;padding:16px;color:#111827}' +
    '.header{background:#1e293b;color:#fff;border-radius:8px;padding:14px 18px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center}' +
    '.header h2{font-size:16px;font-weight:700}' +
    '.header p{font-size:11px;color:#94a3b8;margin-top:2px}' +
    '.wrap{background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:auto}' +
    'table{border-collapse:collapse;width:100%;min-width:600px}' +
    'thead tr{background:#f8fafc}' +
    'th{padding:8px 10px;text-align:center;font-size:11px;color:#374151;font-weight:700;border-bottom:2px solid #e2e8f0;white-space:nowrap}' +
    'th.col-plate{text-align:left}' +
    'td{padding:6px 8px;text-align:center;border-bottom:1px solid #f1f5f9;font-size:12px;white-space:nowrap}' +
    'td.col-plate{text-align:left;font-weight:800;font-size:13px;letter-spacing:.5px}' +
    'td.col-date{color:#94a3b8;font-size:11px}' +
    'tr:hover td{background-color:rgba(0,0,0,.03)}' +
    '.val{display:block;border-radius:4px;padding:3px 0;font-size:12px}' +
    '@media print{body{background:#fff;padding:4px}.header{border-radius:0;margin-bottom:8px}.wrap{box-shadow:none}}' +
    '</style></head><body>';

  html += '<div class="header"><div><h2>Kalustotaulukko: ' + company + '</h2><p>' + new Date().toLocaleDateString('fi-FI') + ' &nbsp;|&nbsp; ' + latestPerPlate.length + ' ajoneuvoa</p></div></div>';
  html += '<div class="wrap"><table><thead><tr>';
  html += '<th class="col-plate">Rekisteri</th><th>Päivämäärä</th>';
  allPositions.forEach(p => {
    html += '<th title="' + p + '">' + positionToShortCode(p) + '</th>';
  });
  html += '</tr></thead><tbody>';

  latestPerPlate.forEach(r => {
    html += '<tr><td class="col-plate">' + r.plate + '</td><td class="col-date">' + (r.date || '-') + '</td>';
    allPositions.forEach(pos => {
      const idx = (r.positions || []).indexOf(pos);
      const v = idx !== -1 && r.values ? r.values[idx] : null;
      html += '<td><span class="val" style="' + colorStyle(v) + '">' + (hasMeasurementValue(v) ? formatMmValue(v) + ' mm' : '—') + '</span></td>';
    });
    html += '</tr>';
  });

  html += '</tbody></table></div></body></html>';
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url);
}

// Export to window
window.generatePdf = generatePdf;
window.generateCompanyPdf = generateCompanyPdf;
window.generateVehiclePdf = generateVehiclePdf;
window.generateCompanyFleetOverviewReport = generateCompanyFleetOverviewReport;
window.generateCompanyFleetTableReport = generateCompanyFleetTableReport;
