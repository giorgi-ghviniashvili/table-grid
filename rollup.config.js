import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import pkg from './package.json';
const input = ['src/index.js'];
export default [
  {
    // UMD
    input,
    external: ['d3-selection', 'd3-array'], // saying that you requiring d3-array
    plugins: [
      nodeResolve(),
      babel({
        babelHelpers: 'bundled',
      }),
      terser(),
    ],
    output: {
      file: `dist/${pkg.name}.min.js`,
      format: 'umd',
      name: 'd3Table', // this is the name of the global object
      esModule: false,
      exports: 'named',
      sourcemap: true,
      globals: {
        "d3-selection": "d3", // d3-array references to d3,
        "d3-array": "d3"
      }
    },
  },
  // ESM and CJS
  {
    input,
    external: ['d3-selection', 'd3-array'],
    plugins: [nodeResolve()],
    output: [
      {
        dir: 'dist/esm',
        format: 'esm',
        exports: 'named',
        sourcemap: true,
       
      },
      {
        dir: 'dist/cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
      },
    ],
  },
];
