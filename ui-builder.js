// UI Builder Functions

function buildAxleUI(containerEl, count, existing=[], StorageKeysRef, formatTyreSizeFn) {
  containerEl.innerHTML = "";

  for (let i=0;i<count;i++) {
    const d = existing[i] || {};

    const card = document.createElement("div");
    card.className = "axle-card";

    card.innerHTML = `
      <h3>Akseli ${i+1}</h3>
      <div class="settings-icon">⚙️</div>
      <div class="settings-menu">
        <div data-copy="size">Kopioi rengaskoko kaikille</div>
        <div data-copy="make">Kopioi merkki kaikille</div>
        <div data-copy="rim">Kopioi vanne kaikille</div>
        <div data-copy="et">Kopioi ET kaikille</div>
      </div>

      <label>Tyyppi</label>
      <select class="axle-type">
        <option value="single"${d.type==="single"?" selected":""}>Yksittäinen</option>
        <option value="dual"${d.type==="dual"?" selected":""}>Paripyörä</option>
      </select>

      <label>Rengaskoko</label>
        <input type="text" class="axle-size" value="${d.size||""}" placeholder="315/70R22.5" inputmode="numeric" pattern="[0-9]*">

      <label>Merkki ja malli</label>
      <input class="axle-make" value="${d.make||""}">

      <label>Vannetyyppi</label>
      <div class="rim-options">
        <label class="rim-option">
          <input type="radio" name="rim-${i}" value="Alumiini" ${!d.rim || d.rim==="Alumiini" ? "checked":""}>
          Alumiini
        </label>
        <label class="rim-option">
          <input type="radio" name="rim-${i}" value="Teräs" ${d.rim==="Teräs" ? "checked":""}>
          Teräs
        </label>
      </div>

      <label>ET-arvo</label>
      <input class="axle-et" value="${d.et||""}">
    `;

    containerEl.appendChild(card);

    setupTyreAutocomplete(card.querySelector(".axle-size"), StorageKeysRef.tyreSizes(), formatTyreSizeFn);
    setupTyreAutocomplete(card.querySelector(".axle-make"), StorageKeysRef.tyreMakes());
    setupTyreAutocomplete(card.querySelector(".axle-et"), StorageKeysRef.etValues());

    card.querySelector(".axle-size").addEventListener("blur", e=>{ e.target.value = formatTyreSizeFn(e.target.value); });

    const icon = card.querySelector(".settings-icon");
    const menu = card.querySelector(".settings-menu");

    icon.onclick = (e)=>{ e.stopPropagation(); document.querySelectorAll(".settings-menu").forEach(m=>m.style.display="none"); menu.style.display = "block"; };
    document.addEventListener("click", ()=>{ menu.style.display = "none"; });

    menu.querySelectorAll("[data-copy]").forEach(btn=>{
      btn.onclick = (e)=>{
        e.stopPropagation();
        const type = btn.dataset.copy;
        const cards = containerEl.querySelectorAll(".axle-card");

        if (type === "size") {
          const val = card.querySelector(".axle-size").value.trim();
          if (!val) return alert("Rengaskoko puuttuu");
          const f = formatTyreSizeFn(val);
          cards.forEach(c=>c.querySelector(".axle-size").value = f);
        }

        if (type === "make") {
          const val = card.querySelector(".axle-make").value.trim();
          cards.forEach(c=>c.querySelector(".axle-make").value = val);
        }

        if (type === "rim") {
          const val = card.querySelector("input[name='rim-"+i+"']:checked").value;
          cards.forEach((c,idx)=>{ c.querySelector("input[name='rim-"+idx+"'][value='"+val+"']").checked = true; });
        }

        if (type === "et") {
          const val = card.querySelector(".axle-et").value.trim();
          cards.forEach(c=>c.querySelector(".axle-et").value = val);
        }
      };
    });
  }
}

function buildPositions(config) {
  const left = [];
  const right = [];

  config.data.forEach((axle, index) => {
    const n = index + 1;

    if (axle.type === "single") {
      left.push(`Akseli ${n} vasen`);
      right.push(`Akseli ${n} oikea`);
    } else {
      left.push(`Akseli ${n} vasen ulompi`);
      left.push(`Akseli ${n} vasen sisempi`);
      right.push(`Akseli ${n} oikea ulompi`);
      right.push(`Akseli ${n} oikea sisempi`);
    }
  });

  return [...left, ...right];
}

function buildMeasurementUI(positions, config, containerEl, previous=null, prevNotes=null, prevPhotos=null, prevSizes=null, prevRims=null, prevMakes=null, prevEts=null) {
  containerEl.innerHTML = "";

  const values = positions.map((_,i)=> previous && previous[i]!=null ? Number(previous[i]) : 10);
  const notes = positions.map((_,i)=> prevNotes && prevNotes[i] ? String(prevNotes[i]) : "");
  const photos = positions.map((_,i)=> prevPhotos && prevPhotos[i] ? String(prevPhotos[i]) : null);

  const caption = document.createElement('div');
  caption.className = 'diagram-caption';
  caption.textContent = 'Valitse rengas:';
  containerEl.appendChild(caption);

  const diagram = document.createElement('div');
  diagram.className = 'tyre-diagram';
  containerEl.appendChild(diagram);

  const cfg = (config && config.data) ? config.data : [];
  const totalLeft = cfg.reduce((sum,a)=> sum + (a.type === 'dual' ? 2 : 1), 0);
  let leftIndex = 0;
  let rightIndex = totalLeft;

  const modal = document.createElement('div');
  modal.className = 'tire-modal';
  modal.innerHTML = `
    <div class="tire-modal-backdrop"></div>
    <div class="tire-modal-card">
      <div class="tire-modal-header">
        <div class="tire-modal-title"></div>
        <button class="btn-sm tire-modal-close" type="button">Sulje</button>
      </div>
      <div class="tire-modal-grid"></div>
      <div class="tire-modal-data">
        <label>Rengaskoko</label>
        <input type="text" class="tire-size-input" placeholder="200/55R16" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
        <label>Rengasmerkki malli</label>
        <input type="text" class="tire-make-input" placeholder="Esim. Michelin" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
        <label>Vannetyyppi</label>
        <div class="rim-options" style="margin-bottom:8px;">
          <label class="rim-option">
            <input type="checkbox" class="tire-rim-check" value="Alumiini">
            Alumiini
          </label>
          <label class="rim-option">
            <input type="checkbox" class="tire-rim-check" value="Teräs">
            Teräs
          </label>
        </div>
        <label>ET</label>
        <input type="text" class="tire-et-input" placeholder="Esim. 120" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
      </div>
      <div class="tire-modal-actions">
        <button class="btn-sm copy-size-all-btn" type="button">Kopioi koko kaikille</button>
        <button class="btn-sm copy-rim-all-btn" type="button">Kopioi vannetyyppi kaikille</button>
        <button class="btn-sm note-toggle" type="button">Huomio</button>
        <button class="btn-sm photo-btn" type="button">Kamera</button>
        <input type="file" accept="image/*" capture="environment" class="photo-input" style="display:none">
      </div>
      <div class="note-box" style="display:none;">
        <textarea class="note-input" placeholder="Kirjoita huomio..."></textarea>
      </div>
      <div class="photo-preview" style="display:none;"></div>
    </div>
  `;
  containerEl.appendChild(modal);

  const modalTitle = modal.querySelector('.tire-modal-title');
  const modalGrid = modal.querySelector('.tire-modal-grid');
  const tireSize = modal.querySelector('.tire-size-input');
  const tireMake = modal.querySelector('.tire-make-input');
  const tireRimChecks = [...modal.querySelectorAll('.tire-rim-check')];
  const tireEt = modal.querySelector('.tire-et-input');
  const copySizeAllBtn = modal.querySelector('.copy-size-all-btn');
  const copyRimAllBtn = modal.querySelector('.copy-rim-all-btn');
  const noteToggle = modal.querySelector('.note-toggle');
  const noteBox = modal.querySelector('.note-box');
  const noteInput = modal.querySelector('.note-input');
  const photoBtn = modal.querySelector('.photo-btn');
  const photoInput = modal.querySelector('.photo-input');
  const photoPreview = modal.querySelector('.photo-preview');
  let currentNode = null;

  setupTyreAutocomplete(tireMake, window.StorageKeys.tyreMakes(), null, (item)=>{
    if (!currentNode) return;
    const val = capitalizeWords(item || '');
    tireMake.value = val;
    currentNode.dataset.make = val;
  });
  setupTyreAutocomplete(tireEt, window.StorageKeys.etValues(), null, (item)=>{
    if (!currentNode) return;
    currentNode.dataset.et = (item || '').trim();
  });

  function getSelectedRim() {
    const checked = tireRimChecks.find(ch=>ch.checked);
    return checked ? checked.value : "";
  }

  function setSelectedRim(value) {
    const v = String(value || '').trim();
    tireRimChecks.forEach(ch=>{ ch.checked = (ch.value === v); });
  }

  function updateTireNode(node) {
    const val = Number(node.dataset.value || 0);
    const note = node.dataset.note || "";
    const photo = node.dataset.photo || "";
    node.querySelector('.tire-value').textContent = formatMmValue(val);
    node.classList.toggle('has-note', !!note);
    node.classList.toggle('has-photo', !!photo);
  }

  function setActiveValue(val) {
    const target = Number(val);
    modalGrid.querySelectorAll('.value-btn').forEach(b=>{
      const btnVal = Number(b.dataset.value);
      const isActive = Math.abs(btnVal - target) < 0.001;
      b.classList.toggle('active', isActive);
    });
  }

  function openModal(node, index) {
    currentNode = node;
    modalTitle.textContent = positions[index] || 'Rengas';

    const tireS = node.dataset.size || "";
    tireSize.value = tireS;
    
    const tireM = node.dataset.make || "";
    tireMake.value = tireM;
    
    const tireR = node.dataset.rim || "";
    setSelectedRim(tireR);

    const tireE = node.dataset.et || "";
    tireEt.value = tireE;

    const note = node.dataset.note || "";
    noteInput.value = note;
    noteToggle.classList.toggle('note-has-content', !!note);
    noteBox.style.display = note ? 'block' : 'none';

    const photo = node.dataset.photo || "";
    if (photo) {
      photoPreview.innerHTML = `<img src="${photo}" style="width:100%;height:100%;object-fit:cover">`;
      photoPreview.style.display = 'block';
    } else {
      photoPreview.innerHTML = "";
      photoPreview.style.display = 'none';
    }

    setActiveValue(Number(node.dataset.value || 0));
    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
    currentNode = null;
  }

  modal.querySelector('.tire-modal-close').onclick = closeModal;
  modal.querySelector('.tire-modal-backdrop').onclick = closeModal;

  for (let i=0;i<=20;i++) {
    const v = i;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'value-btn';
    btn.dataset.value = String(v);
    btn.textContent = formatMmValue(v);

    function setValue(val) {
      if (!currentNode) return;
      currentNode.dataset.value = String(val);
      updateTireNode(currentNode);
      setActiveValue(val);
    }

    btn.addEventListener('click', ()=> setValue(v));

    modalGrid.appendChild(btn);
  }

  copySizeAllBtn.onclick = ()=>{
    if (!currentNode) return;
    const normalized = formatTyreSize(tireSize.value.trim());
    if (!normalized) return alert('Rengaskoko puuttuu');
    tireSize.value = normalized;
    containerEl.querySelectorAll('.tire-node').forEach(node=>{
      node.dataset.size = normalized;
    });
  };

  copyRimAllBtn.onclick = ()=>{
    if (!currentNode) return;
    const val = getSelectedRim();
    if (!val) return alert('Vannetyyppi puuttuu');
    containerEl.querySelectorAll('.tire-node').forEach(node=>{
      node.dataset.rim = val;
    });
  };

  noteToggle.onclick = ()=>{
    noteBox.style.display = noteBox.style.display === 'none' ? 'block' : 'none';
  };

  noteInput.addEventListener('input', ()=>{
    if (!currentNode) return;
    const val = noteInput.value.trim();
    currentNode.dataset.note = val;
    noteToggle.classList.toggle('note-has-content', !!val);
    updateTireNode(currentNode);
  });

  tireSize.addEventListener('input', ()=>{
    if (!currentNode) return;
    const val = tireSize.value.trim();
    currentNode.dataset.size = val;
  });

  tireSize.addEventListener('blur', ()=>{
    if (!currentNode) return;
    const val = formatTyreSize(tireSize.value.trim());
    tireSize.value = val;
    currentNode.dataset.size = val;
  });

  tireMake.addEventListener('input', ()=>{
    if (!currentNode) return;
    const val = capitalizeWords(tireMake.value);
    currentNode.dataset.make = val;
  });

  tireMake.addEventListener('blur', ()=>{
    if (!currentNode) return;
    const val = capitalizeWords(tireMake.value);
    tireMake.value = val;
    currentNode.dataset.make = val;
  });

  tireRimChecks.forEach(ch=>{
    ch.addEventListener('change', ()=>{
      if (ch.checked) {
        tireRimChecks.forEach(other=>{ if (other !== ch) other.checked = false; });
      }
      if (!currentNode) return;
      currentNode.dataset.rim = getSelectedRim();
    });
  });

  tireEt.addEventListener('input', ()=>{
    if (!currentNode) return;
    const val = tireEt.value.trim();
    currentNode.dataset.et = val;
  });

  photoBtn.onclick = ()=> photoInput.click();
  photoInput.onchange = (e)=>{
    const f = e.target.files && e.target.files[0];
    if (!f || !currentNode) return;
    const r = new FileReader();
    r.onload = ()=>{
      currentNode.dataset.photo = r.result;
      photoPreview.innerHTML = `<img src="${r.result}" style="width:100%;height:100%;object-fit:cover">`;
      photoPreview.style.display = 'block';
      updateTireNode(currentNode);
    };
    r.readAsDataURL(f);
  };

  function createTireNode(index, label, axleConfig) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'tire-node';
    node.dataset.index = String(index);
    node.dataset.value = String(values[index] != null ? values[index] : 10);
    if (notes[index]) node.dataset.note = notes[index];
    if (photos[index]) node.dataset.photo = photos[index];
    node.dataset.size = (prevSizes && prevSizes[index]) ? prevSizes[index] : (axleConfig && axleConfig.size ? axleConfig.size : '');
    node.dataset.size = formatTyreSize(node.dataset.size);
    node.dataset.make = capitalizeWords((prevMakes && prevMakes[index]) ? prevMakes[index] : (axleConfig && axleConfig.make ? axleConfig.make : ''));
    node.dataset.rim = (prevRims && prevRims[index]) ? prevRims[index] : (axleConfig && axleConfig.rim ? axleConfig.rim : '');
    node.dataset.et = (prevEts && prevEts[index]) ? prevEts[index] : (axleConfig && axleConfig.et ? axleConfig.et : '');
    node.innerHTML = `
      <span class="tire-label">${label || ''}</span>
      <span class="tire-value">${formatMmValue(node.dataset.value)}</span>
      <span class="tire-unit">mm</span>
    `;
    updateTireNode(node);
    node.onclick = ()=> openModal(node, index);
    return node;
  }

  cfg.forEach((axle, axleIdx)=>{
    const row = document.createElement('div');
    row.className = 'axle-row';

    const left = document.createElement('div');
    left.className = 'tire-group left';
    const right = document.createElement('div');
    right.className = 'tire-group right';

    const isDual = axle.type === 'dual';
    if (isDual) {
      left.appendChild(createTireNode(leftIndex++, 'U', axle));
      left.appendChild(createTireNode(leftIndex++, 'S', axle));
      right.appendChild(createTireNode(rightIndex++, 'S', axle));
      right.appendChild(createTireNode(rightIndex++, 'U', axle));
    } else {
      left.appendChild(createTireNode(leftIndex++, '', axle));
      right.appendChild(createTireNode(rightIndex++, '', axle));
    }

    const axleLabel = document.createElement('div');
    axleLabel.className = 'axle-label';
    axleLabel.textContent = `Akseli ${axleIdx+1}`;

    row.appendChild(left);
    row.appendChild(axleLabel);
    row.appendChild(right);
    diagram.appendChild(row);
  });
}

function renderHistory(containerEl, HistoryManagerRef) {
  const list = HistoryManagerRef.load();
  containerEl.innerHTML = "";
  if (!list.length) {
    containerEl.innerHTML = "<p>Ei tallennettuja raportteja.</p>";
    return;
  }

  // Group by company -> plate -> records
  const map = {};
  list.forEach((r, idx)=>{
    const company = r.company || "Ilman yritystä";
    if (!map[company]) map[company] = {};
    if (!map[company][r.plate]) map[company][r.plate] = [];
    map[company][r.plate].push({rec:r, idx});
  });

  Object.keys(map).forEach(company=>{
    const compCard = document.createElement('div');
    compCard.className = 'card';
    compCard.innerHTML = `<h3>${company} <button class="btn-sm" data-download-company="${company}" style="margin-left:8px;">Lataa kaikki</button></h3>`;

    Object.keys(map[company]).forEach(plate=>{
      const arr = map[company][plate];
      const plateDiv = document.createElement('div');
      plateDiv.style.marginBottom = '8px';
      
      const headerDiv = document.createElement('div');
      headerDiv.style.display = 'flex';
      headerDiv.style.alignItems = 'center';
      headerDiv.style.justifyContent = 'space-between';
      headerDiv.style.cursor = 'pointer';
      headerDiv.style.padding = '8px';
      headerDiv.style.backgroundColor = '#f9f9f9';
      headerDiv.style.borderRadius = '6px';
      headerDiv.style.marginBottom = '8px';
      
      const leftPart = document.createElement('div');
      leftPart.style.display = 'flex';
      leftPart.style.alignItems = 'center';
      leftPart.style.gap = '8px';
      leftPart.style.flex = '1';
      
      const toggle = document.createElement('span');
      toggle.textContent = '▼';
      toggle.style.transition = 'transform 0.2s';
      toggle.style.display = 'inline-block';
      toggle.style.fontSize = '0.8rem';
      toggle.dataset.expanded = 'true';
      
      const titleSpan = document.createElement('span');
      titleSpan.innerHTML = `<strong>${plate}</strong> <small>(${arr.length} raporttia)</small>`;
      
      leftPart.appendChild(toggle);
      leftPart.appendChild(titleSpan);
      
      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'btn-sm';
      downloadBtn.setAttribute('data-download-plate', plate);
      downloadBtn.textContent = 'Lataa kaikki (ajoneuvo)';
      downloadBtn.style.marginLeft = '8px';
      downloadBtn.onclick = (e)=>e.stopPropagation();
      
      headerDiv.appendChild(leftPart);
      headerDiv.appendChild(downloadBtn);
      
      const reportsContainer = document.createElement('div');
      reportsContainer.className = 'plate-reports-container';
      reportsContainer.style.display = 'block';
      reportsContainer.style.overflow = 'hidden';
      reportsContainer.style.transition = 'max-height 0.3s ease';
      reportsContainer.style.maxHeight = '1000px';
      
      arr.forEach(entry=>{
        const r = entry.rec;
        const i = entry.idx;
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
          <div>
            <small>${r.date}</small>
          </div>
          <div class="history-actions">
            <button class="btn-sm primary" data-pdf="${i}">PDF</button>
            <button class="btn-sm danger" data-del="${i}">X</button>
          </div>
        `;
        reportsContainer.appendChild(item);
      });
      
      headerDiv.onclick = ()=>{
        const isExpanded = toggle.dataset.expanded === 'true';
        if (isExpanded) {
          reportsContainer.style.maxHeight = '0px';
          toggle.style.transform = 'rotate(-90deg)';
          toggle.dataset.expanded = 'false';
        } else {
          reportsContainer.style.maxHeight = '1000px';
          toggle.style.transform = 'rotate(0deg)';
          toggle.dataset.expanded = 'true';
        }
      };
      
      plateDiv.appendChild(headerDiv);
      plateDiv.appendChild(reportsContainer);
      compCard.appendChild(plateDiv);
    });

    containerEl.appendChild(compCard);
  });

  containerEl.querySelectorAll('[data-del]').forEach(btn=>{
    btn.onclick = ()=>{
      const list = HistoryManagerRef.load();
      list.splice(btn.dataset.del,1);
      HistoryManagerRef.save(list);
      renderHistory(containerEl, HistoryManagerRef);
    };
  });

  containerEl.querySelectorAll('[data-pdf]').forEach(btn=>{
    btn.onclick = ()=> {
      if (window.generatePdf) window.generatePdf(btn.dataset.pdf);
      else alert('PDF ei saatavilla (jsPDF ei ladattu)');
    };
  });

  containerEl.querySelectorAll('[data-download-company]').forEach(btn=>{
    btn.onclick = ()=>{
      const company = btn.dataset.downloadCompany;
      if (window.generateCompanyPdf) window.generateCompanyPdf(company);
      else alert('PDF-työkalu ei saatavilla');
    };
  });

  containerEl.querySelectorAll('[data-download-plate]').forEach(btn=>{
    btn.onclick = ()=>{
      const plate = btn.dataset.downloadPlate;
      if (window.generateVehiclePdf) window.generateVehiclePdf(plate);
      else alert('PDF-työkalu ei saatavilla');
    };
  });
}

// Export to window
window.buildAxleUI = buildAxleUI;
window.buildPositions = buildPositions;
window.buildMeasurementUI = buildMeasurementUI;
window.renderHistory = renderHistory;
