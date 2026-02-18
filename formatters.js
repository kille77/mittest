// Formatter Functions

function formatTyreSize(raw) {
  if (!raw) return "";
  const val = String(raw).trim().toUpperCase().replace(/\s+/g, "");
  if (!val) return "";

  const formattedMatch = val.match(/^(\d{3})\/(\d{2})R(\d{2})(?:[\.,]?(\d))?$/);
  if (formattedMatch) {
    const width = formattedMatch[1];
    const profile = formattedMatch[2];
    const rim = formattedMatch[3];
    const decimal = formattedMatch[4];
    return decimal ? `${width}/${profile}R${rim}.${decimal}` : `${width}/${profile}R${rim}`;
  }

  const d = val.replace(/\D/g,"");
  // 38555225 -> 385/55R22.5
  if (d.length === 8) return `${d.slice(0,3)}/${d.slice(3,5)}R${d.slice(5,7)}.${d.slice(7)}`;
  // 3855522 -> 385/55R22
  if (d.length === 7) return `${d.slice(0,3)}/${d.slice(3,5)}R${d.slice(5,7)}`;
  return val;
}

function capitalizeWords(raw) {
  if (!raw) return "";
  const lower = String(raw).trim().toLocaleLowerCase('fi-FI');
  return lower.replace(/(^|[\s\-\/])([\p{L}])/gu, (m, sep, ch)=> sep + ch.toLocaleUpperCase('fi-FI'));
}

function formatMmValue(val) {
  if (val == null || val === "") return "-";
  const num = Number(val);
  if (Number.isNaN(num)) return String(val);
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}
