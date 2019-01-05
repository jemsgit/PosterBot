var events = require('./events'),
    constants = require('./constants');

function PosterBot(commonSettings, mediator) {
    if(!commonSettings || !mediator){
        throw new Error('No settings or db was provided!');
    }

    this.mediator = mediator;

    if (commonSettings.publicsList) {
        this.publicsList = commonSettings.publicsList;
        console.log(this.publicsList);
    }
    if (commonSettings.channelsList) {
        this.channelsList = commonSettings.channelsList;
        console.log(this.channelsList);
    }
    if (commonSettings.stealerSettings) {
        this.stealerSettings = commonSettings.stealerSettings;
    }
    this.mediator.listJobsCount();
}

PosterBot.prototype.forcePost = async function(params){
    var channelId = params.channelId.trim();
    var settings = this.channelsList[channelId];
    if(!settings){
        return false;
    }
    var postFnc = await this.mediator.getPostFunction(channelId, settings);
    postFnc && postFnc();
    return true;
}

PosterBot.prototype.startBot = function() {
    if (this.publicsList) {
        console.log(this.publicsList);
        this.mediator.setPostTimer(constants.vk, this.publicsList);
    }
    if (this.channelsList) {
        console.log(this.channelsList)
        this.mediator.setPostTimer(constants.telegram, this.channelsList);
    }
    if (this.stealerSettings) {
        for (prop in this.stealerSettings) {
            this.mediator.setContentStealerTimer(this.stealerSettings[prop]);
        }
    }
    this.mediator.listJobsCount();
}

PosterBot.prototype.stopBot = function() {
    this.mediator.cancelScheduledJobs()
}

module.exports = PosterBot;
