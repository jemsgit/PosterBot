import webpack from 'webpack';
import Config from 'webpack-config';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import autoprefixer from 'autoprefixer';
import precss from 'precss';

export default new Config().merge({
  entry: './src/client/index.js',
  output: {
    path: __dirname + '/../src/client/public',
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  module: {
    rules: [
    {
      test: /.jsx?$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ["es2015", "react"]
        }
      }
    }
  ]
 },
 plugins: [
    new HtmlWebpackPlugin({
      template: './src/client/index.html',
      inject: "body"
    }),
    new webpack.LoaderOptionsPlugin({ options: { postcss: [precss, autoprefixer] } })
  ]
})
