var fs = require('fs'),
    constants = require('./constants');

module.exports = {
  getChannelsSettings: function(){
      var data = fs.readFileSync(constants.settingsPath, 'utf8');
      return JSON.parse(data);
  },
  getContentSettings: function(){
      var data = fs.readFileSync(constants.constentSettingsPath, 'utf8');
      return JSON.parse(data);
  }
}
