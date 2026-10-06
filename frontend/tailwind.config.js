/** @type {import("tailwindcss").Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        slate: {
          750: "#1e293b",
          850: "#111827",
          950: "#0b0f19",
        },
        civic: {
          canvas:      "#f8fafc",
          surface:     "#ffffff",
          elevated:    "#f1f5f9",
          charcoal:    "#0f172a",
          muted:       "#475569",
          border:      "#e2e8f0",
          borderSubtle:"#f1f5f9",
          indigo:      "#4338ca",
          indigoHover: "#3730a3",
          indigoLight: "#eef2ff",
          navy:        "#0e2a47",
          blue:        "#1e3a8a",
          chakra:      "#2563eb",
          saffron:     "#d97706",
          green:       "#16a34a",
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"Source Sans 3"', "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        "xs":          "0 1px 2px 0 rgba(0,0,0,0.05)",
        "card":        "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
        "card-hover":  "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        "float":       "0 10px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)",
        "modal":       "0 24px 64px rgba(0,0,0,0.18)",
        "header":      "0 1px 0 0 #E2E8F0",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4,0,0.6,1) infinite",
        "fadeIn":     "fadeIn 0.18s ease-out both",
        "slideUp":    "slideUp 0.22s ease-out both",
        "scaleIn":    "scaleIn 0.15s ease-out both",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0", transform: "translateY(-8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.95)" },     to: { opacity: "1", transform: "scale(1)" } },
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
      },
    },
  },
  plugins: [],
};
