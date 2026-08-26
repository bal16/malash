export const DEFAULT_SHORTCUT = "Ctrl+Alt+Shift+S";

const MOD_ORDER = ["Ctrl","Alt","Shift","Meta"] as const;

export function eventToString(e: KeyboardEvent): string {
  const mods: string[] = [];
  if (e.ctrlKey) mods.push("Ctrl");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");
  if (e.metaKey) mods.push("Meta");
  mods.sort((a,b) => MOD_ORDER.indexOf(a as typeof MOD_ORDER[number]) - MOD_ORDER.indexOf(b as typeof MOD_ORDER[number]));
  let key = e.key;
  if (key.length === 1) key = key.toUpperCase();
  // Normalize Space, keep F/Arrow names as-is
  if (key === " ") key = "Space";
  if (mods.length === 0) return key;
  return `${mods.join("+")}+${key}`;
}

export function validateShortcut(s: string): {ok:boolean, reason?:string} {
  if (!s || !s.includes("+")) return {ok:false, reason:"Need modifiers"};
  const parts = s.split("+");
  const key = parts[parts.length-1];
  const mods = parts.slice(0,-1);
  if (mods.length < 2) return {ok:false, reason:"Add another modifier to avoid site conflicts"};
  const allowedMods = new Set(["Ctrl","Alt","Shift","Meta"]);
  if (!mods.every(m => allowedMods.has(m))) return {ok:false, reason:"Invalid modifier"};
  if (!key || ["Control","Alt","Shift","Meta"].includes(key)) return {ok:false, reason:"Missing key"};
  const allowKey = /^[A-Z0-9]$/.test(key) || /^F\d{1,2}$/.test(key) || /^(ArrowUp|ArrowDown|ArrowLeft|ArrowRight|PageUp|PageDown|Home|End|Space|Enter)$/.test(key);
  if (!allowKey) return {ok:false, reason:"Key not allowed"};
  if (mods.length === 1 && /^[A-Z]$/.test(key)) return {ok:false, reason:"Too simple"};
  return {ok:true};
}

export function isPlatformEquivalent(a: string, b: string): boolean {
  if (a === b) return true;
  // Normalize Ctrl/Meta to placeholder and compare sorted parts
  const normalize = (s: string) => s.split("+").map(p => (p === "Ctrl" || p === "Meta") ? "MetaOrCtrl" : p).sort().join("+");
  if (normalize(a) === normalize(b)) return true;
  // Fallback simple swap checks for unsorted inputs
  const swap = (s:string) => s.includes("Ctrl") ? s.replace("Ctrl","Meta") : s.includes("Meta") ? s.replace("Meta","Ctrl") : s;
  return swap(a) === b || swap(b) === a;
}
