let fs = require('fs'),
    path = require('path'),
    settingsFile = path.resolve(__dirname, '../../../../settings/telegramchannel.json'),
    settingsData = fs.readFileSync(settingsFile, 'utf8');

module.exports = {
    getChannelInfo: function(req, res){

    },
    getChannels: function(req, res){
        var telegramSettings = JSON.parse(settingsData);
        res.json(Object.keys(telegramSettings));
    }
}
