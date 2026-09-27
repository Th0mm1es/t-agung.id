/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic, theme-aware tokens bound to CSS variables
        fg: {
          DEFAULT: "var(--text)",
          90: "var(--text-90)",
          80: "var(--text-80)",
          70: "var(--text-70)",
          60: "var(--text-60)",
          50: "var(--text-50)",
          40: "var(--text-40)",
          muted: "var(--muted)",
          soft: "var(--soft)",
        },
        panel: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          3: "var(--surface-3)",
        },
        line: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          soft: "var(--accent-soft)",
        },
        highlight: "var(--highlight)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(ellipse at 20% 50%, rgba(42, 169, 166, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(227, 179, 65, 0.08) 0%, transparent 60%)",
        "card-gradient": "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)",
        "button-gradient": "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
        "accent-gradient": "linear-gradient(135deg, #e3b341 0%, #b98a1f 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.5s ease-out forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(42, 169, 166, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(42, 169, 166, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        "card": "var(--shadow-card)",
        "card-hover": "var(--shadow-hover)",
        "glow-brand": "0 0 30px rgba(42, 169, 166, 0.4)",
        "glow-accent": "0 0 20px rgba(227, 179, 65, 0.3)",
        "inner-light": "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
