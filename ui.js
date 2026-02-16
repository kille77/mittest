function formatTyreSize(raw) {
  if (!raw) return "";
  if (raw.includes("/")) return raw.trim();
  const d = raw.replace(/\D/g,"");
  // 38555225 -> 385/55R22.5
  if (d.length === 8) return `${d.slice(0,3)}/${d.slice(3,5)}R${d.slice(5,7)}.${d.slice(7)}`;
  // 3855522 -> 385/55R22
  if (d.length === 7) return `${d.slice(0,3)}/${d.slice(3,5)}R${d.slice(5,7)}`;
  return raw.trim();
}
function setupAutocomplete(inputEl, suggestionsEl, getItems, onSelect, transformInput=null) {
  function closeSuggestions() {
    suggestionsEl.style.display = "none";
    suggestionsEl.innerHTML = "";
  }

  function openSuggestions(items) {
    if (!items.length) { closeSuggestions(); return; }
    suggestionsEl.innerHTML = "";
    items.forEach(item=>{
      const div = document.createElement("div");
      div.className = "autocomplete-suggestion";
      div.textContent = item;
      div.onclick = (e)=>{ e.stopPropagation(); inputEl.value = item; closeSuggestions(); onSelect(item); };
      suggestionsEl.appendChild(div);
    });
    suggestionsEl.style.display = "block";
  }

  inputEl.addEventListener("input", ()=>{
    let val = inputEl.value;
    if (transformInput) {
      val = transformInput(val);
      inputEl.value = val;
    }
    const all = getItems();
    if (!val) { closeSuggestions(); return; }
    const filtered = all.filter(x => x.toLowerCase().includes(val.toLowerCase()));
    openSuggestions(filtered);
  });

  inputEl.addEventListener("focus", ()=>{
    const val = inputEl.value;
    const all = getItems();
    if (!val) {
      if (all.length) openSuggestions(all.slice(0,10));
    } else {
      const filtered = all.filter(x => x.toLowerCase().includes(val.toLowerCase()));
      openSuggestions(filtered);
    }
  });

  document.addEventListener("click", e=>{
    if (!inputEl.contains(e.target) && !suggestionsEl.contains(e.target)) {
      closeSuggestions();
    }
  });
}

function setupTyreAutocomplete(inputEl, key, formatter=null) {
  const wrap = document.createElement("div");
  wrap.className = "autocomplete-wrapper";
  inputEl.parentNode.insertBefore(wrap, inputEl);
  wrap.appendChild(inputEl);

  const sug = document.createElement("div");
  sug.className = "autocomplete-suggestions";
  sug.style.display = "none";
  wrap.appendChild(sug);

  setupAutocomplete(
    inputEl,
    sug,
    ()=>loadList(key),
    ()=>{},
    formatter
  );
}

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
      <div class="tyre-config-positions"></div>
    `;
    containerEl.appendChild(card);

    // Tyre position UI
    const tyreConfig = card.querySelector('.tyre-config-positions');
    function renderTyreInputs(type) {
      tyreConfig.innerHTML = '';
      let positions = [];
      if (type === 'single') {
        positions = [
          { key: 'left', label: 'Vasen' },
          { key: 'right', label: 'Oikea' }
        ];
      } else {
        positions = [
          { key: 'leftOuter', label: 'Vasen ulompi' },
          { key: 'leftInner', label: 'Vasen sisempi' },
          { key: 'rightOuter', label: 'Oikea ulompi' },
          { key: 'rightInner', label: 'Oikea sisempi' }
        ];
      }
      positions.forEach(pos => {
        const posData = (d.tyres && d.tyres[pos.key]) || {};
        const div = document.createElement('div');
        div.className = 'tyre-config-row';
        div.innerHTML = `
          <label>${pos.label}</label>
          <input class="tyre-size" data-pos="${pos.key}" placeholder="Koko" value="${posData.size||''}" inputmode="numeric" pattern="[0-9]*">
          <input class="tyre-make" data-pos="${pos.key}" placeholder="Merkki" value="${posData.make||''}">
          <input class="tyre-rim" data-pos="${pos.key}" placeholder="Vanne" value="${posData.rim||''}">
          <input class="tyre-et" data-pos="${pos.key}" placeholder="ET" value="${posData.et||''}">
        `;
        tyreConfig.appendChild(div);
        setupTyreAutocomplete(div.querySelector('.tyre-size'), StorageKeysRef.tyreSizes(), formatTyreSizeFn);
        setupTyreAutocomplete(div.querySelector('.tyre-make'), StorageKeysRef.tyreMakes());
        setupTyreAutocomplete(div.querySelector('.tyre-et'), StorageKeysRef.etValues());
      });
    }
    // Initial render
    renderTyreInputs(d.type || 'single');
    // Change handler
    card.querySelector('.axle-type').addEventListener('change', e => {
      renderTyreInputs(e.target.value);
    });

    const icon = card.querySelector(".settings-icon");
    const menu = card.querySelector(".settings-menu");
    icon.onclick = (e)=>{ e.stopPropagation(); document.querySelectorAll(".settings-menu").forEach(m=>m.style.display="none"); menu.style.display = "block"; };
    document.addEventListener("click", ()=>{ menu.style.display = "none"; });
    menu.querySelectorAll("[data-copy]").forEach(btn=>{
      btn.onclick = (e)=>{
        e.stopPropagation();
        // Copy logic for new UI can be implemented here if needed
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

function buildMeasurementUI(positions, containerEl, previous=null, prevNotes=null, prevPhotos=null) {
  containerEl.innerHTML = "";
  positions.forEach((p,i)=>{
    const row = document.createElement("div");
    row.className = "tyre-row";
    row.innerHTML = `
      <div class="tyre-main">
        <div>${p}</div>
        <div class="tyre-controls">
          <button class="btn-sm minus">−</button>
          <input type="number" step="0.1" value="${previous?previous[i]:10}">
          <button class="btn-sm plus">+</button>
          <button class="btn-sm note-toggle">Huomio</button>
          <button class="btn-sm photo-btn">Ota kuva</button>
          <input type="file" accept="image/*" capture="environment" class="photo-input" style="display:none">
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:flex-start;margin-top:6px;">
        <div class="note-box" style="display:${prevNotes && prevNotes[i] ? "block" : "none"};flex:1;">
          <textarea class="note-input" placeholder="Kirjoita huomio...">${prevNotes && prevNotes[i] ? prevNotes[i] : ""}</textarea>
        </div>
        <div class="photo-preview" style="width:80px;height:60px;border:1px solid #eee;border-radius:6px;overflow:hidden;display:${prevPhotos && prevPhotos[i] ? 'block' : 'none'};">
          ${prevPhotos && prevPhotos[i] ? `<img src="${prevPhotos[i]}" style="width:100%;height:100%;object-fit:cover">` : ''}
        </div>
      </div>
    `;
    containerEl.appendChild(row);

    const input = row.querySelector("input[type='number']");
    row.querySelector(".minus").onclick = ()=> input.value = (parseFloat(input.value||0)-0.5).toFixed(1);
    row.querySelector(".plus").onclick = ()=> input.value = (parseFloat(input.value||0)+0.5).toFixed(1);

    const noteBox = row.querySelector(".note-box");
    row.querySelector(".note-toggle").onclick = ()=>{ noteBox.style.display = noteBox.style.display==="none" ? "block" : "none"; };

    // Photo handling
    const photoBtn = row.querySelector('.photo-btn');
    const photoInput = row.querySelector('.photo-input');
    const preview = row.querySelector('.photo-preview');

    if (prevPhotos && prevPhotos[i]) {
      row.dataset.photo = prevPhotos[i];
    }

    photoBtn.onclick = ()=> photoInput.click();
    photoInput.onchange = (e)=>{
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = ()=>{
        row.dataset.photo = r.result;
        preview.innerHTML = `<img src="${r.result}" style="width:100%;height:100%;object-fit:cover">`;
        preview.style.display = 'block';
      };
      r.readAsDataURL(f);
    };
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

// expose to global for non-module usage
window.formatTyreSize = formatTyreSize;
window.setupAutocomplete = setupAutocomplete;
window.setupTyreAutocomplete = setupTyreAutocomplete;
window.buildAxleUI = buildAxleUI;
window.buildPositions = buildPositions;
window.buildMeasurementUI = buildMeasurementUI;
window.renderHistory = renderHistory;
