/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        sand: "var(--color-sand)",
        ink: "var(--color-ink)",
        "ink-soft": "var(--color-ink-soft)",
        accent: "var(--color-accent)",
        "accent-2": "var(--color-accent-2)",
        card: "var(--color-card)",
        border: "var(--color-border)"
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Manrope'", "sans-serif"]
      },
      boxShadow: {
        soft: "0 18px 40px -24px rgba(30, 42, 46, 0.35)",
        lift: "0 12px 30px -16px rgba(30, 42, 46, 0.45)"
      }
    }
  },
  plugins: []
};
