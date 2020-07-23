import configs from './rollup.config';
import { uglify } from 'rollup-plugin-uglify';
import { deepMerge } from './utlis';
const prod = {
  output: {
    sourcemap: false,
    file: './lib/index.js',
  },
  plugins: [...configs.plugins, uglify()],
};

export default deepMerge(configs, prod);
