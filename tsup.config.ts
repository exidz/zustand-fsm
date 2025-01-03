import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/machine.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: "terser",
  treeshake: true,
});