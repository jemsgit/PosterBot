let settingsProvider = require('../../settingsProvider'),
    fs = require('fs'),
    path = require('path');

module.exports = {
    getChannelContent: function(req, res){
      console.log(req.token)
        var contentSettings = settingsProvider.getContentSettings();
        var channelContentParams = contentSettings[req.params.channelId];
        if(channelContentParams){
            console.log(channelContentParams.contentPath[0])
            fs.readFile(channelContentParams.contentPath[0], 'utf8', (err, data) => {
            if (err) throw err;
            res.write(data);
          })
        }
    },
    updateChannelContent: function(req, res){
    },
    getChannelPendingContent: function(req, res){

    },
    updateChannelPendingContent: function(req, res){
    }
}
