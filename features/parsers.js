const UNIT_MS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

function parseDuration(value) {
  const match = /^([1-9]\d*)(s|m|h|d)$/i.exec(String(value || "").trim());
  if (!match) return null;
  return Number(match[1]) * UNIT_MS[match[2].toLowerCase()];
}

function splitPipeArgs(value, minimum = 2) {
  const parts = String(value || "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length >= minimum ? parts : null;
}

module.exports = { parseDuration, splitPipeArgs };
