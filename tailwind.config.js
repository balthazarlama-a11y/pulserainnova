/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./hooks/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Acentos con soporte <alpha-value> (Tailwind 3.x). Triplets RGB en globals.css.
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        brand: "rgb(var(--brand-rgb) / <alpha-value>)",
        attention: "rgb(var(--attention-rgb) / <alpha-value>)",
        calm: "rgb(var(--calm-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        // Tokens semánticos por rol (rgba pre-mezclados; sin opacity modifier).
        "ink-muted": "var(--ink-muted)",
        "ink-dim": "var(--ink-dim)",
        "ink-faint": "var(--ink-faint)",
        "ink-on-accent": "var(--ink-on-accent)",
        bg: "var(--bg)",
        "bg-elevated": "var(--bg-elevated)",
        surface: "var(--surface)",
        "surface-elevated": "var(--surface-elevated)",
        "surface-strong": "var(--surface-strong)",
        line: "var(--border)",
        "line-strong": "var(--border-strong)"
      },
      fontFamily: {
        display: ["Fraunces", "ui-serif", "Georgia", "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.03), 0 24px 48px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        "card-hover":
          "inset 0 1px 0 rgba(255,255,255,0.09), 0 1px 0 rgba(255,255,255,0.05), 0 36px 64px -20px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.08)"
      },
      animation: {
        "aurora-shift": "auroraShift 14s ease-in-out infinite",
        "breathe-slow": "breatheSlow 6s ease-in-out infinite",
        "dot-pulse": "dotPulse 1.8s ease-in-out infinite"
      },
      keyframes: {
        auroraShift: {
          "0%, 100%": {
            transform: "translate3d(-4%, -2%, 0) scale(1)",
            opacity: "0.75"
          },
          "50%": {
            transform: "translate3d(4%, 3%, 0) scale(1.08)",
            opacity: "1"
          }
        },
        breatheSlow: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" }
        },
        dotPulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 currentColor" },
          "70%": { boxShadow: "0 0 0 10px transparent" }
        }
      }
    }
  },
  plugins: []
};
