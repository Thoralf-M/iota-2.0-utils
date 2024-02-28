import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [svelte(), 
    viteStaticCopy({
    targets: [
      {
        src: 'node_modules/@iota/sdk-wasm/web/wasm/iota_sdk_wasm_bg.wasm',
        dest: ''
      }
    ]
  })],
  optimizeDeps: {
    exclude: ['@iota/sdk-wasm']
  }
})
