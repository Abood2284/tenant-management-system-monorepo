import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // All theme variables (colors, fonts, animations) are now managed in globals.css via @theme (Tailwind v4+)
  theme: {
    extend: {
      // No custom colors or fonts here; see globals.css
    },
  },
  plugins: [],
};
export default config;
