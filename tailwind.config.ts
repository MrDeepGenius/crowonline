import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crow: {
          black: "#0B0B0B",
          ink: "#0F0F12",
          surface: "#121215",
          elevated: "#17171C",
          border: "#26262E",
          muted: "#8B8B9A",
          text: "#EDEDF2",
          violet: "#6A00FF",
          violetSoft: "#8B3DFF",
          violetDeep: "#3D0099",
          glow: "#B98CFF",
          success: "#37D67A",
          warn: "#FFB020",
          danger: "#FF4D6D",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "crow-radial":
          "radial-gradient(circle at 50% 0%, rgba(106,0,255,0.35) 0%, rgba(106,0,255,0.06) 45%, transparent 70%)",
        "crow-grid":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(106,0,255,0.35), 0 18px 60px -24px rgba(106,0,255,0.65)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 60px -40px rgba(0,0,0,0.9)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.45" },
          "50%": { opacity: "0.9" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.4s ease both",
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "pulse-glow": "pulseGlow 3.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;