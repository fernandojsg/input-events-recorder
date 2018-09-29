import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import cleanup from 'rollup-plugin-cleanup';
import babel from 'rollup-plugin-babel';

export default {
  input: 'src/index.js',
  output: {
    file: './build/input-events-recorder.js',
    format: 'umd',
    name: 'InputEventsRecorder'
  },
  plugins: [
    babel({
      include: [
        'src/**'
      ]
    }),
    resolve(),
    commonjs(),
    cleanup({
      comments: 'none',
    }),
  ],
};