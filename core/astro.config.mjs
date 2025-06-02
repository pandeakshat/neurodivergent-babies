// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react'; // Keep this if you're using React components
import tailwindcss from '@tailwindcss/vite'; // Import the Tailwind v4 Vite plugin

// https://astro.build/config
export default defineConfig({
  integrations: [
    react() // Keep other Astro integrations here if you have them
  ],
  vite: {
    plugins: [
      tailwindcss() // Integrate Tailwind CSS v4 as a Vite plugin
    ]
  }
});