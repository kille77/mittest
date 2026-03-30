// Autocomplete Setup Functions

function normalizeAutocompleteText(value) {
  return String(value || '').trim().toUpperCase();
}

function normalizeCompactToken(value) {
  return normalizeAutocompleteText(value).replace(/[^A-Z0-9]/g, '');
}

function normalizeDigitToken(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeEtToken(value) {
  return String(value || '').trim().replace(',', '.');
}

function extractTyreSearchSize(value) {
  const formatTyreSize = window.formatTyreSize;
  if (typeof formatTyreSize !== 'function') return '';

  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';

  const direct = String(formatTyreSize(raw) || '').trim().toUpperCase();
  if (/^\d{3}\/\d{2}R\d{2}(?:\.\d)?(?:C)?$/.test(direct)) {
    return direct;
  }

  const match = raw.match(/\d{3}\/\d{2}R\d{2}(?:[.,]\d)?C?/);
  return match ? String(formatTyreSize(match[0]) || '').trim().toUpperCase() : '';
}

function extractTyreRimDiameter(value) {
  const tyreSize = extractTyreSearchSize(value);
  const match = tyreSize.match(/R(\d{2}(?:\.\d)?)/);
  return match && match[1] ? match[1] : '';
}

function isSizeOnlyTyreEntry(value) {
  const text = String(value || '').trim().toUpperCase();
  if (!text) return false;
  return text === extractTyreSearchSize(text);
}

function tokenizeTyreProductQuery(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean)
    .map(token => ({
      raw: token,
      compact: normalizeCompactToken(token),
      digits: normalizeDigitToken(token)
    }));
}

function getTyreProductCatalogItems() {
  const catalogItems = window.__productCatalog && Array.isArray(window.__productCatalog.tyreMakes)
    ? window.__productCatalog.tyreMakes
    : [];
  const storedItems = typeof window.loadList === 'function' && window.StorageKeys
    ? window.loadList(window.StorageKeys.tyreMakes())
    : [];

  return [...new Set([...(catalogItems || []), ...(storedItems || [])].map(item => String(item || '').trim()).filter(Boolean))];
}

function getSelectedVehicleType() {
  const selected = String(window.__selectedVehicleType || '').trim();
  if (selected) return selected;

  const checked = document.querySelector('#vehicleType input[type="radio"]:checked');
  return checked ? String(checked.value || '').trim() : '';
}

function getAllowedStockPrefixesForVehicleType(vehicleType) {
  const normalized = String(vehicleType || '').trim();
  if (normalized === 'Kuorma-auto' || normalized === 'Perävaunu') {
    return new Set(['P', 'H']);
  }
  if (normalized === 'Auto') {
    return new Set(['A', 'B', 'C', 'D', 'H']);
  }
  return null;
}

function getTyreProductPrefixMap() {
  const products = window.__productCatalog && Array.isArray(window.__productCatalog.products)
    ? window.__productCatalog.products
    : [];
  const map = new Map();

  products.forEach(product => {
    if (!product || String(product.category || '').trim() !== 'tyre') return;

    const name = String(product.name || '').trim();
    if (!name) return;

    const stockCode = String(product.stockCode || '').trim();
    const prefixMatch = stockCode.match(/^([A-Z])\s*\//i);
    if (!prefixMatch || !prefixMatch[1]) return;

    const prefix = String(prefixMatch[1]).toUpperCase();
    if (!map.has(name)) {
      map.set(name, new Set([prefix]));
      return;
    }
    map.get(name).add(prefix);
  });

  return map;
}

function isTyreProductAllowedForVehicleType(productName, vehicleType, prefixMap) {
  const allowedPrefixes = getAllowedStockPrefixesForVehicleType(vehicleType);
  if (!allowedPrefixes || !allowedPrefixes.size) return true;

  const prefixes = prefixMap.get(String(productName || '').trim());
  if (!prefixes || !prefixes.size) {
    return true;
  }

  for (const prefix of prefixes) {
    if (allowedPrefixes.has(prefix)) return true;
  }
  return false;
}

function getRimProductCatalogItems() {
  const catalogItems = window.__productCatalog && Array.isArray(window.__productCatalog.rimProducts)
    ? window.__productCatalog.rimProducts
    : [];

  return [...new Set((catalogItems || []).map(item => String(item || '').trim()).filter(Boolean))];
}

function extractEtFromProductText(value) {
  const match = String(value || '').match(/ET\s*([0-9]+(?:[.,][0-9]+)?)/i);
  return match ? normalizeEtToken(match[1]) : '';
}

function normalizeRimSizeToken(value) {
  return normalizeAutocompleteText(value)
    .replace(/,/g, '.')
    .replace(/\s+/g, '')
    .replace(/JX/g, 'X');
}

function normalizeBoltPatternToken(value) {
  return normalizeAutocompleteText(value)
    .replace(/,/g, '.')
    .replace(/\s+/g, '')
    .replace(/MM/g, '');
}

function extractRimSizeFromText(value) {
  const match = String(value || '').match(/(\d{1,2}(?:[.,]\d{1,2})?J?\s*X\s*\d{1,2}(?:[.,]\d)?)/i);
  return match ? normalizeRimSizeToken(match[1]) : '';
}

function extractRimDiameterFromRimSize(value) {
  const normalized = normalizeRimSizeToken(value || '');
  const match = normalized.match(/X(\d{1,2}(?:\.\d)?)/);
  return match && match[1] ? match[1] : '';
}

function extractBoltPatternsFromText(value) {
  const text = normalizeAutocompleteText(value).replace(/,/g, '.');
  const matches = [...text.matchAll(/(\d{1,2}\s*X\s*\d{2,3}(?:[.]\d+)?)(?:MM)?/g)];
  const sizeToken = extractRimSizeFromText(text);

  return [...new Set(matches
    .map(match => normalizeBoltPatternToken(match[1]))
    .filter(token => token && token !== sizeToken))];
}

function extractCenterBoreFromText(value) {
  const match = String(value || '').match(/(?:KR\.?|CB)\s*([0-9]+(?:[.,][0-9]+)?)/i);
  return match ? normalizeEtToken(match[1]) : '';
}

function parseRimSearchQuery(query) {
  const raw = String(query || '');
  return {
    rimSize: extractRimSizeFromText(raw),
    boltPatterns: extractBoltPatternsFromText(raw),
    et: extractEtFromProductText(raw),
    centerBore: extractCenterBoreFromText(raw)
  };
}

function buildRimSuggestionMeta(value) {
  const text = String(value || '').trim();
  const rimSize = extractRimSizeFromText(text);
  const boltPatterns = extractBoltPatternsFromText(text);
  const centerBore = extractCenterBoreFromText(text);
  const et = extractEtFromProductText(text);
  const specParts = [];

  if (rimSize) specParts.push(rimSize.replace(/X/g, 'x'));
  if (boltPatterns.length) specParts.push(boltPatterns.join(' '));
  if (centerBore) specParts.push(`Kr ${centerBore}`);
  if (et) specParts.push(`ET ${et}`);

  return {
    title: text,
    specs: specParts.join(' | ')
  };
}

function buildRimSuggestionElement(value, query) {
  const meta = buildRimSuggestionMeta(value);
  const querySpecs = parseRimSearchQuery(query || '');
  const parts = [];

  if (meta.specs) {
    meta.specs.split(' | ').forEach(part => {
      const normalizedPart = normalizeAutocompleteText(part);
      const isMatch = (
        (querySpecs.rimSize && normalizedPart === normalizeAutocompleteText(querySpecs.rimSize.replace(/X/g, 'x'))) ||
        (querySpecs.boltPatterns || []).some(pattern => normalizedPart === normalizeAutocompleteText(pattern.replace(/X/g, 'x'))) ||
        (querySpecs.centerBore && normalizedPart === normalizeAutocompleteText(`Kr ${querySpecs.centerBore}`)) ||
        (querySpecs.et && normalizedPart === normalizeAutocompleteText(`ET ${querySpecs.et}`))
      );
      parts.push({ text: part, isMatch });
    });
  }

  const root = document.createElement('div');

  const title = document.createElement('div');
  title.className = 'autocomplete-suggestion-title';
  title.textContent = meta.title;
  root.appendChild(title);

  if (parts.length) {
    const subtitle = document.createElement('div');
    subtitle.className = 'autocomplete-suggestion-subtitle';

    parts.forEach((part, index) => {
      const span = document.createElement('span');
      span.className = `autocomplete-spec${part.isMatch ? ' is-match' : ''}`;
      span.textContent = part.text;
      subtitle.appendChild(span);

      if (index < parts.length - 1) {
        const separator = document.createElement('span');
        separator.className = 'autocomplete-spec-separator';
        separator.textContent = ' | ';
        subtitle.appendChild(separator);
      }
    });

    root.appendChild(subtitle);
  }

  return root;
}

function searchTyreProductItems(query, currentSize, vehicleType, limit = 20, disableVehicleTypeFilter = false) {
  const items = getTyreProductCatalogItems();
  const normalizedQuery = normalizeAutocompleteText(query);
  const compactQuery = normalizeCompactToken(query);
  const queryDigits = normalizeDigitToken(query);
  const sizeContext = extractTyreSearchSize(currentSize);
  const queryTokens = tokenizeTyreProductQuery(query);
  const prefixMap = getTyreProductPrefixMap();

  const scored = items.map(item => {
    const text = String(item || '').trim();
    if (!disableVehicleTypeFilter && !isTyreProductAllowedForVehicleType(text, vehicleType, prefixMap)) {
      return null;
    }

    const upper = normalizeAutocompleteText(text);
    const compact = normalizeCompactToken(text);
    const digits = normalizeDigitToken(text);
    const productSize = extractTyreSearchSize(text);

    if (sizeContext && productSize !== sizeContext) {
      return null;
    }

    let score = 0;

    if (sizeContext && productSize === sizeContext) {
      score += 1000;
    }

    if (normalizedQuery && upper.includes(normalizedQuery)) {
      score += 250;
    }

    if (compactQuery && compact.includes(compactQuery)) {
      score += 180;
    }

    if (queryDigits && queryDigits.length >= 5 && digits.includes(queryDigits)) {
      score += 220;
    }

    if (queryTokens.length) {
      const allTokensMatch = queryTokens.every(token => {
        if (token.digits && token.digits.length >= 5) {
          return digits.includes(token.digits);
        }
        if (!token.compact) {
          return true;
        }
        return compact.includes(token.compact);
      });

      if (!allTokensMatch) {
        return null;
      }

      score += queryTokens.length * 35;
    }

    if (!normalizedQuery && sizeContext && productSize === sizeContext) {
      score += 50;
    }

    if (score <= 0) {
      return null;
    }

    if (sizeContext && productSize === sizeContext && queryDigits && digits.startsWith(queryDigits)) {
      score += 25;
    }

    return { text, score };
  }).filter(Boolean);

  let results = scored
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.text.localeCompare(right.text, 'fi');
    })
    .slice(0, limit)
    .map(item => item.text);

  // If size is known, prefer real product labels over plain size-only entries.
  if (sizeContext && results.length) {
    const detailed = results.filter(item => !isSizeOnlyTyreEntry(item));
    if (detailed.length) {
      results = detailed;
    }
  }

  // If size is known but vehicle type filter blocks everything, fall back to size-based results.
  if (!disableVehicleTypeFilter && sizeContext && results.length === 0) {
    return searchTyreProductItems(query, currentSize, vehicleType, limit, true);
  }

  return results;
}

function searchRimProductItems(query, context = {}, limit = 20) {
  const items = getRimProductCatalogItems();
  const normalizedQuery = normalizeAutocompleteText(query);
  const compactQuery = normalizeCompactToken(query);
  const queryDigits = normalizeDigitToken(query);
  const queryTokens = tokenizeTyreProductQuery(query);
  const querySpecs = parseRimSearchQuery(query);
  const targetEt = normalizeEtToken(context && context.currentEt ? context.currentEt : '');
  const targetRimDiameter = extractTyreRimDiameter(context && context.currentTyreSize ? context.currentTyreSize : '');
  const preferredItems = new Set(
    Array.isArray(context && context.preferredItems)
      ? context.preferredItems.map(item => String(item || '').trim()).filter(Boolean)
      : []
  );

  const scored = items.map(item => {
    const text = String(item || '').trim();
    const upper = normalizeAutocompleteText(text);
    const compact = normalizeCompactToken(text);
    const digits = normalizeDigitToken(text);
    const itemEt = extractEtFromProductText(text);
    const itemRimSize = extractRimSizeFromText(text);
    const itemRimDiameter = extractRimDiameterFromRimSize(itemRimSize);
    const itemBoltPatterns = new Set(extractBoltPatternsFromText(text));
    const itemCenterBore = extractCenterBoreFromText(text);
    let score = 0;

    if (querySpecs.rimSize && itemRimSize !== querySpecs.rimSize) {
      return null;
    }

    if (!querySpecs.rimSize && targetRimDiameter && itemRimDiameter !== targetRimDiameter) {
      return null;
    }

    if (querySpecs.boltPatterns.length) {
      const boltMatch = querySpecs.boltPatterns.every(pattern => itemBoltPatterns.has(pattern));
      if (!boltMatch) {
        return null;
      }
    }

    if (querySpecs.et && itemEt !== querySpecs.et) {
      return null;
    }

    if (querySpecs.centerBore && itemCenterBore !== querySpecs.centerBore) {
      return null;
    }

    if (preferredItems.has(text)) {
      score += 900;
    }

    if (targetEt && itemEt === targetEt) {
      score += 420;
    }

    if (querySpecs.rimSize && itemRimSize === querySpecs.rimSize) {
      score += 520;
    }

    if (!querySpecs.rimSize && targetRimDiameter && itemRimDiameter === targetRimDiameter) {
      score += 260;
    }

    if (querySpecs.boltPatterns.length) {
      score += querySpecs.boltPatterns.length * 340;
    }

    if (querySpecs.et && itemEt === querySpecs.et) {
      score += 410;
    }

    if (querySpecs.centerBore && itemCenterBore === querySpecs.centerBore) {
      score += 360;
    }

    if (normalizedQuery && upper.includes(normalizedQuery)) {
      score += 250;
    }

    if (compactQuery && compact.includes(compactQuery)) {
      score += 180;
    }

    if (queryDigits && queryDigits.length >= 2 && digits.includes(queryDigits)) {
      score += 120;
    }

    if (queryTokens.length) {
      const allTokensMatch = queryTokens.every(token => {
        if (token.digits && token.digits.length >= 2) {
          return digits.includes(token.digits);
        }
        if (!token.compact) {
          return true;
        }
        return compact.includes(token.compact);
      });

      if (!allTokensMatch) {
        return null;
      }

      score += queryTokens.length * 30;
    }

    if (!normalizedQuery) {
      score += 10;
    }

    if (targetEt && !normalizedQuery && itemEt === targetEt) {
      score += 60;
    }

    if (!normalizedQuery && querySpecs.rimSize && itemRimSize === querySpecs.rimSize) {
      score += 80;
    }

    if (!normalizedQuery && !querySpecs.rimSize && targetRimDiameter && itemRimDiameter === targetRimDiameter) {
      score += 70;
    }

    if (score <= 0) {
      return null;
    }

    return { text, score };
  }).filter(Boolean);

  return scored
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.text.localeCompare(right.text, 'fi');
    })
    .slice(0, limit)
    .map(item => item.text);
}

function setupAutocomplete(inputEl, suggestionsEl, getItems, onSelect, transformInput=null, options={}) {
  function closeSuggestions() {
    suggestionsEl.style.display = "none";
    suggestionsEl.innerHTML = "";
  }

  function openSuggestions(items, queryValue="") {
    if (!items.length) { closeSuggestions(); return; }
    suggestionsEl.innerHTML = "";
    items.forEach(item=>{
      const div = document.createElement("div");
      div.className = "autocomplete-suggestion";
      if (typeof options.renderItem === 'function') {
        const rendered = options.renderItem(item, queryValue);
        if (rendered instanceof HTMLElement) {
          div.appendChild(rendered);
        } else if (rendered && typeof rendered === 'object') {
          const title = document.createElement('div');
          title.className = 'autocomplete-suggestion-title';
          title.textContent = rendered.title || item;
          div.appendChild(title);

          if (rendered.subtitle) {
            const subtitle = document.createElement('div');
            subtitle.className = 'autocomplete-suggestion-subtitle';
            subtitle.textContent = rendered.subtitle;
            div.appendChild(subtitle);
          }
        } else {
          div.textContent = typeof rendered === 'string' ? rendered : item;
        }
      } else {
        div.textContent = item;
      }
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
    if (!val) { closeSuggestions(); return; }
    const filtered = typeof options.getMatches === 'function'
      ? options.getMatches(val)
      : getItems().filter(x => x.toLowerCase().includes(val.toLowerCase()));
    openSuggestions(filtered, val);
  });

  inputEl.addEventListener("focus", ()=>{
    const val = inputEl.value;
    const all = getItems();
    if (!val) {
      if (typeof options.getDefaultItems === 'function') {
        openSuggestions(options.getDefaultItems(), '');
        return;
      }
      if (all.length) openSuggestions(all.slice(0,10), '');
    } else {
      const filtered = typeof options.getMatches === 'function'
        ? options.getMatches(val)
        : all.filter(x => x.toLowerCase().includes(val.toLowerCase()));
      openSuggestions(filtered, val);
    }
  });

  document.addEventListener("click", e=>{
    if (!inputEl.contains(e.target) && !suggestionsEl.contains(e.target)) {
      closeSuggestions();
    }
  });
}

function setupTyreAutocomplete(inputEl, key, formatter=null, onSelect=null) {
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
    ()=>window.loadList(key),
    (item)=>{ if (onSelect) onSelect(item); },
    formatter
  );
}

function setupTyreProductAutocomplete(inputEl, getSizeValue, onSelect=null) {
  const wrap = document.createElement("div");
  wrap.className = "autocomplete-wrapper";
  inputEl.parentNode.insertBefore(wrap, inputEl);
  wrap.appendChild(inputEl);

  const sug = document.createElement("div");
  sug.className = "autocomplete-suggestions";
  sug.style.display = "none";
  wrap.appendChild(sug);

  const getCurrentSize = () => {
    if (typeof getSizeValue === 'function') {
      return getSizeValue();
    }
    return '';
  };

  const getCurrentVehicleType = () => getSelectedVehicleType();

  setupAutocomplete(
    inputEl,
    sug,
    ()=>getTyreProductCatalogItems(),
    (item)=>{ if (onSelect) onSelect(item); },
    null,
    {
      getMatches: (value)=>searchTyreProductItems(value, getCurrentSize(), getCurrentVehicleType()),
      getDefaultItems: ()=>searchTyreProductItems('', getCurrentSize(), getCurrentVehicleType())
    }
  );
}

function setupRimProductAutocomplete(inputEl, getContext=null, onSelect=null) {
  const wrap = document.createElement("div");
  wrap.className = "autocomplete-wrapper";
  inputEl.parentNode.insertBefore(wrap, inputEl);
  wrap.appendChild(inputEl);

  const sug = document.createElement("div");
  sug.className = "autocomplete-suggestions";
  sug.style.display = "none";
  wrap.appendChild(sug);

  const resolveContext = () => {
    if (typeof getContext === 'function') {
      return getContext() || {};
    }
    return {};
  };

  setupAutocomplete(
    inputEl,
    sug,
    ()=>getRimProductCatalogItems(),
    (item)=>{ if (onSelect) onSelect(item); },
    null,
    {
      getMatches: (value)=>searchRimProductItems(value, resolveContext()),
      getDefaultItems: ()=>searchRimProductItems('', resolveContext()),
      renderItem: (item, queryValue)=>buildRimSuggestionElement(item, queryValue)
    }
  );
}

window.setupTyreProductAutocomplete = setupTyreProductAutocomplete;
window.setupRimProductAutocomplete = setupRimProductAutocomplete;
