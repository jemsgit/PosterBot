var fileManager = require('./fileManager'),
    events = require('./events');

var service = {}
var posts = {};

function getChannelPostResults(channel_id, post_id) {
    var channelVotes = posts[channel_id],
        currentPosts;
    if (!channelVotes) {
        channelVotes = {};
        posts[channel_id] = channelVotes;
        channelVotes[post_id] = {};
    }
    currentPosts = channelVotes[post_id];
    if (!currentPosts) {
        currentPosts = {};
        channelVotes[post_id] = currentPosts;
    }
    return currentPosts;
}

function deleteVoiceFromOtherGroup(votes, user_Id) {
    var results,
        index;
    for (var key in votes) {
        results = votes[key];
        if (results) {
            index = results.indexOf(user_Id);
            if (index > -1) {
                results.splice(index, 1);
                break;
            }
        }
    }
}

function addUserVoice(voices, user_Id) {
    voices.push(user_Id);
}

function getVotesCounts(votes) {
    var results = {}
    for (var key in votes) {
        results[key] = votes[key].length;
    }
    return results;
}

function voteUser(user_Id, channel_id, post_id, voice, isFake, count, notUniq) {
    var votes = getChannelPostResults(channel_id, post_id),
        voices = votes[voice],
        message,
        counts,
        result;

    if (!voices) {
        voices = []
        votes[voice] = voices;
    }
    if(isFake){
        if(count){
            for(var i = 0; i < count; i++){
                addUserVoice(voices, user_Id);
            }
        } else {
            addUserVoice(voices, user_Id);
        }
        events.raise('vote', {channel_id: channel_id, post_id: post_id, result: votes})
        return true;
    }
    if (!notUniq && voices.indexOf(user_Id) > -1) {
        message = 'Вы уже голосовали';
        counts = getVotesCounts(votes)
        result = false;
    } else {
        !notUniq && deleteVoiceFromOtherGroup(votes, user_Id);
        addUserVoice(voices, user_Id);
        events.raise('vote', {channel_id: channel_id, post_id: post_id, result: votes});
        message = 'Ваш голос учтен';
        counts = getVotesCounts(votes);
        result = true;
    }
    return {
        message: message,
        counts: counts,
        status: result
    }
}

function setVotes(votes){
    if(!votes){
        posts = {}
    } else {
        posts = votes
    }
}

service.voteUser = voteUser;
service.setVotes = setVotes;

module.exports = service;
