import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    // Sets `host: true` if inside GitHub Codespaces to listen on all addresses,
    // see https://vitejs.dev/config/server-options.html#server-host
    host: !!process.env.CODESPACES,
  },
});
