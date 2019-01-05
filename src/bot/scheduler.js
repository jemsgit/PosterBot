var schedule = require('node-schedule'),
    dataParser = require('./dataParser'),
    events = require('./events'),
    constants = require('./constants'),
    path = require('path');

function getContentType(post){
  var type = ''
  if(post.photo){
    type += 'photo &'
  } if(post.message){
    type += 'text &'
  }
  return type;
}

function Scheduler(settings, mediator) {
    if(!mediator){
        throw new Error('No mediator was provided!')
    }

    this.mediator = mediator;
    this.jobs = {};
    this.customJobs = {};
    this.stopedChannels = [];
}

Scheduler.prototype.jobs = null;
Scheduler.prototype.stopedChannels = null;

Scheduler.prototype.parseTimeToCron = function(timeString, periodic) {
    var time = timeString.split(':');
    return '12 ' + time[1] + ' ' + time[0] + ' * * ' + periodic
}



Scheduler.prototype.addPost = async function(params){
    if(!params){
        return;
    }
    var posts = this.customJobs[params.channelId],
        timeParts = params.time.trim().split(' '),
        channelSettings = this.mediator.getChannelSettings(params.channelId),
        time,
        currentTime,
        that = this,
        newData;

    newData = await dataParser.parsePostString(params.message, params.type);
    if(timeParts.length < 5 || !newData){
      return false;
    }
    console.log(params);
    newData.photo = params.photo;
    if(!posts){
        this.customJobs[params.channelId] = {};
        posts = this.customJobs[params.channelId];
    }
    var month = timeParts[1] - 1;
    if(month !== month || month < 0){
        return false;
    }
    time = new Date(timeParts[0], month, timeParts[2], timeParts[3], timeParts[4], 0);
    currentTime = new Date();
    if(time < currentTime || posts[time]){
      return false;
    }
    var task = schedule.scheduleJob(time, function() {
        delete posts[time];
        var request = that.mediator.postTelegramData(params.channelId,
           newData,
           params.type,
           newData.inline_keyboard || channelSettings.keyboard,
           newData.url_buttons || null)
    })
    var preview = function(userChat){
        var request = that.mediator.postTelegramData(userChat, newData, params.type, channelSettings.keyboard);
        return request;
    };
    posts[time] = {
      type: getContentType(newData),
      task: task
    }
    return preview;
}

Scheduler.prototype.cancelCustomJob = function(params){
  if(!params){
    return false;
  }
  var posts = this.customJobs[params.channelId];
  if(posts[params.id] && posts[params.id].task.cancelJob){
      posts[params.id].task.cancelJob.cancelJob();
      delete posts[params.id];
      return true;
  } return false;
}

Scheduler.prototype.setPostTimer = function(type, params){
  try{
    if(type === constants.vk){
        this.setPublicsPostTimer(params);
    } else {
        this.setTelegramPostTimer(params);
    }
  } catch(err){
    console.log(err)
    events.raise('error', {error: err});
  }
}

Scheduler.prototype.setPublicsPostTimer = function(publicsSettings) {
    var that = this;
    for (var publicItem in publicsSettings) {
        var settings = publicsSettings[publicItem];
        this.jobs[settings.publicId] = {}

        for (var i = 0; i < settings.times.length; i++) {
            var time = this.parseTimeToCron(settings.times[i], '0-6');
            console.log('-', settings.times[i])

            var task = schedule.scheduleJob(time, function() {
                var postData = that.mediator.getDataFromDB(settings.filePath),
                    requestData;
                if (postData) {
                    requestData = dataParser.parsePostStringVk(postData, settings.type);
                    if (requestData) {
                        that.mediator.postVkData(requestData, settings.publicId);
                    }
                }

            })
            this.jobs[settings.publicId][settings.times[i]] = task
        }

    }
};

Scheduler.prototype.setContentStealerTimer = function(settings) {
    var that = this;
    if (settings.times && settings.modulePath) {
        var graberModule = require(path.resolve(settings.modulePath))(settings, that.mediator);
        var process = function() {
           try{
             graberModule.getContent();
           } catch(err){
             console.log(err);
             events.raise('error', {error: err});
           }
        }

        var task = schedule.scheduleJob(settings.times, process);
        this.jobs['contentStealer'] = [task];
    }

};

Scheduler.prototype.getPostFunction = function(key, settings) {
    var that = this;
    return async function() {
        var data = that.mediator.getDataFromDB(settings.filePath);
        if (data) {
            var newData = await dataParser.parsePostString(data, settings.type, settings.loadImage);
            var request = that.mediator.postTelegramData(key, newData, settings.type, settings.keyboard)
        }

    }
}

Scheduler.prototype.setTelegramPostTimer = function(channelsList) {
    for (var key in channelsList) {
        console.log(key);
        var settings = channelsList[key],
            times = settings.times;
        this.jobs[key] = {};
        var post = this.getPostFunction(key, settings);
        for (var i = 0; i < times.length; i++) {
            var time = this.parseTimeToCron(settings.times[i], '0-6');
            console.log('---', settings.times[i])
            var task = schedule.scheduleJob(time, post);
            this.jobs[key][settings.times[i]] = task;
        }
    }

};

Scheduler.prototype.toggleChannelPoster = function(params) {
    var result = false;
    if(params && params.type === constants.telegram){
        var tasks = this.jobs[params.channelId],
            channelPausedIndex = this.stopedChannels.indexOf(params.channelId),
            action = channelPausedIndex < 0 ? 'cancel' : 'reschedule',
            key;
            console.log(tasks);
        if(tasks){
          for(key in tasks){
            var task = tasks[key];
            task[action]();
          }
           result = true;
           if(channelPausedIndex < 0){
              this.stopedChannels.push(params.channelId);
              result = 'stop';
           } else {
              this.stopedChannels.splice(channelPausedIndex, 1);
              result = 're-start';
           }
        }
    }
    return result;
}

Scheduler.prototype.removeLastPost = function(params) {
    var result = false;
    if(params && params.type === constants.telegram){
        var tasks = this.jobs[params.channelId],
            keys,
            lastKey,
            task;
        if(tasks){
            keys = Object.keys(tasks);
            lastKey = keys[keys.length - 1];
            task = tasks[lastKey];
            if (task && task.cancelNext) {
                task.cancelNext(true);
                result = true;
            }
        }
    }
    return result;

}

Scheduler.prototype.getChannelsTimes = function(channelId) {
    var tasks = this.jobs[channelId];
    var result = tasks ? Object.keys(tasks) : 'No times for ' + channelId;
    return result;
}

Scheduler.prototype.getChannelsCustomTimes = function(channelId) {
    var tasks = this.customJobs[channelId];
    var result = tasks ? Object.keys(tasks) : 'No times for ' + channelId;
    return result;
}

Scheduler.prototype.listJobsCount = function() {
    var count = 0;
    for (var key in this.jobs) {
        count += Object.keys(this.jobs[key]).length;
    }
    console.log('Tasks count: ', count)
}

Scheduler.prototype.cancelJobs = function() {
    if (this.jobs.length) {
        for (var key in this.jobs) {
            this.jobs[key].forEach(function(item) {
                item.cancelJob();
            })
        }

    }
}

module.exports = Scheduler;
