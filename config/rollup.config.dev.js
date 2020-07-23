import { deepMerge } from './utlis';
import configs from './rollup.config';

const dev = {
  output: {
    file: '_local/index.js',
    sourcemap: true,
  },
};
export default deepMerge(dev, configs);
