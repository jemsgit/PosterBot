import webpack from 'webpack';
import Config from 'webpack-config';
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

export default new Config().extend('conf/webpack.base.config.js').merge({
  output: {
    filename: 'bundle.min.js'
  },
  plugins: [
    new UglifyJsPlugin({
      uglifyOptions: {
          compress: true,
        },
        sourceMap: true
    })]
});
