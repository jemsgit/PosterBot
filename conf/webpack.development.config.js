import Config from 'webpack-config';
import webpack from 'webpack';

export default new Config().extend('conf/webpack.base.config.js').merge({
  entry: [
    'babel-polyfill',
    'webpack/hot/dev-server',
    'webpack-hot-middleware/client?reload=true',
    'react-hot-loader/patch',
    __dirname + '/../src/client/index.js'
  ],
  devtool: 'inline-source-map',
  output: {
    filename: 'bundle.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ]
});
