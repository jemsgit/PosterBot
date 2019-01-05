var fileManager = require('./fileManager'),
    dataBaseManager = require('./dataBaseManager'),
    events = require('./events');

function DataManager(params){
    if(!params){
        console.error('U should pass params to dataManager. Can\'t initialize');
        return;
    }
    if(params.dbType === 'files'){
        this.db = fileManager;
    }
    if(params.dbType === 'db'){
        console.log('db')
    }
    this.settings = params.settings;
    this.publics = params.publics;
    this.contentStealer = params.contentStealer;
    this.channels = params.channels;
    this.votes = params.votes;
    this.commonSettings = this.getCommonSettings();
}

DataManager.prototype.getCommonSettings = function(){
    var settings = fileManager.getSettings(this.settings),
        publics = fileManager.getSettings(this.publics),
        contentStealer = fileManager.getSettings(this.contentStealer),
        channels = fileManager.getSettings(this.channels);

    return {
		    settings: settings,
		    publicsList: publics,
		    stealerSettings: contentStealer,
		    channelsList: channels
    }
}

DataManager.prototype.db = null;

DataManager.prototype.getDataItem = function(path) {
    var item;
    try{
      item = this.db.getDataItem(path);
    } catch (error){
      events.raise('error', {error: error});
      item = undefined;
    } finally {
      return item;
    }
}

DataManager.prototype.getContent = function(params) {
  var currentSettings,
      result;
  try{
    currentSettings = this.commonSettings.channelsList[params.channelId];
    result = this.viewContent(currentSettings.filePath, params.count, params.offset);
  } catch (error){
    events.raise('error', {error: error});
    result = undefined;
  } finally {
    return result;
  }
}

DataManager.prototype.getVotes = function() {
  var votes;
  try{
    votes = this.db.getVoteResults(this.votes);
  } catch(error){
    events.raise('error', {error: error});
  } finally{
    return votes;
  }
}

DataManager.prototype.vote = function(params) {
  var voteResult;
  try{
    voteResult = this.db.vote(params);
  } catch(error){
    events.raise('error', {error: error});
  } finally{
    return voteResult;
  }
}

DataManager.prototype.deleteContent = function(params) {
  var currentSettings,
      result;
  try{
    currentSettings = this.commonSettings.channelsList[params.channelId];
    result = this.deleteContentItems(currentSettings.filePath, params.content);
  } catch (error){
    events.raise('error', {error: error});
    result = undefined;
  } finally {
    return result;
  }
}

DataManager.prototype.viewContent = function(filePath, count, offset) {
  var content;
  try{
    content = this.db.viewContent(filePath, count, offset);
  } catch(error){
    events.raise('error', {error: error});
  } finally{
    return content;
  }
}

DataManager.prototype.deleteContentItems = function(filePath, content) {
  var deleteResult;
  try{
    deleteResult = this.db.deleteContentItems(filePath, content);
  } catch(error){
    events.raise('error', {error: error});
  } finally{
    return deleteResult;
  }
}

DataManager.prototype.getOldContentTitles = function(path) {
  var oldTitles;
  try{
    oldTitles = this.db.getOldTitles(path);
  } catch(error){
    events.raise('error', {error: error});
  } finally{
    return oldTitles;
  }
}

DataManager.prototype.addNewArrayData = function(content, path) {
  var addDataResult;
  try{
    addDataResult = this.db.addNewArrayData(content, path);
  } catch(error){
    events.raise('error', {error: error});
  } finally{
    return addDataResult;
  }
}

module.exports = DataManager;
