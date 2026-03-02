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
      right.push(`Akseli ${n} oikea sisempi`);
      right.push(`Akseli ${n} oikea ulompi`);
    }
  });

  return [...left, ...right];
}

function buildMeasurementUI(positions, config, containerEl, previous=null, prevNotes=null, prevPhotos=null, prevSizes=null, prevRims=null, prevMakes=null, prevEts=null, prevChanges=null, prevOldRunkos=null, prevRunkos=null, prevOldMakes=null, prevOldValues=null, viewMode='measurement') {
  containerEl.innerHTML = "";
  const isWorkMode = viewMode === 'work';

  const values = positions.map((_,i)=> previous && previous[i]!=null ? Number(previous[i]) : 10);
  const notes = positions.map((_,i)=> prevNotes && prevNotes[i] ? String(prevNotes[i]) : "");
  const photos = positions.map((_,i)=> prevPhotos && prevPhotos[i] ? String(prevPhotos[i]) : null);
  const WORK_OPTIONS = ['Paikkaus', 'Tasapainotus', 'Venttiilin vaihto', 'Rengastyö'];

  const caption = document.createElement('div');
  caption.className = 'diagram-caption';
  caption.textContent = isWorkMode ? 'Valitse rengas ja lisää tehdyt työt:' : 'Valitse rengas:';
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
        <div class="rim-options tire-rim-wrap" style="margin-bottom:8px;">
          <label class="rim-option">
            <input type="checkbox" class="tire-rim-check" value="Alumiini">
            Alumiini
          </label>
          <label class="rim-option">
            <input type="checkbox" class="tire-rim-check" value="Teräs">
            Teräs
          </label>
        </div>
        <label class="tire-et-label">ET</label>
        <input type="text" class="tire-et-input" placeholder="Esim. 120" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
        <label>Rengas runkonumero</label>
        <input type="text" class="tire-runko-input" placeholder="Esim. NEW123" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
        <label>Positio työt</label>
        <div class="tire-work-options" style="margin-bottom:8px;">
          ${WORK_OPTIONS.map(work=>`
            <label class="rim-option tire-work-option">
              <input type="checkbox" class="tire-work-check" value="${work}">
              ${work}
            </label>
          `).join('')}
        </div>
        <div class="work-rim-change-wrap" style="display:none; margin-bottom:8px;">
          <label>Uusi vanne</label>
          <div class="rim-options" style="margin-top:6px;">
            <label class="rim-option">
              <input type="checkbox" class="work-rim-check" value="Alumiini">
              Alumiini
            </label>
            <label class="rim-option">
              <input type="checkbox" class="work-rim-check" value="Teräs">
              Teräs
            </label>
          </div>
        </div>
      </div>
      <div class="tire-modal-actions">
        <button class="btn-sm copy-axle-btn" type="button">Kopioi koko akselille</button>
        <button class="btn-sm copy-size-all-btn" type="button">Kopioi koko kaikille</button>
        <button class="btn-sm copy-rim-all-btn" type="button">Kopioi vannetyyppi kaikille</button>
        <button class="btn-sm change-rim-btn" type="button">Vaihda vanne</button>
        <button class="btn-sm change-tire-btn" type="button">Vaihda rengas</button>
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
  const tireRimWrap = modal.querySelector('.tire-rim-wrap');
  const tireEt = modal.querySelector('.tire-et-input');
  const tireEtLabel = modal.querySelector('.tire-et-label');
  const tireRunko = modal.querySelector('.tire-runko-input');
  const copyAxleBtn = modal.querySelector('.copy-axle-btn');
  const copySizeAllBtn = modal.querySelector('.copy-size-all-btn');
  const copyRimAllBtn = modal.querySelector('.copy-rim-all-btn');
  const changeRimBtn = modal.querySelector('.change-rim-btn');
  const changeTireBtn = modal.querySelector('.change-tire-btn');
  const noteToggle = modal.querySelector('.note-toggle');
  const noteBox = modal.querySelector('.note-box');
  const noteInput = modal.querySelector('.note-input');
  const photoBtn = modal.querySelector('.photo-btn');
  const photoInput = modal.querySelector('.photo-input');
  const photoPreview = modal.querySelector('.photo-preview');
  const tireWorkChecks = [...modal.querySelectorAll('.tire-work-check')];
  const workRimChangeWrap = modal.querySelector('.work-rim-change-wrap');
  const workRimChecks = [...modal.querySelectorAll('.work-rim-check')];
  const changeTireWrapBtn = modal.querySelector('.change-tire-btn');
  const workOptionsWrap = modal.querySelector('.tire-work-options');
  const copySizeWrapBtn = modal.querySelector('.copy-size-all-btn');
  const copyRimWrapBtn = modal.querySelector('.copy-rim-all-btn');
  const changeRimWrapBtn = modal.querySelector('.change-rim-btn');
  const photoWrapBtn = modal.querySelector('.photo-btn');
  let currentNode = null;

  modalGrid.style.display = isWorkMode ? 'none' : 'grid';
  if (changeTireWrapBtn) changeTireWrapBtn.style.display = isWorkMode ? '' : 'none';
  if (changeRimWrapBtn) changeRimWrapBtn.style.display = isWorkMode ? '' : 'none';
  if (copyAxleBtn) copyAxleBtn.style.display = isWorkMode ? 'none' : '';
  if (copySizeWrapBtn) copySizeWrapBtn.style.display = isWorkMode ? 'none' : '';
  if (copyRimWrapBtn) copyRimWrapBtn.style.display = isWorkMode ? 'none' : '';
  if (photoWrapBtn) photoWrapBtn.style.display = isWorkMode ? 'none' : '';
  if (tireRimWrap) {
    const rimLabel = tireRimWrap.previousElementSibling;
    if (rimLabel) rimLabel.style.display = isWorkMode ? 'none' : '';
    tireRimWrap.style.display = isWorkMode ? 'none' : '';
  }
  if (tireEtLabel) tireEtLabel.style.display = isWorkMode ? 'none' : '';
  if (tireEt) tireEt.style.display = isWorkMode ? 'none' : '';
  if (workOptionsWrap) {
    const label = workOptionsWrap.previousElementSibling;
    if (label) label.style.display = isWorkMode ? '' : 'none';
    workOptionsWrap.style.display = isWorkMode ? 'flex' : 'none';
  }
  if (workRimChangeWrap) workRimChangeWrap.style.display = 'none';

  function parseWorkList(raw) {
    return String(raw || '')
      .split(/[|,]/)
      .map(item=>item.trim())
      .filter(Boolean);
  }

  function setSelectedWorks(list) {
    const selected = new Set((list || []).map(v=>String(v).trim()));
    tireWorkChecks.forEach(ch=>{ ch.checked = selected.has(ch.value); });
  }

  function getSelectedWorks() {
    return tireWorkChecks.filter(ch=>ch.checked).map(ch=>ch.value);
  }

  function saveSelectedWorks() {
    if (!currentNode) return;
    currentNode.dataset.works = getSelectedWorks().join('|');
    updateRimChangeButton(currentNode);
    updateTireNode(currentNode);
  }

  function getWorksSet(node) {
    return new Set(parseWorkList(node && node.dataset ? node.dataset.works : ''));
  }

  function updateRimChangeButton(node) {
    const active = !!node && getWorksSet(node).has('Vanteen vaihto');
    if (changeRimBtn) changeRimBtn.classList.toggle('change-rim-active', active);
    if (workRimChangeWrap) {
      workRimChangeWrap.style.display = (isWorkMode && active) ? 'block' : 'none';
    }
  }

  function getSelectedWorkRim() {
    const checked = workRimChecks.find(ch=>ch.checked);
    return checked ? checked.value : '';
  }

  function setSelectedWorkRim(value) {
    const v = String(value || '').trim();
    workRimChecks.forEach(ch=>{ ch.checked = (ch.value === v); });
  }

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
    const change = node.dataset.change === '1';
    const works = parseWorkList(node.dataset.works || '');
    node.querySelector('.tire-value').textContent = formatMmValue(val);
    node.classList.toggle('has-note', !!note);
    node.classList.toggle('has-photo', !!photo);
    node.classList.toggle('has-change', change);
    node.classList.toggle('has-work', works.length > 0);
  }

  function updateChangeButton(node) {
    const active = !!node && node.dataset.change === '1';
    changeTireBtn.classList.toggle('change-tire-active', active);
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

    const runko = node.dataset.runko || "";
    tireRunko.value = runko;

    const works = parseWorkList(node.dataset.works || '');
    setSelectedWorks(works);
    setSelectedWorkRim(node.dataset.workRim || '');

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
    updateRimChangeButton(node);
    updateChangeButton(node);
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

  copyAxleBtn.onclick = ()=>{
    if (!currentNode) return;
    const axleId = currentNode.dataset.axle;
    if (axleId == null || axleId === '') return;

    const payload = {
      value: currentNode.dataset.value || '',
      size: formatTyreSize((currentNode.dataset.size || '').trim()),
      make: capitalizeWords(currentNode.dataset.make || ''),
      rim: currentNode.dataset.rim || '',
      et: (currentNode.dataset.et || '').trim()
    };

    if (!payload.size) payload.size = formatTyreSize((tireSize.value || '').trim());
    if (!payload.make) payload.make = capitalizeWords(tireMake.value || '');
    if (!payload.rim) payload.rim = getSelectedRim();
    if (!payload.et) payload.et = (tireEt.value || '').trim();

    containerEl.querySelectorAll('.tire-node').forEach(node=>{
      if (node.dataset.axle !== axleId) return;
      node.dataset.value = payload.value;
      node.dataset.size = payload.size;
      node.dataset.make = payload.make;
      node.dataset.rim = payload.rim;
      node.dataset.et = payload.et;
      updateTireNode(node);
    });

    setActiveValue(Number(payload.value || 0));
  };

  copyRimAllBtn.onclick = ()=>{
    if (!currentNode) return;
    const val = getSelectedRim();
    if (!val) return alert('Vannetyyppi puuttuu');
    containerEl.querySelectorAll('.tire-node').forEach(node=>{
      node.dataset.rim = val;
    });
  };

  changeTireBtn.onclick = ()=>{
    if (!currentNode) return;
    const currentOldMake = (currentNode.dataset.oldMake || '').trim();
    const currentOld = (currentNode.dataset.oldRunko || '').trim().toUpperCase();
    const currentRunko = (currentNode.dataset.runko || '').trim().toUpperCase();
    const currentMake = capitalizeWords(currentNode.dataset.make || '');
    const currentOldValue = currentNode.dataset.oldValue;
    const currentValue = Number(currentNode.dataset.value || 0);

    currentNode.dataset.change = '1';

    if (!currentOldValue || currentOldValue === '') {
      currentNode.dataset.oldValue = String(currentValue);
    }

    if (!currentOldMake && currentMake) {
      currentNode.dataset.oldMake = currentMake;
    }

    if (!currentOld && currentRunko) {
      currentNode.dataset.oldRunko = currentRunko;
    }

    currentNode.dataset.make = '';
    currentNode.dataset.runko = '';

    tireMake.value = '';
    tireRunko.value = '';

    updateChangeButton(currentNode);
    updateTireNode(currentNode);
    tireRunko.focus();
  };

  changeRimBtn.onclick = ()=>{
    if (!currentNode) return;
    const works = getWorksSet(currentNode);
    if (works.has('Vanteen vaihto')) {
      works.delete('Vanteen vaihto');
      currentNode.dataset.workRim = '';
      setSelectedWorkRim('');
    } else {
      works.add('Vanteen vaihto');
    }
    currentNode.dataset.works = [...works].join('|');
    updateRimChangeButton(currentNode);
    updateTireNode(currentNode);
  };

  workRimChecks.forEach(ch=>{
    ch.addEventListener('change', ()=>{
      if (ch.checked) {
        workRimChecks.forEach(other=>{ if (other !== ch) other.checked = false; });
      }
      if (!currentNode) return;
      currentNode.dataset.workRim = getSelectedWorkRim();
    });
  });

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

  tireRunko.addEventListener('input', ()=>{
    if (!currentNode) return;
    const val = tireRunko.value.trim().toUpperCase();
    currentNode.dataset.runko = val;
    if (val) {
      currentNode.dataset.change = '1';
      updateChangeButton(currentNode);
      updateTireNode(currentNode);
    }
  });

  tireWorkChecks.forEach(ch=>{
    ch.addEventListener('change', saveSelectedWorks);
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

  function createTireNode(index, label, axleConfig, axleIndex) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'tire-node';
    node.dataset.index = String(index);
    node.dataset.axle = String(axleIndex);
    node.dataset.value = String(values[index] != null ? values[index] : 10);
    if (notes[index]) node.dataset.note = notes[index];
    if (photos[index]) node.dataset.photo = photos[index];
    node.dataset.size = (prevSizes && prevSizes[index]) ? prevSizes[index] : (axleConfig && axleConfig.size ? axleConfig.size : '');
    node.dataset.size = formatTyreSize(node.dataset.size);
    node.dataset.make = capitalizeWords((prevMakes && prevMakes[index]) ? prevMakes[index] : (axleConfig && axleConfig.make ? axleConfig.make : ''));
    node.dataset.rim = (prevRims && prevRims[index]) ? prevRims[index] : (axleConfig && axleConfig.rim ? axleConfig.rim : '');
    node.dataset.et = (prevEts && prevEts[index]) ? prevEts[index] : (axleConfig && axleConfig.et ? axleConfig.et : '');
    node.dataset.change = (prevChanges && prevChanges[index]) ? '1' : '';
    node.dataset.oldRunko = (prevOldRunkos && prevOldRunkos[index]) ? String(prevOldRunkos[index]).toUpperCase() : '';
    node.dataset.runko = (prevRunkos && prevRunkos[index]) ? String(prevRunkos[index]).toUpperCase() : '';
    node.dataset.works = '';
    node.dataset.workRim = '';
    node.dataset.oldMake = (prevOldMakes && prevOldMakes[index]) ? capitalizeWords(prevOldMakes[index]) : '';
    node.dataset.oldValue = (prevOldValues && prevOldValues[index] != null) ? String(prevOldValues[index]) : '';
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
      left.appendChild(createTireNode(leftIndex++, 'U', axle, axleIdx));
      left.appendChild(createTireNode(leftIndex++, 'S', axle, axleIdx));
      right.appendChild(createTireNode(rightIndex++, 'S', axle, axleIdx));
      right.appendChild(createTireNode(rightIndex++, 'U', axle, axleIdx));
    } else {
      left.appendChild(createTireNode(leftIndex++, '', axle, axleIdx));
      right.appendChild(createTireNode(rightIndex++, '', axle, axleIdx));
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
    compCard.innerHTML = `<h3>${company}
      <button class="btn-sm" data-download-company="${company}" data-mode="all" style="margin-left:8px;">Lataa kaikki</button>
      <button class="btn-sm" data-download-company="${company}" data-mode="measurement" style="margin-left:6px;">Lataa mittaukset</button>
      <button class="btn-sm" data-download-company="${company}" data-mode="work" style="margin-left:6px;">Lataa työt</button>
    </h3>`;

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
      downloadBtn.setAttribute('data-mode', 'all');
      downloadBtn.textContent = 'Lataa kaikki';
      downloadBtn.style.marginLeft = '8px';
      downloadBtn.onclick = (e)=>e.stopPropagation();

      const downloadMeasureBtn = document.createElement('button');
      downloadMeasureBtn.className = 'btn-sm';
      downloadMeasureBtn.setAttribute('data-download-plate', plate);
      downloadMeasureBtn.setAttribute('data-mode', 'measurement');
      downloadMeasureBtn.textContent = 'Lataa mittaukset';
      downloadMeasureBtn.style.marginLeft = '6px';
      downloadMeasureBtn.onclick = (e)=>e.stopPropagation();

      const downloadWorkBtn = document.createElement('button');
      downloadWorkBtn.className = 'btn-sm';
      downloadWorkBtn.setAttribute('data-download-plate', plate);
      downloadWorkBtn.setAttribute('data-mode', 'work');
      downloadWorkBtn.textContent = 'Lataa työt';
      downloadWorkBtn.style.marginLeft = '6px';
      downloadWorkBtn.onclick = (e)=>e.stopPropagation();
      
      headerDiv.appendChild(leftPart);
      const rightPart = document.createElement('div');
      rightPart.style.display = 'flex';
      rightPart.style.flexWrap = 'wrap';
      rightPart.style.justifyContent = 'flex-end';
      rightPart.appendChild(downloadBtn);
      rightPart.appendChild(downloadMeasureBtn);
      rightPart.appendChild(downloadWorkBtn);
      headerDiv.appendChild(rightPart);
      
      const reportsContainer = document.createElement('div');
      reportsContainer.className = 'plate-reports-container';
      reportsContainer.style.display = 'block';
      reportsContainer.style.overflow = 'hidden';
      reportsContainer.style.transition = 'max-height 0.3s ease';
      reportsContainer.style.maxHeight = '1000px';

      const measurementEntries = arr.filter(entry => (entry.rec.mode || 'measurement') !== 'work');
      const workEntries = arr.filter(entry => entry.rec.mode === 'work');

      function appendSection(title, entries) {
        const section = document.createElement('div');
        section.style.marginBottom = '8px';

        const sectionTitle = document.createElement('div');
        sectionTitle.style.fontSize = '0.85rem';
        sectionTitle.style.fontWeight = '600';
        sectionTitle.style.color = '#475569';
        sectionTitle.style.margin = '4px 0';
        sectionTitle.textContent = `${title} (${entries.length})`;
        section.appendChild(sectionTitle);

        if (!entries.length) {
          const empty = document.createElement('div');
          empty.style.fontSize = '0.8rem';
          empty.style.color = '#94a3b8';
          empty.style.padding = '4px 0 8px';
          empty.textContent = 'Ei rivejä';
          section.appendChild(empty);
          reportsContainer.appendChild(section);
          return;
        }

        entries.forEach(entry=>{
          const r = entry.rec;
          const i = entry.idx;
          const km = (r.ajokilometrit != null && String(r.ajokilometrit).trim() !== '')
            ? ` • ${r.ajokilometrit} km`
            : '';
          const item = document.createElement('div');
          item.className = 'history-item';
          item.innerHTML = `
            <div>
              <small>${r.date}${km}</small>
            </div>
            <div class="history-actions">
              <button class="btn-sm primary" data-pdf="${i}">PDF</button>
              <button class="btn-sm danger" data-del="${i}">X</button>
            </div>
          `;
          section.appendChild(item);
        });

        reportsContainer.appendChild(section);
      }

      appendSection('Mittaukset', measurementEntries);
      appendSection('Työt', workEntries);
      
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
      const mode = btn.dataset.mode || 'all';
      if (window.generateCompanyPdf) window.generateCompanyPdf(company, mode);
      else alert('PDF-työkalu ei saatavilla');
    };
  });

  containerEl.querySelectorAll('[data-download-plate]').forEach(btn=>{
    btn.onclick = ()=>{
      const plate = btn.dataset.downloadPlate;
      const mode = btn.dataset.mode || 'all';
      if (window.generateVehiclePdf) window.generateVehiclePdf(plate, mode);
      else alert('PDF-työkalu ei saatavilla');
    };
  });
}

// Export to window
window.buildAxleUI = buildAxleUI;
window.buildPositions = buildPositions;
window.buildMeasurementUI = buildMeasurementUI;
window.renderHistory = renderHistory;
