var request = require('request');

function BaseRequestManager(settings){

}

BaseRequestManager.prototype.getNewContent = function(linksArray){
    var dataList = []
    for(var i = 0; i < linksArray.length; i++){
        var item = new Promise(function(resolve,reject){
            request(linksArray[i], function(err, response, body) {
                resolve(body)
            })
        })
        dataList.push(item);
    };
    return Promise.all(dataList);

}

BaseRequestManager.prototype.getTitleLinks = function(requestParams){
    return new Promise(function(resolve,reject){
        if(!requestParams){
            reject();
        } else {
            var host = requestParams.host;
            delete requestParams.host;
            request({url:host, qs:requestParams}, function(err, response, body) {
                resolve(body)
            })
        }
    });
}

BaseRequestManager.prototype.isWeekend = function(){
    var date = new Date();
    var day = date.getDay();
    return day === 0 || day === 6;
}

BaseRequestManager.prototype.token = null;

BaseRequestManager.prototype.host = null;

module.exports = BaseRequestManager;
