function generatePdf(index) {
  if (!window.HistoryManager) return alert('Historia ei saatavilla');
  if (!window.jspdf) return alert('jsPDF ei ladattu - lataa sivu palvelimelta tai lisää jspdf paikallisesti');
  const { jsPDF } = window.jspdf;
  const list = window.HistoryManager.load();
  const r = list[index];
  if (!r) return;

  const doc = new jsPDF();
  renderCompactReport(doc, r);
  doc.save((r.plate||"raportti")+"_raportti.pdf");
}

function renderCompactReport(doc, r) {
  let y = 20;
  doc.setFontSize(6);
  doc.text("Rengastarkastusraportti", 20, y);
  y += 4;

  doc.setFontSize(6);
  doc.text(`Rekisterinumero: ${r.plate}`, 20, y);
  y += 3;
  doc.text(`Yritys: ${r.company||"-"}`, 20, y);
  y += 3;
  doc.text(`Tyyppi: ${r.type||"-"}`, 20, y);
  y += 3;
  doc.text(`Päiväys: ${r.date}`, 20, y);
  y += 4;

  doc.setFontSize(6);
  doc.text("Rengasmittaukset", 20, y);
  y += 2;

  doc.setFontSize(6);
  doc.text("Sijainti", 20, y);
  doc.text("Koko", 34, y);
  doc.text("Merkki", 46, y);
  doc.text("Mitta", 58, y);
  doc.text("Kuluminen", 68, y);
  doc.text("Huomio", 78, y);
  y+=2;
  doc.line(20,y,110,y);
  y+=2;

  const maxY = 275;
  const rowHeight = 4;
  const maxRows = Math.floor((maxY-y)/rowHeight);
  let overflowRows = [];
  r.positions.forEach((p,i)=>{
    const v = r.values[i];
    const w = r.wear[i];
    let note = r.notes && r.notes[i] ? r.notes[i] : "";
    if (!note) {
      if (v<2) note="Vaihda";
      else if (v<4) note="Seurattava";
    }
    const spec = r.config ? getPositionSpec(r.config, i) : { size: '', make: '', rim: '' };
    if (i < maxRows) {
      doc.text(p, 20, y);
      doc.text(spec.size||"-", 34, y);
      doc.text(spec.make||"-", 46, y);
      doc.text(String(v), 58, y);
      doc.text(w!=null?String(w):"-", 68, y);
      // If photo exists, add it, else show note
      const photo = r.photos && r.photos[i] ? r.photos[i] : null;
      if (photo) {
        try {
          doc.addImage(photo, 'JPEG', 90, y-3, 12, 12);
        } catch(e) {
          doc.text(note||"-", 78, y);
        }
        y += 14; // increase row height for photo
      } else {
        doc.text(note||"-", 78, y);
        y += rowHeight;
      }
    } else {
      overflowRows.push(`${p} (${spec.size}, ${spec.make}, ${v}, ${w}, ${note})`);
    }
  });
  if (overflowRows.length > 0) {
    let summary = "Ylimääräiset rivit: ";
    summary += overflowRows.join("; ");
    doc.setFontSize(6);
    doc.text(summary, 20, y+2);
  }
}


// Generate PDF for all plates in company (newest inspection per plate)
function generatePdfByCompany(company) {
  if (!window.HistoryManager) return alert('Historia ei saatavilla');
  if (!window.jspdf) return alert('jsPDF ei ladattu - lataa sivu palvelimelta tai lisää jspdf paikallisesti');
  const { jsPDF } = window.jspdf;
  const list = window.HistoryManager.load();
  const companyReports = list.filter(r => (r.company||"Ilman yritystä") === company);
  
  if (!companyReports.length) return alert('Ei raportteja tälle yritykselle');

  // Get newest report per plate
  const latestPerPlate = {};
  companyReports.forEach(r => {
    if (!latestPerPlate[r.plate] || new Date(r.date) > new Date(latestPerPlate[r.plate].date)) {
      latestPerPlate[r.plate] = r;
    }
  });

  const reports = Object.values(latestPerPlate);
  const doc = new jsPDF();
  let isFirst = true;

  reports.forEach((r, idx) => {
    if (!isFirst) doc.addPage();
    isFirst = false;
    renderCompactReport(doc, r);
  });
  doc.save((company||"yritys")+"_raportti.pdf");
}

window.generatePdf = generatePdf;
window.generatePdfByCompany = generatePdfByCompany;
