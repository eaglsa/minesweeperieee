import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        result: resolve(__dirname, 'result.html'),
        leaderboard: resolve(__dirname, 'leaderboard.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});
