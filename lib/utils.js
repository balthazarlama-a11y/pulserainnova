export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const SEMANTIC_COLORS = {
  brand: "#2A9D8F",
  attention: "#D9A432",
  danger: "#DC4D55",
  calm: "#2A9D8F",
};

// Mapea un nivel de estrés (0-100) a una clave de estado clínico.
export function getStressKey(stress) {
  if (stress <= 30) return "calm";
  if (stress <= 55) return "mild";
  if (stress <= 75) return "moderate";
  return "high";
}

export function normalizeAccent(color) {
  const map = {
    "#A8E6CF": SEMANTIC_COLORS.calm,
    "#5EDC9A": SEMANTIC_COLORS.calm,
    "#F5D06F": SEMANTIC_COLORS.attention,
    "#F59E4C": SEMANTIC_COLORS.attention,
    "#FFB4A2": SEMANTIC_COLORS.danger,
    "#F4A6C0": SEMANTIC_COLORS.danger,
    "#EC5B6B": SEMANTIC_COLORS.danger,
    "#B8A4FF": SEMANTIC_COLORS.brand,
    "#2A9D8F": SEMANTIC_COLORS.brand,
    "#D9A432": SEMANTIC_COLORS.attention,
    "#DC4D55": SEMANTIC_COLORS.danger,
  };
  return map[color] || color || SEMANTIC_COLORS.brand;
}
