module.exports = function(app) {
  var content = require('../controllers/contentController');

  app.route('/api/content/:channelId')
    .get(content.getChannelContent)
    .put(content.updateChannelContent);

  app.route('/api/content/pending/:channelId')
    .get(content.getChannelPendingContent)
    .put(content.updateChannelPendingContent);
};
