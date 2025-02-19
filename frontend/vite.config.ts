import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // Si usas React
// import vue from '@vitejs/plugin-vue'; // Si usas Vue
import { nodePolyfills } from "vite-plugin-node-polyfills"; // Para polyfills de Node.js

export default defineConfig({
  plugins: [
    react(), // Si usas React
    // vue(), // Si usas Vue
    nodePolyfills({
      // Para resolver el problema de crypto
      include: ["crypto"],
    }),
  ],
  server: {
    port: 3000, // Puerto de desarrollo
    host: "0.0.0.0", // Aceptar conexiones desde cualquier IP
  },
  build: {
    outDir: "dist", // Carpeta de salida para la compilación
  },
});
