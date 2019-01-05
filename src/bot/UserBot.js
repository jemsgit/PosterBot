var request = require('request'),
    requestPromise = require('request-promise');
    events = require('./events'),
    constants = require('./constants'),
    voteService = require('./voteService');

var mainActionButtons = [[{title: 'Remove Last Post'}, {title: 'Force Post'}, {title: 'View Content'}, {title: 'Pause-Resume'}],
    [{title: 'Get Post Schedule'}, {title: 'Get Custom Schedule'}, {title: 'Delete Custom Post'}],
    [{title: 'Add Post'}, {title: 'Delete Content'}, {title: 'Fake Vote'}]],
    cancelButton = {title: 'X Cancel'},
    viewButton = {title: 'Preview post'},
    postOptions = [ [{title: 'Post formatting: ' + constants.markdownParseMode, value: 'format' }],
      [{title: 'Add Reactions',value: 'reaction' }],
      [{title: 'Add URL-button', value: 'url' }] ]
    nextButton = {title: 'Next'},
    newPost = null,
    viewContentParams = null,
    cancelCustomJob = null,
    deleteContentParams = null;


function UserBot(settings, mediator) {
    if (settings && settings.token) {
        this.token = settings.token;
        this.time = 1500;
        this.host = "https://api.telegram.org/bot" + this.token + "/";
        this.adminId = settings.adminId;
        this.admin_chat_id = settings.adminChatId ;
        this.mediator = mediator;
        this.lastRequest = null;
        this.abort = false;
        this.setHandlers();
        this.updateUserVotes();
    }

}

UserBot.prototype.updateId = 0;

UserBot.prototype.abort = false;

UserBot.prototype.lastRequest = null;

UserBot.prototype.timer = null;

UserBot.prototype.newPost = null;

UserBot.prototype.admin_chat_id = null;

UserBot.prototype.interceptorHandler = null;

UserBot.prototype.notifyTelegramAdmin = function(message){
    var result = this.mediator.telegramBotReply(this.host, this.admin_chat_id, message);
}

UserBot.prototype.updateUserVotes = function(){
    var votes = this.mediator.getUserVotes();
    voteService.setVotes(votes);
}

UserBot.prototype.startBot = function() {
  if (this.lastRequest) {
    return this.stopBot().then(() => {
      return this.polling();
    });
  }
  return this.polling();
}

UserBot.prototype.stopBot = function(){
    if (!this.lastRequest) {
      return Promise.resolve();
    }
    const lastRequest = this.lastRequest;
    this.lastRequest = null;
    clearTimeout(this.timer);
    this.abort = true;
    return lastRequest.finally(() => {
      this.abort = false;
    });
  }

UserBot.prototype.getUpdates = function() {
    var url = this.host + 'getUpdates' + '?offset=' + this.updateId;
    return requestPromise.get(url);
}

UserBot.prototype.polling = function() {

    this.lastRequest = this
        .getUpdates()
        .then(updates => {
          updates = JSON.parse(updates).result
          updates.forEach(update => {
            this.updateId = update.update_id + 1;
            try {
              this.processResponse(update);
            } catch (err) {
              err._processing = true;
              throw err;
            }
          });
          return null;
        })
        .catch(err => {
          if (!err._processing) {
            console.log('telegram connection error');
            return;
          }
          delete err._processing;
        })
        .finally(() => {
          if (!this.abort) {
            this.timer = setTimeout(() => this.polling(), this.time);
          }
        });
    return this.lastRequest;
  }

UserBot.prototype.processCancelButton = function(param, host, chat_id){
  if(param === cancelButton.title){
    var reply = this.mediator.telegramBotReply(host, chat_id, 'Canceled');
    reply.then(() => {this.setToInitial(host, chat_id);})
    return true;
  } return false;
}

UserBot.prototype.setInterceptor = function(result, success, failure){
  if(result && result.then){
      result.then(() => {
        this.interceptorHandler = success;
       })
  } else {
      this.interceptorHandler = failure;
  }
}

UserBot.prototype.handlers = null;

UserBot.prototype.setHandlers = function(){
    var that = this;

    this.handlers = {
        start: function(host, chat_id){
            that.mediator.telegramBotReply(host, chat_id, 'Select action', mainActionButtons);
        },
        test: function(host, chat_id, text) {
            text = chat_id || '123';
            that.mediator.telegramBotReply(host, chat_id, text);
        },
        removelast: function(host, chat_id, channelId) {
            var result;
            if(that.processCancelButton(channelId, host, chat_id)){
              return;
            }
            try{
              result = that.mediator.removeLastPost({
                  channelId: channelId,
                  type: constants.telegram
              });
            } catch(err){
                console.log(err)
            } finally {
                var reply = that.mediator.telegramBotReply(host, chat_id, result ? 'Success' : 'Fail');
                reply.then(function(){that.setToInitial(host, chat_id);})
            }
        },
        forcepost: async function(host, chat_id, channelId) {
            var result;
            if(that.processCancelButton(channelId, host, chat_id)){
              return;
            }
            try{
                result = await that.mediator.forcePost({
                    channelId: channelId
                });
            } catch(err){
                console.log(err);
            } finally{
              var reply = that.mediator.telegramBotReply(host, chat_id, result ? 'Success' : 'Fail');
                reply.then(function(){that.setToInitial(host, chat_id);})
            }
        },
        getchannelstimes: function(host, chat_id, channelId) {
            var result;
            if(that.processCancelButton(channelId, host, chat_id)){
              return;
            }
            try{
              result = that.mediator.getChannelsTimes({
                  channelId: channelId
              });
            } catch(err){
              console.log(err);
            } finally {
              var reply = that.mediator.telegramBotReply(host, chat_id, result ? JSON.stringify(result) : 'Something went wrong');
              reply.then(function(){that.setToInitial(host, chat_id);})
            }
        },
        getcustomtimes: function(host, chat_id, channelId) {
          var result;
          if(that.processCancelButton(channelId, host, chat_id)){
            return;
          }
          try{
            result = that.mediator.getChannelsCustomTimes({
                channelId: channelId
            });
          } catch(err){
            console.log(err);
          } finally {
            var reply = that.mediator.telegramBotReply(host, chat_id, result ? JSON.stringify(result) : 'Something went wrong');
            reply.then(function(){that.setToInitial(host, chat_id);})
          }
        },
        addpost: function(host, chat_id, textParams){
            var params = textParams.trim().split(' ');
            if(params.length > 1){
                that.newPost = {
                    channelId: params[0],
                    time: params[1]
                }
                var buttons = [[{title:'Text'}, {title:'Liks'}, {title:'Media'}]]
                that.mediator.telegramBotReply(host, chat_id, 'Choose post type', buttons);
                that.interceptorHandler = that.getPostType;
            }
        },

        viewcontent: function(host, chat_id, textParams){
            if(textParams){
                var params = textParams.trim().split(' '),
                    channelId = params[0],
                    count = params[1],
                    offset = params[2] || 0;
                    var result = that.mediator.viewContent({
                        channelId: channelId,
                        count: count,
                        offset: offset,
                    });
                    var reply = that.mediator.telegramBotReply(host, chat_id, result);
            }
        },
        deletecontent: function(host, chat_id, textParams){
             if(textParams){
                textParams = textParams.trim();
                var params = textParams.split(/\s+/),
                    channelId = params[0],
                    content = params.slice(1);
                var result = that.mediator.deleteContent({
                    channelId: channelId,
                    content: content
                });
                var reply = that.mediator.telegramBotReply(host, chat_id, result ? 'Success' : 'Fail');
            }
        },
        voteHandler: function(queryId, userId, channelId, channelName, postId, text, data, host) {
            console.log('-Bot Vote params--')
            console.log(userId, channelName, postId, data);
            var result;
            try{
              result = voteService.voteUser(userId, channelName, postId, data);
            } catch(err){
              console.log(err);
            }
            if (result) {
                if(result.message && !result.status){
                  try{
                    that.mediator.answerCallbackQuery(host, queryId, result.message);
                  } catch(err){
                    console.log(err);
                  }

                } else if(result.status){
                        var settings = that.mediator.getChannelSettings('@' + channelName);
                        if(!settings){
                            console.log('No settings for @' + channelName)
                            return;
                        }
                        var keyboard = that.mediator.createReplyKeyboard(settings.keyboard, result.counts);
                        that.mediator.answerCallbackQuery(host, queryId, result.message);
                        that.mediator.editMessageReplyMarkup(host, channelId, postId, JSON.stringify(keyboard));
                    }
                }
        }
    }

    this.replyHandlers = {
        'remove last post': function(host, chat_id) {
            that.setInterceptor(that.replyWithChannels(host, chat_id), that.handlers.removelast, null);
        },
        'force post': function(host, chat_id) {
            that.setInterceptor(that.replyWithChannels(host, chat_id), that.handlers.forcepost, null);
        },
        'get post schedule': function(host, chat_id) {
            that.setInterceptor(that.replyWithChannels(host, chat_id), that.handlers.getchannelstimes, null);
        },
        'get custom schedule': function(host, chat_id) {
            that.setInterceptor(that.replyWithChannels(host, chat_id), that.handlers.getcustomtimes, null);
        },
        'delete custom post': function(host, chat_id) {
            that.setInterceptor(that.replyWithChannels(host, chat_id), that.handlers.setChannelCustomDelete, null);
        },
        setChannelCustomDelete: function(host, chat_id, channelId){
          var result;
          if(that.processCancelButton(channelId, host, chat_id)){
            return;
          }
          cancelCustomJob = {
            channelId: channelId
          };
          try{
            result = that.mediator.getChannelsCustomTimes({
                channelId: channelId
            });
          } catch(err){
              console.log(err)
          }
          var tasks = [];
          if(result){
            result.forEach(function(item, i) {
                tasks.push({tite: item.id + ': ' + item.type});
            });
            console.log(tasks);
            that.setInterceptor(that.mediator.telegramBotReply(host, chat_id, 'Select post', tasks),
              that.replyHandlers.getCustomTaskId,
              null);
          } else {
            var reply = that.mediator.telegramBotReply(host, chat_id, 'Fail', []);
            reply.then(function(){
                cancelCustomJob = null;
                that.setToInitial(host, chat_id);
            })
          }
        },
        getCustomTaskId: function(host, chat_id, taskId){
          var result;
          if(that.processCancelButton(taskId, host, chat_id)){
            return;
          }
          cancelCustomJob.id = taskId;
          console.log(taskId);
          try{
            result = that.mediator.cancelCustomJob(cancelCustomJob);
          } catch(err){
            console.log(err);
          }

          var reply = that.mediator.telegramBotReply(host, chat_id, result ? 'Success' : 'Fail', []);
          reply.then(function(){
              cancelCustomJob = null;
              that.setToInitial(host, chat_id);
          })
        },
        'add post': function(host, chat_id){
            that.setInterceptor(that.replyWithChannels(host, chat_id), that.replyHandlers.setPostChannel, null);
        },

        'view content': function(host, chat_id){
            that.setInterceptor(that.replyWithChannels(host, chat_id), that.replyHandlers.setChannelViewContent, null);
        },
        'delete content': function(host, chat_id){
            that.setInterceptor(that.replyWithChannels(host, chat_id), that.replyHandlers.setChannelDeleteContent, null);

        },
        'fake vote': function(host, chat_id){
            that.setInterceptor(that.replyWithChannels(host, chat_id), that.replyHandlers.setVotePost, null);
        },

        setChannelDeleteContent: function(host, chat_id, channelId){
            if(that.processCancelButton(channelId, host, chat_id)){
              return;
            }
            deleteContentParams = {
                channelId: channelId
            };
            var result = this.mediator.telegramBotReply(host, chat_id, 'Select post content for deleting', [[cancelButton]]);
            
            that.setInterceptor(result,
             that.replyHandlers.deletechannelcontent,
             null);
        },
        deletechannelcontent: function(host, chat_id, textParams){
            if(that.processCancelButton(textParams, host, chat_id)){
                return;
            }
            if(textParams){
                deleteContentParams.content = textParams.trim().split(/\s+/);
                var result = that.mediator.deleteContent(deleteContentParams);
                var reply = that.mediator.telegramBotReply(host, chat_id, result ? 'Success' : 'Fail', []);
                reply.then(function(){
                    deleteContentParams = null;
                    that.setToInitial(host, chat_id);
                })
            } else {
                var reply = that.mediator.telegramBotReply(host, chat_id, 'Error', []);
                reply.then(function(){
                    deleteContentParams = null;
                    that.setToInitial(host, chat_id);
                })
            }
        },
        setChannelViewContent: function(host, chat_id, channelId){
            if(that.processCancelButton(channelId, host, chat_id)){
              return;
            }
            viewContentParams = {
                channelId: channelId
            };
            var result = this.mediator.telegramBotReply(host, chat_id, 'Введите количество данных и начальную позицию', []);
            that.setInterceptor(result,
              that.replyHandlers.viewchannelcontent,
              null);
        },

        viewchannelcontent: function(host, chat_id, textParams){
            if(that.processCancelButton(textParams, host, chat_id)){
              return;
            }
            if(textParams){
                var params = textParams.trim().split(' ');
                    viewContentParams.count = params[0];
                    viewContentParams.offset = params[1] || 0;
                var result = that.mediator.viewContent(viewContentParams);
                var reply = that.mediator.telegramBotReply(host, chat_id, result, []);
                reply.then(function(){
                    viewContentParams = null;
                    that.setToInitial(host, chat_id);
                })
            } else {
                var reply = that.mediator.telegramBotReply(host, chat_id, 'Error', []);
                reply.then(function(){
                    viewContentParams = null;
                    that.setToInitial(host, chat_id);
                })
            }
        },
        setPostChannel: function(host, chat_id, channelId){
            if(that.processCancelButton(channelId, host, chat_id)){
              return;
            }
            newPost = {
              channelId: channelId,
              parse_mode: constants.markdownParseMode,
              reply_markup: []
            };
            var reply = this.mediator.telegramBotReply(host, chat_id, 'Add data', [[cancelButton]]);
            that.setInterceptor(reply, that.replyHandlers.setPostData, null);
        },
        setPostTime: async function(host, chat_id, time){
            if(that.processCancelButton(time, host, chat_id)){
              newPost = null;
              return;
            }
            newPost.time = time;
            var result = await that.mediator.addPost(Object.assign({}, newPost));
            console.log(result);
            var reply = this.mediator.telegramBotReply(host, chat_id, result ? 'Post added' : 'Fail', []);
            reply.then(function(){
                newPost = null;
                if(result){
                  result(chat_id);
                }
                that.setToInitial(host, chat_id);
            });
        },
        setPostData: async function(host, chat_id, text, data){
            var reply,
                result;
            if(data.photo){
                var photo = data.photo[data.photo.length - 1];
                newPost.photo = photo.file_id;
                reply = this.mediator.telegramBotReply(host, chat_id, 'Add data', [[cancelButton, viewButton, nextButton]]);
            } else if(text){
              if(that.processCancelButton(text, host, chat_id)){
                newPost = null;
                return;
              } else if(text === nextButton.title){
                reply = this.mediator.telegramBotReply(host, chat_id, 'Add date and time YYYY MM DD HH MM', [[cancelButton]]);
                that.setInterceptor(reply, that.replyHandlers.setPostTime, function(){
                    newPost = null;
                    that.setToInitial(host, chat_id);
                });
              } else if(text === viewButton.title){
                reply = this.mediator.telegramBotReplyWithPost(host, chat_id, newPost, postOptions);
                that.setInterceptor(reply, that.replyHandlers.setPostOptions, function(){
                    newPost = null;
                    that.setToInitial(host, chat_id);
                });
              } else {
                newPost.message = text;
                reply = this.mediator.telegramBotReply(host, chat_id, 'Add data', [[cancelButton, viewButton, nextButton]]);
              }
            } else {
                reply = this.mediator.telegramBotReply(host, chat_id, 'Fail', []);
                reply.then(function(){
                    newPost = null;
                    that.setToInitial(host, chat_id);
                });
            }

        },
        setPostOptions: async function(host, chat_id, text, data){
            if(that.processCancelButton(text, host, chat_id)){
              newPost = null;
              return;
            }
            if(text === nextButton.title){
              reply = this.mediator.telegramBotReply(host, chat_id, 'Add date and time YYYY MM DD HH MM or Now', [[cancelButton]]);
              that.setInterceptor(reply, that.replyHandlers.setPostTime, null);
            } else if(data){
              try{
                data = JSON.parse(data);
              } catch(err){
                console.log(err);
              }

              if(data.val === postOptions[0][0].value){
                newPost.parse_mode = newPost.parse_mode === constants.htmlParseMode ? constants.markdownParseMode : constants.htmlParseMode;
                postOptions[0][0].title = 'Post formatting: ' + newPost.parse_mode;
                reply = this.mediator.telegramBotReplyWithPost(host, chat_id, newPost, postOptions);
                that.setInterceptor(reply, that.replyHandlers.setPostOptions, null);
              } else if(data.val === postOptions[1][0].value){ //add reaction
                reply = this.mediator.telegramBotReply(host, chat_id, 'Add reaction devided by space', [[cancelButton, viewButton, nextButton]]);
                that.setInterceptor(reply, that.replyHandlers.addNewPostReactions, null);
              } else if(data.val === postOptions[2][0].value){
                reply = this.mediator.telegramBotReply(host, chat_id, 'Add buttons like: \r\n ```title - url link \r\n title2 - url link2```', [[cancelButton, viewButton, nextButton]]);
                that.setInterceptor(reply, that.replyHandlers.addNewPostUrlButtons, null);
              }
            }
        },
        addNewPostReactions: async function(host, chat_id, reactions) {
          if(that.processCancelButton(reactions, host, chat_id)){
            var reply = this.mediator.telegramBotReplyWithPost(host, chat_id, newPost, postOptions);
            that.setInterceptor(reply, that.replyHandlers.setPostOptions, null);
            reutrn;
          }
          if(reactions && reactions.length){
            var buttons = reactions.split(/\s+/g);
            var inline_buttons = buttons.map((item, index)=>{
              return {
                title: item,
                value: index
              }
            })
            newPost.inline_buttons = [inline_buttons];
          }
          var reply = this.mediator.telegramBotReplyWithPost(host, chat_id, newPost, postOptions);
          that.setInterceptor(reply, that.replyHandlers.setPostOptions, null);
        },
        addNewPostUrlButtons: async function(host, chat_id, urls) {
          if(that.processCancelButton(urls, host, chat_id)){
            var reply = this.mediator.telegramBotReplyWithPost(host, chat_id, newPost, [[cancelButton], [nextButton]]);
            that.setInterceptor(reply, that.replyHandlers.setPostOptions, null);
            reutrn;
          }
          if(urls && urls.length){
            var buttons = urls.split(/\r\n+/g);
            var inline_buttons = buttons.map((item)=>{
              var but = item.split(/\s+-\s+/g);
              if(but.length !== 2){
                return undefined;
              }
              return {
                title: but[0],
                url: but[1]
              }
            })
            newPost.url_buttons = [inline_buttons];
          }
          var reply = this.mediator.telegramBotReplyWithPost(host, chat_id, newPost, postOptions);
          that.setInterceptor(reply, that.replyHandlers.setPostOptions, null);
        },
        setVotePost: function(host, chat_id, channelId){
          if(that.processCancelButton(channelId, host, chat_id)){
            return;
          }
            var reply = this.mediator.telegramBotReply(host, chat_id, 'Введите post_id тип_голоса число_голосов', channelsButtons);
            reply.then(function(){
                that.interceptorHandler = function(host, chat_id, textParams){
                    if(!textParams){
                        return;
                    }
                    textParams = textParams.trim().split(' ');
                    if(textParams.length < 3){
                        return;
                    }
                    var result,
                        reply,
                        postId = textParams[0],
                        userId = textParams[1],
                        data = '%',
                        count = textParams[2]
                        //@test_channel 1022 % like
                    try{
                        result = voteService.voteUser(userId, channelId, postId, data, true, count);
                    } catch(err){
                      console.log(err);
                    }
                    reply = that.mediator.telegramBotReply(host, chat_id, result ? 'Success' : 'Fail');
                    reply.then(function(){that.setToInitial(host, chat_id);})
                };
            })
            result = true;
        },
        'pause-resume': function(host, chat_id){
            that.setInterceptor(that.replyWithChannels(host, chat_id), that.replyHandlers.togglePoster, null);
        },
        togglePoster: async function(host, chat_id, channelId){
            if(that.processCancelButton(channelId, host, chat_id)){
              return;
            }
            var result = await that.mediator.togglePoster({
                channelId: channelId,
                type: constants.telegram
            });
            var reply = that.mediator.telegramBotReply(host, chat_id, result ? 'Success ' + result : 'Fail');
            reply.then(function(){
                that.setToInitial(host, chat_id);
            })
        },
        voteHandler: function(queryId, userId, channelId, channelName, postId, text, data, host) {
            var result = voteService.voteUser(userId, channelName, postId, data, false, 1, false);
            if (result) {
                if(result.message && !result.status){
                    that.mediator.answerCallbackQuery(host, queryId, result.message);
                } else if(result.status){
                        var settings = that.mediator.getChannelSettings('@' + channelName);
                        if(!settings){
                            console.log('No settings for @' + channelName)
                            return;
                        }
                        var keyboard = that.mediator.createReplyKeyboard(settings.keyboard, result.counts)
                        that.mediator.answerCallbackQuery(host, queryId, result.message);
                        that.mediator.editMessageReplyMarkup(host, channelId, postId, JSON.stringify(keyboard));
                    }
                }
            }
        }

}


function getShareButtons(text) {
    var buttons = [];
    if (!text) {
        return buttons;
    }
    var items = text.split('!');
    if (items) {
        items.forEach(function(item) {
            var link = item.split(':');
            var button = {
                text: link[0],
                url: 'goo.gl/' + link[1]
            }
            buttons.push(button);
        })
    }
    return buttons;
}

UserBot.prototype.replyWithChannels=function(host, chat_id){
    var channels = this.mediator.getTelegramChannels(),
        result = null;
    if(!channels.length){
        this.mediator.telegramBotReply(host, chat_id, 'У вас нет каналов');
    } else {
        var channelsButtons = [[], []];
        channels.forEach(function(ch){
            channelsButtons[0].push({title: ch})
        });
        channelsButtons[1].push(cancelButton)
        result = this.mediator.telegramBotReply(host, chat_id, 'Выбери канал', channelsButtons);
    }
    return result;
}

UserBot.prototype.setToInitial = function(host, chat_id){
    this.interceptorHandler = null
    this.handlers.start(host, chat_id);
}

UserBot.prototype.getPostType = function(host, data) {
    if(data && data.text){
        var chat_id = data.chat.id;
        data = data.text;
        if(data === 'cancel'){
            this.newPost = null;
            this.interceptorHandler = null;
        } else {
            this.newPost.type = data
            this.mediator.telegramBotReply(host, chat_id, 'Add ur post');
            this.interceptorHandler = this.getPost;
        }
   } else {
        this.newPost = null;
        this.interceptorHandler = null;
   }
}

UserBot.prototype.getPost = function(host, data) {
    var result;
    if(data && data.text){
        console.log(data.text)
        var chat_id = data.chat.id;
        data = data.text
        if(data === 'cancel'){
            this.newPost = null
        } else {
            this.newPost.message = data;
            try{
                result = this.mediator.addPost(this.newPost)
            } catch(err){
              console.log(err);
            }
            this.mediator.telegramBotReply(host, chat_id, result ?'success add post' : 'failure');
        }
    }

    this.newPost = null;
    this.interceptorHandler = null;
}

UserBot.prototype.setShareButtons = function(buttons) {
    var shareBut = ''
    if (buttons && buttons.length) {
        buttons.forEach(function(item, i) {
            var url = item.url.split('goo.gl/');
            shareBut += item.text + ':' + url[1];
            if (i < (buttons.length - 1)) {
                shareBut += '!'
            }
        })
    }
    return shareBut;
}

UserBot.prototype.processResponse = function(data) {
    if (!data) {
        return;
    }
    var host = this.host;
    var lastCommand = data;

    if (lastCommand &&
        lastCommand.message &&
        lastCommand.message.from &&
        lastCommand.message.from.username === this.adminId) {

        if(this.interceptorHandler){
            this.interceptorHandler(host, lastCommand.message.chat.id, lastCommand.message.text, lastCommand.message);
            return;
        }

        var text = lastCommand.message.text ? lastCommand.message.text.trim() : '';
        var chat_id = lastCommand.message.chat.id;
        this.admin_chat_id = chat_id;
        if (text.charAt(0) === '/') {
            text = text.substr(1);
            var commandParams = this.getCommandParams(text);
            var handler = this.getHandlerByCommand(commandParams.command);
            handler(host, chat_id, commandParams.text);
        } else {
            var commandParams = this.getCommandParams(text);
            var handler = this.getHandlerByKeyboardReply(text.toLowerCase());
            handler(host, chat_id, commandParams.text);
        }
    } else if (lastCommand && lastCommand.callback_query) {
        var query = lastCommand.callback_query,
            queryData = JSON.parse(lastCommand.callback_query.data);
        if (query.data &&
            queryData.t) {
            if (queryData.t === 'vote') {
                var userId = query.from.username || query.from.id,
                    postId = query.message.message_id,
                    channelId = query.message.chat.id,
                    channelName = query.message.chat.username,
                    data = queryData.val,
                    text = query.message.text;
                this.replyHandlers.voteHandler(query.id, userId, channelId, channelName, postId, text, data, host);
            } else if(queryData.t === 'bot' && query.from.username === this.adminId){
              if(this.interceptorHandler){
                  this.interceptorHandler(host, query.message.chat.id, query.message.text, query.data);
                  return;
              }
            }
        }
    }
}

UserBot.prototype.getCommandParams = function(text) {
    var commandEnd = text.indexOf(' ');
    var command,
        text;
    if (commandEnd < 0) {
        command = text;
        text = ''
    } else {
        command = text.substr(0, commandEnd - 1);
        text = text.substr(commandEnd);
    }
    return {
        command: command,
        text: text.trim().toLowerCase()
    };
}

UserBot.prototype.getHandlerByCommand = function(command) {
    var handler = this.handlers[command];
    return handler || function() {};
}

UserBot.prototype.getHandlerByKeyboardReply = function(command) {
    var handler = this.replyHandlers[command];
    return handler || function() {};
}


module.exports = UserBot;
