import Config, { environment } from 'webpack-config';

environment.setAll({
  env: () => process.env.NODE_ENV,
  mode: 'development'
});

export default new Config().extend('conf/webpack.[env].config.js');
