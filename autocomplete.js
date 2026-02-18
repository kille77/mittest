// Autocomplete Setup Functions

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
