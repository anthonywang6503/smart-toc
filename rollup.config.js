const replace = require('@rollup/plugin-replace')
const { string } = require('rollup-plugin-string')
const { nodeResolve } = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const ts = require('rollup-plugin-typescript2')

module.exports = {
  input: 'src/content/index.ts',
  output: {
    format: 'iife',
    file: 'dist/toc.js',
    name: 'smarttoc',
  },
  plugins: [
    ts(),
    replace({
      preventAssignment: true,
      'process.env.ENV': JSON.stringify(process.env.ENV || ''),
    }),
    nodeResolve({ main: true, browser: true }),
    commonjs(),
    string({ include: '**/*.css' }),
  ],
}
