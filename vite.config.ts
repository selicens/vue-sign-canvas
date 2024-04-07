import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), VueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'sign-canvas': fileURLToPath(new URL('./packages', import.meta.url))
    }
  },
  build: {
    lib: {
      entry: 'packages/index.ts'
    },
    rollupOptions: {
      external: ['vue'],
      output: [
        {
          preserveModules: true,
          preserveModulesRoot: 'src',
          format: 'esm',
          entryFileNames: '[name].js',
          dir: 'es'
        },
        {
          preserveModules: true,
          preserveModulesRoot: 'src',
          format: 'cjs',
          entryFileNames: '[name].js',
          dir: 'lib',
          exports: 'named'
        }
      ]
    }
  }
})
