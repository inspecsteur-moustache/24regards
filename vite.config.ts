import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter({ fallback: '404.html' }),
      paths: { base: (process.env.BASE_PATH ?? '') as '' | `/${string}`, relative: false },
    }),
  ],
});
