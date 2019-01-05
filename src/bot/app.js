var app,
	dataManager = require('./dataManager'),
	events = require('./events'),
	PosterBot = require('./PosterBot')
	UserBot = require('./UserBot'),
	Scheduler = require('./scheduler'),
    TelegramRequstManager = require('./TelegramRequestManager'),
    VkRequestManager = require('./VkRequestManager');

app = {
	bots: {},

	commonSettings: {},

	requestManagers: {},

	attachEvents: function(){
		var that = this;
		events.on('vote', function(params) {
        	that.db.vote(params)
    	});
		events.on('error', function(params){
			console.log('error');
			console.log(params.error);
			that.notifyTelegramAdmin(params.error);
		})
	},

	init: function(){
		app.db = new dataManager({
			dbType: 'files',
			settings : './settings/settings.json',
			publics: './settings/vkpublic.json',
			contentStealer : './settings/contentStealer.json',
			channels : './settings/telegramchannel.json',
			votes: './channels/votes.json'
		})


		if(!app.db){
			return;
		}

		app.commonSettings = app.db.getCommonSettings();

		if(!app.commonSettings || !app.commonSettings.settings){
			return;
		}

		app.requestManagers.vk = new VkRequestManager(app.commonSettings.settings.vkSettings);
		app.requestManagers.telegram = new TelegramRequstManager(app.commonSettings.settings.telegramSettings);

		app.scheduler = new Scheduler(app.commonSettings.settings, app);
		app.bots.posterBot = new PosterBot(app.commonSettings, app);
		app.bots.posterBot.startBot();

		if(app.commonSettings.settings && app.commonSettings.settings.telegramSettings){
			app.bots.userBot = new UserBot(app.commonSettings.settings.telegramSettings, app)
			app.bots.userBot.startBot();
		}

		app.attachEvents();
	},

	getDataFromDB: function(path){
		var result = app.db.getDataItem(path);
		return result;
	},

	getUserVotes: function(){
		return this.db.getVotes('./channels/votes.json');
	},

	telegramBotReply: function(host, chat_id, message, keyboard){
		return this.requestManagers.telegram.botReply(host, chat_id, message, keyboard);
	},

	telegramBotReplyWithPost: function(host, chat_id, post, keyboard){
		return this.requestManagers.telegram.botReplyWithPost(host, chat_id, post, keyboard);
	},

	telegramBotRemoveKeyboard: function(host, chat_id, message, keyboard){
		return this.requestManagers.telegram.botRemoveKeyboard(host, chat_id);
	},

	notifyTelegramAdmin: function(message){
		this.bots.userBot.notifyTelegramAdmin(message);
	},

	answerCallbackQuery: function(host, query_id, message){
		this.requestManagers.telegram.answerCallbackQuery(host, query_id, message);
	},

	editMessageReplyMarkup: function(host, chat_id, postId, keyboard){
		this.requestManagers.telegram.editMessageReplyMarkup(host, chat_id, postId, keyboard);
	},

	createReplyKeyboard: function(keyboard, updateParams){
		return this.requestManagers.telegram.createReplyKeyboard(keyboard, updateParams);
	},

	telegramBotPosData: function(channelId, data, type){
		this.requestManagers.telegram.postData(channelId, data, type);
	},

	getOldContentTitles: function(path){
		return this.db.getOldContentTitles(path);
	},

	addNewArrayData: function(data,path){
		return this.db.addNewArrayData(data,path);
	},

	postTelegramData: function(channel_id, data, type, keyboard){
		this.requestManagers.telegram.postData(channel_id, data, type, keyboard);
	},

	postVkData: function(post, publicId){
		this.requestManagers.vk.postData(post, publicId);
	},

	getChannelsTimes: function(params){
		return this.scheduler.getChannelsTimes(params.channelId);
	},

	getChannelsCustomTimes: function(params){
		return this.scheduler.getChannelsCustomTimes(params.channelId)
	},

	getTelegramChannels: function(){
		console.log(Object.keys(app.commonSettings.channelsList))
		return Object.keys(app.commonSettings.channelsList);
	},

	getPostFunction: async function(channelId, settings){
		return await this.scheduler.getPostFunction(channelId, settings);
	},

	getChannelSettings: function(channel_id){
		return app.commonSettings.channelsList[channel_id];
	},

	cancelCustomJob:function(params){
		return this.scheduler.cancelCustomJob(params);
	},

	addPost: async function(params){
		return await this.scheduler.addPost(params);
	},

	setPostTimer: function(type, params){
		return this.scheduler.setPostTimer(type, params);
	},

	forcePost: async function(params){
		return await this.bots.posterBot.forcePost(params);
	},

	viewContent: function(params){
		return this.db.getContent(params);
	},

	deleteContent: function(params){
		return this.db.deleteContent(params);
	},

	removeLastPost: function(params){
		return this.scheduler.removeLastPost(params);
	},
	togglePoster: function(params){
		return this.scheduler.toggleChannelPoster(params);
	},
	setContentStealerTimer: function(params){
		this.scheduler.setContentStealerTimer(params);
	},

	listJobsCount: function(){
		this.scheduler.listJobsCount();
	},

	cancelScheduledJobs: function(){
		this.scheduler.cancelJobs();
	}

}

app.init();
