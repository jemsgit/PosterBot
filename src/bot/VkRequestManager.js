var inherit = require('./inherit'),
    request = require('request'),
    BaseRequestManager = require('./BaseRequestManager');


function VkRequestManager (settings){
    this.token = settings.token;
    this.host = "https://api.vk.com/method/wall.post"
    this.postFromGroup = 1;
    this.apiVersion = 3.0
}

inherit(BaseRequestManager, VkRequestManager)

VkRequestManager.prototype.postData = function(post, publicId){
    var propertiesObject = {
        owner_id:'-' + publicId,
        access_token:this.token,
        from_group: this.postFromGroup,
        message: post.message,
        attachment: post.link,
        v: this.apiVersion
      };

    request({url:this.host, qs:propertiesObject}, function(err, response, body) {
        console.log(response.statusCode + ' - ' + post.link)
    })
}

module.exports = VkRequestManager;
