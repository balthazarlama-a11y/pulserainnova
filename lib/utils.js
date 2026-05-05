export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export const SEMANTIC_COLORS = {
  brand: "#B8A4FF",
  attention: "#F5D06F",
  danger: "#EC5B6B",
  calm: "#5EDC9A",
};

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
  };
  return map[color] || color || SEMANTIC_COLORS.brand;
}
