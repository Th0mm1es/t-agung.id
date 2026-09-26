/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette — earthy, trustworthy, international
        brand: {
          50:  "#f0f9f4",
          100: "#d9f0e4",
          200: "#b4e1ca",
          300: "#7ecaaa",
          400: "#47ac87",
          500: "#28906d",  // Primary brand green
          600: "#1c7359",
          700: "#185c47",
          800: "#154a3b",
          900: "#123c31",
          950: "#09221c",
        },
        accent: {
          50:  "#fff8ec",
          100: "#ffedc8",
          200: "#ffd98c",
          300: "#ffbf4f",
          400: "#ffa528",  // Warm amber accent
          500: "#f98607",
          600: "#dd6402",
          700: "#b74706",
          800: "#93370d",
          900: "#7a2f0e",
          950: "#461508",
        },
        surface: {
          900: "#0e1a16",   // Deepest dark
          800: "#152219",   // Dark surface
          700: "#1c2e22",   // Card background
          600: "#253828",   // Elevated surface
          500: "#2e4432",   // Border / divider
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "hero-gradient": "radial-gradient(ellipse at 20% 50%, rgba(40, 144, 109, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(249, 134, 7, 0.08) 0%, transparent 60%)",
        "card-gradient": "linear-gradient(135deg, rgba(28, 46, 34, 0.9) 0%, rgba(21, 34, 25, 0.95) 100%)",
        "button-gradient": "linear-gradient(135deg, #28906d 0%, #1c7359 100%)",
        "accent-gradient": "linear-gradient(135deg, #ffa528 0%, #f98607 100%)",
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
          "0%, 100%": { boxShadow: "0 0 20px rgba(40, 144, 109, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(40, 144, 109, 0.6)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        "card": "0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 8px 40px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.4)",
        "glow-brand": "0 0 30px rgba(40, 144, 109, 0.4)",
        "glow-accent": "0 0 20px rgba(249, 134, 7, 0.3)",
        "inner-light": "inset 0 1px 0 rgba(255, 255, 255, 0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
