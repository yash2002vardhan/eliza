import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  target: 'node18',
  dts: false,
  splitting: false,
  sourcemap: true,
  minify: false,
  treeshake: true,
  outExtension: () => ({
    js: '.js',
  }),
});
