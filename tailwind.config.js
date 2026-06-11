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
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        brand: "rgb(var(--brand-rgb) / <alpha-value>)",
        attention: "rgb(var(--attention-rgb) / <alpha-value>)",
        calm: "rgb(var(--calm-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
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
        display: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.04)"
      },
      borderRadius: {
        card: "12px"
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "dot-pulse": "dotPulse 1.8s ease-in-out infinite"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
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
