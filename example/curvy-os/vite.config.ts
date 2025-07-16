import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  return {
    build: {
      target: "ES2022",
    },
  };
});
