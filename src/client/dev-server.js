import express from 'express';
import path from 'path';
const middleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
var history = require('connect-history-api-fallback');

const PORT = 7700;
const PUBLIC_PATH = __dirname + '/public';
const app = express();

const isDevelopment = process.env.NODE_ENV === 'development';
console.log(process.env.NODE_ENV)
if (isDevelopment) {
  const webpack = require('webpack');
  const webpackConfig = require('../../webpack.config.babel').default;
  const compiler = webpack(webpackConfig);
  app.use(history())
  app.use(middleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    hot: true,
    stats: {
      colors: true
    }
  }));

  app.use(hotMiddleware(compiler, {
      log: console.log
  }))

} else {
  app.use(express.static(PUBLIC_PATH));
}
require('./utils/mock/mocks')
require('../proxy')

app.get("/", function(req, res) {
  res.sendFile(path.resolve(PUBLIC_PATH, 'index.html'));
});

app.get("/*", function(req, res) {
  res.sendFile(path.resolve(PUBLIC_PATH, 'index.html'));
});

app.listen(PORT, function() {
  console.log('Listening on port ' + PORT + '...');
});
