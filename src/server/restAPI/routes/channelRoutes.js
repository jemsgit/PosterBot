module.exports = function(app) {
  var channels = require('../controllers/channelController');

  // todoList Routes
  app.route('/api/channels')
    .get(channels.getChannels);


  app.route('/api/channels/:channeId')
    .get(channels.getChannelInfo);
};
