var inherit = require('./inherit'),
    request = require('request'),
    constants = require('./constants'),
    GoogleURL = require('google-url'),
    BaseRequestManager = require('./BaseRequestManager');


function TelegramRequestManager(settings) {
    this.token = settings.token;
    this.disable_web_page_preview = 'false';
    this.host = "https://api.telegram.org/bot" + this.token + "/";
    this.headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.30 (KHTML, like Gecko) Ubuntu/11.04 Chromium/12.0.742.112 Chrome/12.0.742.112 Safari/534.30"
    }
    this.googleUrl = new GoogleURL({
        key: settings.googleApiKey
    });
}

inherit(BaseRequestManager, TelegramRequestManager)

TelegramRequestManager.prototype.botReply = function(host, chat_id, message, keyboardButtons, isInline) {
    var form = {
        chat_id: chat_id,
        text: message
    };
    if(keyboardButtons){
        form.reply_markup = isInline
        ? JSON.stringify(this.createReplyKeyboard(keyboardButtons))
        : JSON.stringify(this.createChatKeyboard(keyboardButtons));
    }
    var promise = new Promise((resolve, reject) => {
        request.post({
            url: host + 'sendMessage',
            form: form
        },
        function(err, response, body) {
            resolve();
        },
        function(err) {
            reject(err);
        })
    });

    promise.catch((err)=> {
        console.log(err);
    })

    return promise;
}

TelegramRequestManager.prototype.botReplyWithPost = function(host, chat_id, post, postOptionsButtons, keyboardButtons) {
    var form = {
        ...post,
        text: post.message,
        chat_id: chat_id,
      }
    var reply_markup = [];
    if(post.inline_buttons){
      reply_markup = reply_markup.concat(this.createReplyKeyboard(post.inline_buttons).inline_keyboard)
    }
    if(post.url_buttons){
      reply_markup = reply_markup.concat(this.createUrlButtonsKeyboard(post.url_buttons).inline_keyboard)
    }
    if(postOptionsButtons){
      reply_markup = reply_markup.concat(this.createBotReplyKeyboard(postOptionsButtons).inline_keyboard)
    }
    if(reply_markup[0]){
      form.reply_markup = JSON.stringify({inline_keyboard:reply_markup});
    }
    var promise = new Promise((resolve, reject) => {
        request.post({
            url: host + 'sendMessage',
            form: form
        },
        function(err, response, body) {
            console.log(body);
            resolve();
        },
        function(err) {
            console.log(err);
            reject(err);
        })
    });

    promise.catch((err)=> {
        console.log(err);
    })

    return promise;
}

TelegramRequestManager.prototype.updateMessage = function(prop) {
    var url = this.host + 'editMessageText';

    request.post({
        url: url,
        form: prop
    }, function(err, response, body) {});
}

TelegramRequestManager.prototype.answerCallbackQuery = function(host, queryId, message) {
     request.post({
          url: host + 'answerCallbackQuery',
          form:{
               callback_query_id: queryId,
               text: message
         }
       }, ()=>{}, (err)=> {console.log(err)});
}

TelegramRequestManager.prototype.editMessageReplyMarkup = function(host, channelId, postId, keyboard) {
    if(!keyboard){
        return;
    }
    request.post({
          url: host + 'editMessageReplyMarkup',
          form: {
            chat_id: channelId,
            message_id: postId,
            reply_markup: keyboard
        }
    },
    function(err, response, body) {
    })
}

TelegramRequestManager.prototype.postData = function(channel_id, data, type, keyboardButtons, urlButtons) {
    var that = this,
        data = Object.assign({}, data),
        message = data.message || '',
        sendNext = false,
        method = "sendMessage",
        propertiesObject = {
            chat_id: channel_id,
            disable_web_page_preview: this.disable_web_page_preview,
            disable_notification: this.isWeekend()
        };
    console.log(data);
    if(data.photo){
        method = 'sendPhoto';
        propertiesObject.photo = data.photo;
        if(message && message.length > constants.maxPhotoTextLength){
            sendNext = true;
        } else {
            propertiesObject.caption = message;
        }
    } else {
        propertiesObject.text = message;
    }

    var url = this.host + method;
    if(!sendNext){
        var reply_markup = [];
        if(urlButtons){
          reply_markup = reply_markup.concat(this.createUrlButtonsKeyboard(urlButtons).inline_keyboard)
        }
        if(keyboardButtons){
          reply_markup = reply_markup.concat(this.createReplyKeyboard(keyboardButtons).inline_keyboard)
        }
        if(reply_markup[0]){
          propertiesObject.reply_markup = JSON.stringify({inline_keyboard:reply_markup});
        }
    }
    request.post({
        url: url,
        form: propertiesObject
    },
    function(err, response, body) {
        var date = new Date()
        console.log(message + ' ' + date);
        delete data.photo;
        sendNext ? that.postData(channel_id, data, type, keyboardButtons) : null;
    })

}

TelegramRequestManager.prototype.createChatKeyboard = function(keyboardButtons){
    var processFn = function(item, i, arr){
        var button = {
            text: item.title || '',
        };
        return button;
    };
    return this.createKeyboard(keyboardButtons, processFn);
}

TelegramRequestManager.prototype.createBotReplyKeyboard = function(keyboardButtons){
  var processFn = function(item, i, arr){
      var but = {
          val: item.value,
          t: 'bot'
      };
      var button = {
          text: item.title,
          callback_data: JSON.stringify(but)
      };
      return button;
  };
  return this.createKeyboard(keyboardButtons, processFn, true);
}

TelegramRequestManager.prototype.createReplyKeyboard = function(keyboardButtons, updateParams){
    var processFn = function(item, i, arr){
        var but = {
            val: item.value,
            t: 'vote'
        };
        var count = updateParams ? updateParams[item.value] || 0 : 0;
        var button = {
            text: item.title + " " + count,
            callback_data: JSON.stringify(but)
        };
        return button;
    };
    return this.createKeyboard(keyboardButtons, processFn, true);
}

TelegramRequestManager.prototype.createUrlButtonsKeyboard = function(keyboardButtons){
    var processFn = function(item, i, arr){
        var button = {
            text: item.title,
            url: item.url
        };
        return button;
    };
    return this.createKeyboard(keyboardButtons, processFn, true);
}

TelegramRequestManager.prototype.createKeyboard = function(keyboardButtons, processFn, isInline){
    if(keyboardButtons && keyboardButtons.length){
        var keyboards = [];
        keyboardButtons.forEach(function(el){
            var keyboard = el.map(processFn);
            keyboards.push(keyboard);
        })

        var reply_markup = isInline ? {
            inline_keyboard: keyboards
        } : {
            keyboard: keyboards,
            resize_keyboard: true,
            one_time_keyboard: true
        }
        return reply_markup;
    } return {
        remove_keyboard: true
    };
}

function setShareButtons(buttons) {
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

module.exports = TelegramRequestManager;
