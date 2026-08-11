import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss(), react()],

  resolve: {
    alias: {
      "@framework": path.resolve(
        "D:/YOUR_CUBISM_SDK_PATH/Framework/src"
      ),
    },
  },
});