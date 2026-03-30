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

    const axleSizeInput = card.querySelector(".axle-size");
    const axleMakeInput = card.querySelector(".axle-make");
    const axleEtInput = card.querySelector(".axle-et");

    setupTyreAutocomplete(axleSizeInput, StorageKeysRef.tyreSizes(), formatTyreSizeFn);
    window.setupTyreProductAutocomplete(axleMakeInput, ()=>axleSizeInput.value);
    setupTyreAutocomplete(axleEtInput, StorageKeysRef.etValues());

    axleSizeInput.addEventListener("blur", e=>{ e.target.value = formatTyreSizeFn(e.target.value); });

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

function buildMeasurementUI(positions, config, containerEl, previous=null, prevNotes=null, prevPhotos=null, prevSizes=null, prevRims=null, prevMakes=null, prevEts=null, prevChanges=null, prevOldRunkos=null, prevRunkos=null, prevOldMakes=null, prevOldValues=null, prevWorks=null, prevWorkRims=null, viewMode='measurement', readOnly=false) {
  containerEl.innerHTML = "";
  const isWorkMode = viewMode === 'work';
  const isReadOnly = !!readOnly;
  const normalizeTyreMake = value => String(value || '').trim();
  const normalizeRimProduct = value => String(value || '').trim();
  const normalizeEtValue = value => String(value || '').trim().replace(',', '.');

  function getEtFromProductName(value) {
    const match = String(value || '').match(/ET\s*([0-9]+(?:[.,][0-9]+)?)/i);
    return match ? normalizeEtValue(match[1]) : '';
  }

  function getRimSearchContext() {
    const preferredItems = new Set();

    if (currentNode) {
      [currentNode.dataset.workRim, currentNode.dataset.oldRim, currentNode.dataset.rim].forEach(value => {
        const normalized = normalizeRimProduct(value || '');
        if (normalized) preferredItems.add(normalized);
      });

      const axleId = String(currentNode.dataset.axle || '');
      if (axleId) {
        containerEl.querySelectorAll('.tire-node').forEach(node => {
          if (String(node.dataset.axle || '') !== axleId) return;
          [node.dataset.workRim, node.dataset.rim, node.dataset.oldRim].forEach(value => {
            const normalized = normalizeRimProduct(value || '');
            if (normalized) preferredItems.add(normalized);
          });
        });
      }
    }

    const currentEt = normalizeEtValue(
      (workRimEtInput && workRimEtInput.value) ||
      (currentNode && (currentNode.dataset.oldEt || currentNode.dataset.et)) ||
      ''
    );

    const currentTyreSize = formatTyreSize(
      (tireSize && tireSize.value) ||
      (currentNode && (currentNode.dataset.oldSize || currentNode.dataset.size)) ||
      ''
    );

    return {
      currentEt,
      currentTyreSize,
      preferredItems: [...preferredItems]
    };
  }

  function parseMeasurementValue(value) {
    if (value == null) return null;
    const raw = String(value).trim().replace(',', '.');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const values = positions.map((_,i)=>{
    const previousValue = previous && previous[i] != null ? previous[i] : null;
    return parseMeasurementValue(previousValue);
  });
  const notes = positions.map((_,i)=> prevNotes && prevNotes[i] ? String(prevNotes[i]) : "");
  const photos = positions.map((_,i)=> prevPhotos && prevPhotos[i] ? String(prevPhotos[i]) : null);
  const WORK_OPTIONS = ['Paikkaus', 'Tasapainotus', 'Venttiilin vaihto', 'Vannetyö', 'Allevaihto'];

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
        <div class="tire-change-tabs" style="display:none; margin-bottom:8px;">
          <button class="btn-sm tire-change-tab-btn active" data-change-tab="new" type="button">Uusi rengas</button>
          <button class="btn-sm tire-change-tab-btn" data-change-tab="old" type="button">Vanha rengas</button>
        </div>
        <div class="tire-change-layout">
          <div class="tire-change-panel tire-change-panel-old" style="display:none;">
            <div class="tire-panel-header tire-panel-header-old">
              <div class="tire-panel-kicker">Poistuva rengas</div>
              <div class="tire-panel-title">Vanha rengas</div>
              <div class="tire-panel-help">Tämä ikkuna näyttää renkaan tiedot ennen vaihtoa.</div>
            </div>
            <label>Vanha koko</label>
            <div class="tire-old-field old-size">-</div>
            <label>Vanhan renkaan mm</label>
            <div class="tire-old-field old-mm">-</div>
            <label>Vanha merkki/malli</label>
            <div class="tire-old-field old-make">-</div>
            <label>Vanha runkonumero</label>
            <div class="tire-old-field old-runko">-</div>
          </div>
          <div class="tire-change-panel tire-change-panel-new">
            <div class="tire-panel-header tire-panel-header-new">
              <div class="tire-panel-kicker">Asennettava rengas</div>
              <div class="tire-panel-title">Uusi rengas</div>
              <div class="tire-panel-help">Syötä tähän uuteen renkaaseen liittyvät tiedot.</div>
            </div>
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
            <label class="tire-new-mm-label" style="display:none;">Uuden renkaan mm</label>
            <input type="number" min="0" step="0.1" class="tire-new-mm-input" placeholder="Esim. 16" style="display:none;width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
          </div>
        </div>
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
          <div class="tire-change-layout rim-change-layout compare-mode">
            <div class="tire-change-panel tire-change-panel-old rim-change-panel-old">
              <div class="tire-panel-header tire-panel-header-old">
                <div class="tire-panel-kicker">Poistuva vanne</div>
                <div class="tire-panel-title">Vanha vanne</div>
                <div class="tire-panel-help">Tässä näkyvät vanteen tiedot ennen vaihtoa.</div>
              </div>
              <label>Vanha vanne</label>
              <div class="tire-old-field old-rim">-</div>
              <label>Vanha ET</label>
              <div class="tire-old-field old-rim-et">-</div>
            </div>
            <div class="tire-change-panel tire-change-panel-new rim-change-panel-new">
              <div class="tire-panel-header tire-panel-header-new">
                <div class="tire-panel-kicker">Asennettava vanne</div>
                <div class="tire-panel-title">Uusi vanne</div>
                <div class="tire-panel-help">Hae vannetuote katalogista. Vanteet haetaan H/-kategoriasta.</div>
              </div>
              <label>Vannetuote</label>
              <input type="text" class="work-rim-product-input" placeholder="Esim. 9.00x22.5 Alcoa Dura-Bright 10x26mm ET156" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
              <label>Uusi ET</label>
              <input type="text" class="work-rim-et-input" placeholder="Esim. 156" style="width:100%;padding:8px;margin-bottom:8px;border:1px solid #ddd;border-radius:6px;">
            </div>
          </div>
        </div>
      </div>
      <div class="tire-modal-actions">
        <button class="btn-sm copy-axle-btn" type="button">Kopioi koko akselille</button>
        <button class="btn-sm copy-size-all-btn" type="button">Kopioi koko kaikille</button>
        <button class="btn-sm copy-rim-all-btn" type="button">Kopioi vannetyyppi kaikille</button>
        ${isWorkMode ? '<button class="btn-sm change-rim-btn" type="button">Vaihda vanne</button>' : ''}
        ${isWorkMode ? '<button class="btn-sm change-tire-btn" type="button">Vaihda rengas</button>' : ''}
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
  const changeTabsWrap = modal.querySelector('.tire-change-tabs');
  const changeLayout = modal.querySelector('.tire-change-layout');
  const changeTabBtns = [...modal.querySelectorAll('.tire-change-tab-btn')];
  const changePanelNew = modal.querySelector('.tire-change-panel-new');
  const changePanelOld = modal.querySelector('.tire-change-panel-old');
  const newPanelKicker = modal.querySelector('.tire-panel-header-new .tire-panel-kicker');
  const newPanelTitle = modal.querySelector('.tire-panel-header-new .tire-panel-title');
  const newPanelHelp = modal.querySelector('.tire-panel-header-new .tire-panel-help');
  const oldPanelKicker = modal.querySelector('.tire-panel-header-old .tire-panel-kicker');
  const oldPanelTitle = modal.querySelector('.tire-panel-header-old .tire-panel-title');
  const oldPanelHelp = modal.querySelector('.tire-panel-header-old .tire-panel-help');
  const oldSizeEl = modal.querySelector('.old-size');
  const oldMmEl = modal.querySelector('.old-mm');
  const oldMakeEl = modal.querySelector('.old-make');
  const oldRunkoEl = modal.querySelector('.old-runko');
  const tireSize = modal.querySelector('.tire-size-input');
  const tireMake = modal.querySelector('.tire-make-input');
  const tireRimChecks = [...modal.querySelectorAll('.tire-rim-check')];
  const tireRimWrap = modal.querySelector('.tire-rim-wrap');
  const tireEt = modal.querySelector('.tire-et-input');
  const tireEtLabel = modal.querySelector('.tire-et-label');
  const tireRunko = modal.querySelector('.tire-runko-input');
  const tireNewMmLabel = modal.querySelector('.tire-new-mm-label');
  const tireNewMm = modal.querySelector('.tire-new-mm-input');
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
  const rimChangeLayout = modal.querySelector('.rim-change-layout');
  const rimChangePanelNew = modal.querySelector('.rim-change-panel-new');
  const rimChangePanelOld = modal.querySelector('.rim-change-panel-old');
  const oldRimEl = modal.querySelector('.old-rim');
  const oldRimEtEl = modal.querySelector('.old-rim-et');
  const workRimProductInput = modal.querySelector('.work-rim-product-input');
  const workRimEtInput = modal.querySelector('.work-rim-et-input');
  const changeTireWrapBtn = modal.querySelector('.change-tire-btn');
  const workOptionsWrap = modal.querySelector('.tire-work-options');
  const copySizeWrapBtn = modal.querySelector('.copy-size-all-btn');
  const copyRimWrapBtn = modal.querySelector('.copy-rim-all-btn');
  const changeRimWrapBtn = modal.querySelector('.change-rim-btn');
  const photoWrapBtn = modal.querySelector('.photo-btn');
  let currentNode = null;

  if (copyAxleBtn) {
    copyAxleBtn.textContent = isWorkMode
      ? 'Kopioi merkki, koko ja työt akselille'
      : 'Kopioi koko akselille';
  }

  function updateTirePanelHeaders(hasChange) {
    if (!isWorkMode) {
      if (newPanelKicker) newPanelKicker.textContent = 'Renkaan tiedot';
      if (newPanelTitle) newPanelTitle.textContent = 'Rengas';
      if (newPanelHelp) newPanelHelp.textContent = 'Muokkaa tähän renkaan tiedot.';
      return;
    }

    if (hasChange) {
      if (oldPanelKicker) oldPanelKicker.textContent = 'Poistuva rengas';
      if (oldPanelTitle) oldPanelTitle.textContent = 'Vanha rengas';
      if (oldPanelHelp) oldPanelHelp.textContent = 'Tämä ikkuna näyttää renkaan tiedot ennen vaihtoa.';
      if (newPanelKicker) newPanelKicker.textContent = 'Asennettava rengas';
      if (newPanelTitle) newPanelTitle.textContent = 'Uusi rengas';
      if (newPanelHelp) newPanelHelp.textContent = 'Syötä tähän uuteen renkaaseen liittyvät tiedot.';
      return;
    }

    if (newPanelKicker) newPanelKicker.textContent = 'Nykyinen rengas';
    if (newPanelTitle) newPanelTitle.textContent = 'Vanha rengas';
    if (newPanelHelp) newPanelHelp.textContent = 'Tässä näkyvät position nykyisen renkaan tiedot. Aktivoi Vaihda rengas, jos asennat uuden renkaan.';
  }

  function setChangeTab(tab) {
    const active = tab === 'old' ? 'old' : 'new';
    const hasChange = !!currentNode && currentNode.dataset.change === '1';
    const compareMode = isWorkMode && hasChange;
    updateTirePanelHeaders(hasChange);
    changeTabBtns.forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.changeTab === active);
    });
    if (changeLayout) changeLayout.classList.toggle('compare-mode', compareMode);
    if (changePanelNew) changePanelNew.style.display = compareMode || active === 'new' ? 'block' : 'none';
    if (changePanelOld) changePanelOld.style.display = compareMode ? 'block' : (active === 'old' ? 'block' : 'none');
    const showMmField = isWorkMode && ((hasChange && active === 'new') || !hasChange);
    if (tireNewMmLabel) {
      tireNewMmLabel.textContent = hasChange ? 'Uuden renkaan mm' : 'Vanhan renkaan mm';
      tireNewMmLabel.style.display = showMmField ? '' : 'none';
    }
    if (tireNewMm) {
      tireNewMm.style.display = showMmField ? '' : 'none';
      tireNewMm.readOnly = !hasChange;
    }
  }

  function updateChangeTabs(node) {
    if (!changeTabsWrap) return;
    const hasChange = !!node && node.dataset.change === '1';
    changeTabsWrap.style.display = 'none';
    if (!isWorkMode) {
      setChangeTab('new');
      return;
    }

    const oldValueRaw = (node && node.dataset.oldValue != null && String(node.dataset.oldValue).trim() !== '')
      ? node.dataset.oldValue
      : (node ? node.dataset.value : '');
    const oldSizeRaw = node ? (node.dataset.oldSize || node.dataset.size || '') : '';
    const oldMakeRaw = node ? (node.dataset.oldMake || node.dataset.make || '') : '';
    const oldRunkoRaw = node ? (node.dataset.oldRunko || node.dataset.runko || '') : '';

    if (oldSizeEl) oldSizeEl.textContent = oldSizeRaw || '-';
    if (oldMmEl) oldMmEl.textContent = oldValueRaw !== '' ? `${formatMmValue(oldValueRaw)} mm` : '-';
    if (oldMakeEl) oldMakeEl.textContent = oldMakeRaw || '-';
    if (oldRunkoEl) oldRunkoEl.textContent = oldRunkoRaw || '-';

    setChangeTab('new');
  }

  changeTabBtns.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if (!isWorkMode || !currentNode || currentNode.dataset.change !== '1') return;
      setChangeTab(btn.dataset.changeTab || 'new');
    });
  });

  modalGrid.style.display = isWorkMode ? 'none' : 'grid';
  if (changeTireWrapBtn) changeTireWrapBtn.style.display = isWorkMode ? '' : 'none';
  if (changeRimWrapBtn) changeRimWrapBtn.style.display = isWorkMode ? '' : 'none';
  if (copyAxleBtn) copyAxleBtn.style.display = '';
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
    if (changeRimBtn) changeRimBtn.textContent = active ? 'Peru vanteen vaihto' : 'Vaihda vanne';
    updateRimChangeDetails(node);
    if (workRimChangeWrap) {
      workRimChangeWrap.style.display = (isWorkMode && active) ? 'block' : 'none';
    }
    if (rimChangeLayout) rimChangeLayout.classList.toggle('compare-mode', active);
    if (!active) setRimChangeTab('new');
  }

  function getSelectedWorkRim() {
    return normalizeRimProduct(workRimProductInput ? workRimProductInput.value : '');
  }

  function setSelectedWorkRim(value) {
    const v = normalizeRimProduct(value || '');
    if (workRimProductInput) workRimProductInput.value = v;
  }

  function setRimChangeTab(tab) {
    const active = tab === 'old' ? 'old' : 'new';
    const compareMode = !!currentNode && getWorksSet(currentNode).has('Vanteen vaihto');
    if (rimChangeLayout) rimChangeLayout.classList.toggle('compare-mode', compareMode);
    if (rimChangePanelNew) rimChangePanelNew.style.display = compareMode || active === 'new' ? 'block' : 'none';
    if (rimChangePanelOld) rimChangePanelOld.style.display = compareMode || active === 'old' ? 'block' : 'none';
  }

  function updateRimChangeDetails(node) {
    const oldRim = node ? (node.dataset.oldRim || node.dataset.rim || '') : '';
    const oldEt = node ? (node.dataset.oldEt || node.dataset.et || '') : '';
    if (oldRimEl) oldRimEl.textContent = oldRim || '-';
    if (oldRimEtEl) oldRimEtEl.textContent = oldEt || '-';
    if (workRimEtInput) workRimEtInput.value = node ? normalizeEtValue(node.dataset.et || '') : '';
  }

  window.setupTyreProductAutocomplete(tireMake, ()=>tireSize.value, (item)=>{
    if (!currentNode) return;
    const val = normalizeTyreMake(item || '');
    tireMake.value = val;
    currentNode.dataset.make = val;
    updateTireNode(currentNode);
  });
  setupTyreAutocomplete(tireEt, window.StorageKeys.etValues(), null, (item)=>{
    if (!currentNode) return;
    currentNode.dataset.et = (item || '').trim();
  });
  window.setupRimProductAutocomplete(workRimProductInput, ()=>getRimSearchContext(), (item)=>{
    if (!currentNode) return;
    const value = normalizeRimProduct(item || '');
    const etValue = getEtFromProductName(value);
    workRimProductInput.value = value;
    currentNode.dataset.workRim = value;
    if (workRimEtInput && etValue) {
      workRimEtInput.value = etValue;
      currentNode.dataset.et = etValue;
    }
    updateTireNode(currentNode);
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
    const val = parseMeasurementValue(node.dataset.value);
    const hasMeasurement = val != null;
    const note = node.dataset.note || "";
    const photo = node.dataset.photo || "";
    const change = node.dataset.change === '1';
    const works = parseWorkList(node.dataset.works || '');
    const summaryEl = node.parentElement ? node.parentElement.querySelector('.position-work-summary') : null;
    const summaryItems = works.map(work=>{
      if (work === 'Vanteen vaihto' && (node.dataset.workRim || '').trim()) {
        return `Vanteen vaihto (${node.dataset.workRim.trim()})`;
      }
      return work;
    });
    node.querySelector('.tire-value').textContent = hasMeasurement ? formatMmValue(val) : '';
    node.querySelector('.tire-unit').textContent = hasMeasurement ? 'mm' : '';
    node.classList.toggle('has-note', !!note);
    node.classList.toggle('has-photo', !!photo);
    node.classList.toggle('has-change', change);
    node.classList.toggle('has-work', works.length > 0);
    node.classList.toggle('no-measurement', !hasMeasurement);
    if (window.markMeasureDirty) window.markMeasureDirty();
    if (summaryEl) {
      summaryEl.textContent = summaryItems.length ? summaryItems.join(', ') : 'Ei töitä';
      summaryEl.style.display = isWorkMode ? '' : 'none';
      summaryEl.classList.toggle('is-empty', summaryItems.length === 0);
    }
    if (window.renderWorkSummaryFromNodes) window.renderWorkSummaryFromNodes();
  }

  function updateChangeButton(node) {
    if (!changeTireBtn) {
      updateChangeTabs(node);
      return;
    }
    const active = !!node && node.dataset.change === '1';
    changeTireBtn.classList.toggle('change-tire-active', active);
    changeTireBtn.textContent = active ? 'Peru vaihto' : 'Vaihda rengas';
    updateChangeTabs(node);
  }

  function setActiveValue(val) {
    const target = parseMeasurementValue(val);
    modalGrid.querySelectorAll('.value-btn').forEach(b=>{
      const btnVal = Number(b.dataset.value);
      const isActive = target != null && Math.abs(btnVal - target) < 0.001;
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

    if (tireNewMm) {
      const mmRaw = node.dataset.value;
      tireNewMm.value = (mmRaw != null && String(mmRaw).trim() !== '') ? String(mmRaw) : '';
    }

    const works = parseWorkList(node.dataset.works || '');
    setSelectedWorks(works);
    setSelectedWorkRim(node.dataset.workRim || '');
    if (workRimEtInput) workRimEtInput.value = normalizeEtValue(node.dataset.et || '');

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

    setActiveValue(node.dataset.value);
    updateRimChangeButton(node);
    updateChangeButton(node);
    if (isWorkMode && node.dataset.change === '1') {
      setChangeTab('new');
    } else {
      setChangeTab('new');
    }
    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
    setChangeTab('new');
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

    if (isWorkMode) {
      const sourceChangeActive = currentNode.dataset.change === '1';
      const sourceRimChangeActive = getWorksSet(currentNode).has('Vanteen vaihto');
      const payload = {
        size: formatTyreSize((currentNode.dataset.size || '').trim()),
        make: normalizeTyreMake(currentNode.dataset.make || ''),
        value: currentNode.dataset.value || '',
        runko: (currentNode.dataset.runko || '').trim().toUpperCase(),
        change: sourceChangeActive,
        works: currentNode.dataset.works || '',
        workRim: currentNode.dataset.workRim || '',
        et: normalizeEtValue(currentNode.dataset.et || '')
      };

      if (!payload.size) payload.size = formatTyreSize((tireSize.value || '').trim());
      if (!payload.size) payload.size = formatTyreSize((currentNode.dataset.oldSize || '').trim());
      if (!payload.make) payload.make = normalizeTyreMake(tireMake.value || '');

      containerEl.querySelectorAll('.tire-node').forEach(node=>{
        if (node.dataset.axle !== axleId) return;

        if (payload.change && node !== currentNode && node.dataset.change !== '1') {
          const existingSize = formatTyreSize((node.dataset.size || '').trim());
          const existingMake = normalizeTyreMake(node.dataset.make || '');
          const existingRunko = (node.dataset.runko || '').trim().toUpperCase();
          const existingValue = parseMeasurementValue(node.dataset.value);

          if (!node.dataset.oldSize && existingSize) node.dataset.oldSize = existingSize;
          if (!node.dataset.oldMake && existingMake) node.dataset.oldMake = existingMake;
          if (!node.dataset.oldRunko && existingRunko) node.dataset.oldRunko = existingRunko;
          if ((node.dataset.oldValue == null || node.dataset.oldValue === '') && existingValue != null) node.dataset.oldValue = String(existingValue);
        }

        if (sourceRimChangeActive && node !== currentNode && !getWorksSet(node).has('Vanteen vaihto')) {
          const existingRim = (node.dataset.rim || '').trim();
          if (!node.dataset.oldRim && existingRim) node.dataset.oldRim = existingRim;
          if (!node.dataset.oldEt && (node.dataset.et || '').trim()) node.dataset.oldEt = normalizeEtValue(node.dataset.et || '');
        }

        node.dataset.size = payload.size;
        node.dataset.make = payload.make;
        node.dataset.value = payload.value;
        node.dataset.runko = payload.runko;
        node.dataset.change = payload.change ? '1' : '';
        node.dataset.works = payload.works;
        node.dataset.workRim = payload.workRim;
        if (sourceRimChangeActive && payload.workRim) node.dataset.et = payload.et;
        updateTireNode(node);
      });

      if (currentNode.dataset.axle === axleId) {
        setSelectedWorks(parseWorkList(currentNode.dataset.works || ''));
        setSelectedWorkRim(currentNode.dataset.workRim || '');
        updateRimChangeButton(currentNode);
        updateChangeButton(currentNode);
      }
      return;
    }

    const payload = {
      value: currentNode.dataset.value || '',
      size: formatTyreSize((currentNode.dataset.size || '').trim()),
      make: normalizeTyreMake(currentNode.dataset.make || ''),
      rim: currentNode.dataset.rim || '',
      et: (currentNode.dataset.et || '').trim()
    };

    if (!payload.size) payload.size = formatTyreSize((tireSize.value || '').trim());
    if (!payload.make) payload.make = normalizeTyreMake(tireMake.value || '');
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

    setActiveValue(payload.value);
  };

  if (copyRimAllBtn) {
    copyRimAllBtn.onclick = ()=>{
      if (!currentNode) return;
      const val = getSelectedRim();
      if (!val) return alert('Vannetyyppi puuttuu');
      containerEl.querySelectorAll('.tire-node').forEach(node=>{
        node.dataset.rim = val;
      });
    };
  }

  if (changeTireBtn) {
    changeTireBtn.onclick = ()=>{
    if (!currentNode) return;

    if (currentNode.dataset.change === '1') {
      const restoredSize = formatTyreSize((currentNode.dataset.oldSize || currentNode.dataset.size || '').trim());
      const restoredMake = normalizeTyreMake(currentNode.dataset.oldMake || '');
      const restoredRunko = (currentNode.dataset.oldRunko || '').trim().toUpperCase();
      const restoredValue = (currentNode.dataset.oldValue != null && currentNode.dataset.oldValue !== '')
        ? parseMeasurementValue(currentNode.dataset.oldValue)
        : parseMeasurementValue(currentNode.dataset.value);

      currentNode.dataset.change = '';
      currentNode.dataset.size = restoredSize;
      currentNode.dataset.make = restoredMake;
      currentNode.dataset.runko = restoredRunko;
      currentNode.dataset.value = restoredValue != null ? String(restoredValue) : '';

      currentNode.dataset.oldSize = '';
      currentNode.dataset.oldMake = '';
      currentNode.dataset.oldRunko = '';
      currentNode.dataset.oldValue = '';

      tireSize.value = restoredSize;
      tireMake.value = restoredMake;
      tireRunko.value = restoredRunko;
      if (tireNewMm) tireNewMm.value = restoredValue != null ? String(restoredValue) : '';

      updateChangeButton(currentNode);
      updateTireNode(currentNode);
      setActiveValue(restoredValue);
      setChangeTab('new');
      return;
    }

    const currentOldMake = (currentNode.dataset.oldMake || '').trim();
    const currentOld = (currentNode.dataset.oldRunko || '').trim().toUpperCase();
    const currentOldSize = (currentNode.dataset.oldSize || '').trim();
    const currentRunko = (currentNode.dataset.runko || '').trim().toUpperCase();
    const currentSize = formatTyreSize((currentNode.dataset.size || '').trim());
    const currentMake = normalizeTyreMake(currentNode.dataset.make || '');
    const currentOldValue = currentNode.dataset.oldValue;
    const currentValue = parseMeasurementValue(currentNode.dataset.value);

    currentNode.dataset.change = '1';

    if ((!currentOldValue || currentOldValue === '') && currentValue != null) {
      currentNode.dataset.oldValue = String(currentValue);
    }

    if (!currentOldMake && currentMake) {
      currentNode.dataset.oldMake = currentMake;
    }

    if (!currentOldSize && currentSize) {
      currentNode.dataset.oldSize = currentSize;
    }

    const defaultNewSize = currentSize || (currentNode.dataset.oldSize || '');

    if (!currentOld && currentRunko) {
      currentNode.dataset.oldRunko = currentRunko;
    }

    currentNode.dataset.make = '';
    currentNode.dataset.size = defaultNewSize;
    currentNode.dataset.runko = '';

    tireSize.value = defaultNewSize;
    tireMake.value = '';
    tireRunko.value = '';

    updateChangeButton(currentNode);
    updateTireNode(currentNode);
    setChangeTab('new');
      tireRunko.focus();
    };
  }

  if (changeRimBtn) {
    changeRimBtn.onclick = ()=>{
    if (!currentNode) return;
    const works = getWorksSet(currentNode);
    if (works.has('Vanteen vaihto')) {
      works.delete('Vanteen vaihto');
      currentNode.dataset.et = normalizeEtValue(currentNode.dataset.oldEt || currentNode.dataset.et || '');
      currentNode.dataset.oldRim = '';
      currentNode.dataset.oldEt = '';
      currentNode.dataset.workRim = '';
      if (workRimProductInput) workRimProductInput.value = '';
      if (workRimEtInput) workRimEtInput.value = normalizeEtValue(currentNode.dataset.et || '');
      setRimChangeTab('new');
    } else {
      const currentRim = (currentNode.dataset.rim || '').trim();
      if (!currentNode.dataset.oldRim && currentRim) {
        currentNode.dataset.oldRim = currentRim;
      }
      if (!currentNode.dataset.oldEt && (currentNode.dataset.et || '').trim()) {
        currentNode.dataset.oldEt = normalizeEtValue(currentNode.dataset.et || '');
      }
      currentNode.dataset.workRim = '';
      if (workRimProductInput) workRimProductInput.value = '';
      if (workRimEtInput) workRimEtInput.value = '';
      works.add('Vanteen vaihto');
      setRimChangeTab('new');
    }
    currentNode.dataset.works = [...works].join('|');
    updateRimChangeButton(currentNode);
    updateTireNode(currentNode);
    };
  }

  if (workRimProductInput) {
    workRimProductInput.addEventListener('input', ()=>{
      if (!currentNode) return;
      currentNode.dataset.workRim = getSelectedWorkRim();
      updateTireNode(currentNode);
    });

    workRimProductInput.addEventListener('blur', ()=>{
      if (!currentNode) return;
      const value = getSelectedWorkRim();
      workRimProductInput.value = value;
      currentNode.dataset.workRim = value;
      const etValue = getEtFromProductName(value);
      if (workRimEtInput && etValue && !String(workRimEtInput.value || '').trim()) {
        workRimEtInput.value = etValue;
      }
      updateTireNode(currentNode);
    });
  }

  if (workRimEtInput) {
    workRimEtInput.addEventListener('input', ()=>{
      if (!currentNode) return;
      currentNode.dataset.et = normalizeEtValue(workRimEtInput.value);
    });

    workRimEtInput.addEventListener('blur', ()=>{
      if (!currentNode) return;
      const value = normalizeEtValue(workRimEtInput.value);
      workRimEtInput.value = value;
      currentNode.dataset.et = value;
    });
  }

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
    updateTireNode(currentNode);
  });

  tireSize.addEventListener('blur', ()=>{
    if (!currentNode) return;
    const val = formatTyreSize(tireSize.value.trim());
    tireSize.value = val;
    currentNode.dataset.size = val;
    updateTireNode(currentNode);
  });

  tireMake.addEventListener('input', ()=>{
    if (!currentNode) return;
    const val = normalizeTyreMake(tireMake.value);
    currentNode.dataset.make = val;
    updateTireNode(currentNode);
  });

  tireMake.addEventListener('blur', ()=>{
    if (!currentNode) return;
    const val = normalizeTyreMake(tireMake.value);
    tireMake.value = val;
    currentNode.dataset.make = val;
    updateTireNode(currentNode);
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
    updateTireNode(currentNode);
  });

  if (tireNewMm) {
    tireNewMm.addEventListener('input', ()=>{
      if (!currentNode) return;
      const raw = String(tireNewMm.value || '').trim().replace(',', '.');
      if (!raw) return;
      const num = Number(raw);
      if (Number.isNaN(num)) return;
      currentNode.dataset.value = String(num);
      updateTireNode(currentNode);
      setActiveValue(num);
    });
  }

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
    const wrap = document.createElement('div');
    wrap.className = 'tire-node-stack';

    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'tire-node';
    node.dataset.index = String(index);
    node.dataset.axle = String(axleIndex);
    node.dataset.value = values[index] != null ? String(values[index]) : '';
    if (notes[index]) node.dataset.note = notes[index];
    if (photos[index]) node.dataset.photo = photos[index];
    node.dataset.size = (prevSizes && prevSizes[index]) ? prevSizes[index] : (axleConfig && axleConfig.size ? axleConfig.size : '');
    node.dataset.size = formatTyreSize(node.dataset.size);
    node.dataset.make = normalizeTyreMake((prevMakes && prevMakes[index]) ? prevMakes[index] : (axleConfig && axleConfig.make ? axleConfig.make : ''));
    node.dataset.rim = (prevRims && prevRims[index]) ? prevRims[index] : (axleConfig && axleConfig.rim ? axleConfig.rim : '');
    node.dataset.et = (prevEts && prevEts[index]) ? prevEts[index] : (axleConfig && axleConfig.et ? axleConfig.et : '');
    node.dataset.change = (prevChanges && prevChanges[index]) ? '1' : '';
    node.dataset.oldRunko = (prevOldRunkos && prevOldRunkos[index]) ? String(prevOldRunkos[index]).toUpperCase() : '';
    node.dataset.runko = (prevRunkos && prevRunkos[index]) ? String(prevRunkos[index]).toUpperCase() : '';
    node.dataset.works = (prevWorks && prevWorks[index]) ? String(prevWorks[index]) : '';
    node.dataset.workRim = (prevWorkRims && prevWorkRims[index]) ? String(prevWorkRims[index]) : '';
    node.dataset.oldRim = '';
    node.dataset.oldEt = '';
    node.dataset.oldSize = '';
    node.dataset.oldMake = (prevOldMakes && prevOldMakes[index]) ? normalizeTyreMake(prevOldMakes[index]) : '';
    node.dataset.oldValue = (prevOldValues && prevOldValues[index] != null) ? String(prevOldValues[index]) : '';
    node.innerHTML = `
      <span class="tire-label">${label || ''}</span>
      <span class="tire-value">${values[index] != null ? formatMmValue(values[index]) : ''}</span>
      <span class="tire-unit">${values[index] != null ? 'mm' : ''}</span>
    `;
    const summary = document.createElement('div');
    summary.className = 'position-work-summary';
    wrap.appendChild(node);
    wrap.appendChild(summary);
    updateTireNode(node);
    node.onclick = ()=> openModal(node, index);
    return wrap;
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

  if (window.renderWorkSummaryFromNodes) window.renderWorkSummaryFromNodes();
}

function setMeasurementReadOnlyState(containerEl, readOnly) {
  const modal = containerEl.querySelector('.tire-modal');
  if (!modal) return;

  const hiddenActionSelectors = [
    '.copy-axle-btn',
    '.copy-size-all-btn',
    '.copy-rim-all-btn',
    '.change-rim-btn',
    '.change-tire-btn',
    '.photo-btn'
  ];

  hiddenActionSelectors.forEach(selector=>{
    const el = modal.querySelector(selector);
    if (!el) return;
    el.style.display = readOnly ? 'none' : '';
    el.disabled = readOnly;
  });

  const readOnlyFields = [
    '.tire-size-input',
    '.tire-make-input',
    '.tire-et-input',
    '.tire-runko-input',
    '.tire-new-mm-input',
    '.note-input'
  ];

  readOnlyFields.forEach(selector=>{
    const el = modal.querySelector(selector);
    if (!el) return;
    el.readOnly = readOnly;
  });

  const disabledSelectors = [
    '.value-btn',
    '.tire-rim-check',
    '.tire-work-check',
    '.work-rim-check',
    '.photo-input'
  ];

  disabledSelectors.forEach(selector=>{
    modal.querySelectorAll(selector).forEach(el=>{
      el.disabled = readOnly;
    });
  });
}

function renderHistory(containerEl, HistoryManagerRef) {
  const list = HistoryManagerRef.load();
  const drafts = window.DraftManager ? window.DraftManager.load() : [];
  containerEl.innerHTML = "";
  if (!list.length && !drafts.length) {
    containerEl.innerHTML = "<p>Ei tallennettuja raportteja.</p>";
    return;
  }

  // Group by company -> plate -> records
  const map = {};
  list.forEach((r, idx)=>{
    const company = r.company || "Ilman yritystä";
    if (!map[company]) map[company] = {};
    if (!map[company][r.plate]) map[company][r.plate] = [];
    map[company][r.plate].push({rec:r, idx, type: 'completed'});
  });

  // Add drafts
  drafts.forEach((d, idx)=>{
    const company = d.company || "Ilman yritystä";
    if (!map[company]) map[company] = {};
    if (!map[company][d.plate]) map[company][d.plate] = [];
    map[company][d.plate].push({rec:d, idx, type: 'draft'});
  });

  Object.keys(map).forEach(company=>{
    const compCard = document.createElement('div');
    compCard.className = 'card';
    compCard.innerHTML = `<h3>${company}
      <button class="btn-sm" data-download-company="${company}" data-mode="all" style="margin-left:8px;">Lataa kaikki</button>
      <button class="btn-sm" data-download-company="${company}" data-mode="measurement" style="margin-left:6px;">Lataa mittaukset</button>
      <button class="btn-sm" data-download-company="${company}" data-mode="work" style="margin-left:6px;">Lataa työt</button>
      <button class="btn-sm" data-fleet-company="${company}" style="margin-left:6px;">Kalustoraportti</button>
      <button class="btn-sm" data-fleet-table-company="${company}" style="margin-left:6px;">Taulukkoraportti</button>
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

      const measurementEntries = arr.filter(entry => entry.type === 'completed' && (entry.rec.mode || 'measurement') !== 'work');
      const workEntries = arr.filter(entry => entry.type === 'completed' && entry.rec.mode === 'work');
      const draftEntries = arr.filter(entry => entry.type === 'draft');

      function appendSection(title, entries, isDraft = false) {
        const section = document.createElement('div');
        section.style.marginBottom = '8px';

        const sectionTitle = document.createElement('div');
        sectionTitle.style.fontSize = '0.85rem';
        sectionTitle.style.fontWeight = '600';
        sectionTitle.style.color = isDraft ? '#dc2626' : '#475569';
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
          const updated = !isDraft && r.updatedAt ? ` • Muokattu ${r.updatedAt}` : '';
          const actions = isDraft 
            ? `<button class="btn-sm secondary" data-continue-draft="${i}">Jatka</button> <button class="btn-sm danger" data-del-draft="${i}">X</button>`
            : `<button class="btn-sm secondary" data-view="${i}">Avaa</button> <button class="btn-sm primary" data-edit="${i}">Muokkaa</button> <button class="btn-sm" data-pdf="${i}">PDF</button> <button class="btn-sm danger" data-del="${i}">X</button>`;
          item.innerHTML = `
            <div>
              <small>${r.date}${km}${updated} ${isDraft ? '<span style="color:#dc2626;">[LUONNOS]</span>' : ''}</small>
            </div>
            <div class="history-actions">
              ${actions}
            </div>
          `;
          section.appendChild(item);
        });

        reportsContainer.appendChild(section);
      }

      appendSection('Luonnokset', draftEntries, true);
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
      const idx = Number(btn.dataset.del);
      const deleted = list[idx];
      list.splice(idx,1);
      if (deleted && deleted.plate && window.recomputeWearForPlate) {
        window.recomputeWearForPlate(list, deleted.plate);
      }
      HistoryManagerRef.save(list);
      renderHistory(containerEl, HistoryManagerRef);
      if (window.refreshHomeUi) window.refreshHomeUi();
    };
  });

  containerEl.querySelectorAll('[data-pdf]').forEach(btn=>{
    btn.onclick = ()=> {
      if (window.generatePdf) window.generatePdf(btn.dataset.pdf);
      else alert('PDF ei saatavilla (jsPDF ei ladattu)');
    };
  });

  containerEl.querySelectorAll('[data-view]').forEach(btn=>{
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.view);
      if (window.loadHistoryRecord) window.loadHistoryRecord(idx, false);
    };
  });

  containerEl.querySelectorAll('[data-edit]').forEach(btn=>{
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.edit);
      if (window.loadHistoryRecord) window.loadHistoryRecord(idx, true);
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

  containerEl.querySelectorAll('[data-fleet-company]').forEach(btn=>{
    btn.onclick = ()=>{
      const company = btn.dataset.fleetCompany;
      if (window.generateCompanyFleetOverviewReport) window.generateCompanyFleetOverviewReport(company);
      else alert('Kalustoraportti ei saatavilla');
    };
  });

  containerEl.querySelectorAll('[data-fleet-table-company]').forEach(btn=>{
    btn.onclick = ()=>{
      const company = btn.dataset.fleetTableCompany;
      if (window.generateCompanyFleetTableReport) window.generateCompanyFleetTableReport(company);
      else alert('Taulukkoraportti ei saatavilla');
    };
  });

  containerEl.querySelectorAll('[data-continue-draft]').forEach(btn=>{
    btn.onclick = ()=>{
      const idx = Number(btn.dataset.continueDraft);
      const drafts = window.DraftManager.load();
      const draft = drafts[idx];
      if (!draft) return;
      if (window.loadDraftToEditor) window.loadDraftToEditor(draft);
    };
  });

  containerEl.querySelectorAll('[data-del-draft]').forEach(btn=>{
    btn.onclick = ()=>{
      if (!confirm('Poistetaanko luonnos?')) return;
      const idx = Number(btn.dataset.delDraft);
      const drafts = window.DraftManager.load();
      drafts.splice(idx, 1);
      window.DraftManager.save(drafts);
      renderHistory(containerEl, HistoryManagerRef);
      if (window.refreshHomeUi) window.refreshHomeUi();
    };
  });
}

// Export to window
window.buildAxleUI = buildAxleUI;
window.buildPositions = buildPositions;
window.buildMeasurementUI = buildMeasurementUI;
window.setMeasurementReadOnlyState = setMeasurementReadOnlyState;
window.renderHistory = renderHistory;
