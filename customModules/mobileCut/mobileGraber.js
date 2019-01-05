var _ = require('lodash'),
    request = require('request');
	shuffle = require('lodash.shuffle'),
    jsdom = require('jsdom').jsdom,
	myWindow = jsdom().defaultView,
	$ = require('jquery')(myWindow);

var link = {
			"host": "https://habrahabr.ru/search/",
			"target_type": "posts",
			"q": "Дайджест интересных материалов для мобильного разработчика",
			"order_by": "date",
			"targetSelector" : ".post__body_full li a",
			"lastElement" : "none",
			"saveLastPoint" : "Предыдущий дайджест"
	},
    mediator = null,
    settings = null;


function getTitleLinks(){
    return new Promise(function(resolve,reject){
            var host = link.host;
            var requestParams = JSON.parse(JSON.stringify(link));
            delete requestParams.host;
            request({url:host, qs:requestParams}, function(err, response, body) {
                resolve(body)
            })
    })
}

function getNewContent(linksArray){
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

function shuffleArray(data){
	return shuffle(data);
}

function parseTitles(body, titles, q){
		var items = $(body).find('.post__title_link');
		items = _.map(items,function(el){
			el = $(el);
			if(el.text().indexOf(q) > -1 ){
				return $(el).attr('href');
			} else {
				return null;
			}
		});
		items = _.filter(items, function(el){return el !== null});
		var newPosts = _.difference(items,titles);
		return newPosts;
}

function parseNewContent(body, targetSelector, lastElement, saveLastPointText){
		var $body = $(body),
			items = $body.find(":not(iframe)").contents().filter(function() {
				return this.nodeType == 3 && this.wholeText.indexOf("•") > -1 ;
			}),
			arr = [],
			resultArr = [];

		items.each(function(index, item){
			var result = {};
			result.text = ''
			var next = item.nextSibling
			var i = 0;
			while((next && next.nodeName !== 'BR') && i < 7){ //i is for safety
				if(next.nodeName === "A"){
					result.link = next.href;
					result.text += ' ' + next.textContent;
				} else if(next.nodeName === '#text'){
					result.text += ' ' + next.textContent;
				}
				next = next.nextSibling;
				i++;
			}
			result.text = result.text.trim();
			arr.push(result);
		})


        for (var i = 0; i < arr.length; i++) {
            resultArr.push(arr[i].link + ' ' + arr[i].text)
        }
        resultArr = shuffleArray(resultArr);
        console.log('Get New Content --- ', resultArr.length);

	    return resultArr;
	}


function getContent(settings){
    var request = getTitleLinks();

    request.then(function(data) {
                var oldTitles = mediator.getOldTitles(settings.resultPath);
                var newTitles = parseTitles(data, oldTitles, link.q);
                mediator.addNewArrayData(newTitles, settings.resultPath);

                if (newTitles.length) {
                    var contetnRequest = getNewContent(newTitles);
                    contetnRequest.then(function(data) {
                        var resultData = [];
                        for (var i = 0; i < data.length; i++) {
                            var result = parseNewContent(data[i], settings.link.targetSelector, settings.link.lastElement, settings.link.saveLastPoint);
                            resultData = resultData.concat(result);
                        }
                        if (!Array.isArray(settings.contentPath)) {
                            settings.contentPath = [settings.contentPath];
                        }
                        for (var i = 0; i < settings.contentPath.length; i++) {
                            if (i > 0) {
                                resultData = shuffleArray(resultData);
                            }
                            mediator.addNewArrayData(resultData, settings.contentPath[i])
                        }

                    }, function(error) {
                        console.error(error);
                    })
                }
            }, function(error) {
                console.error(error);
            })
        }

function mobileGraber(params, med){
    if(!params || !med){
        console.log('No params or mediator was provided');
        return {
            getContent: function(){
                return []
            }
        }
    } else {
        mediator = med;
        settings = params;
        return {
            getContent: getContent
        }
    }
}

module.exports = mobileGraber;
