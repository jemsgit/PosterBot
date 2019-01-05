var constants = require('./constants'),
	_ = require('lodash'),
	fs = require('fs'),
	request = require('request'),
	shuffle = require('lodash.shuffle'),
  jsdom = require('jsdom').jsdom,
	myWindow = jsdom().defaultView,
	jqwery = require('jquery'),
	$ = jqwery(myWindow);

async function makeGetRequest(url){
	var promise = new Promise(function(resolve, reject){
		request.get(url, function(error, res, body){
			if (!error && res.statusCode == 200) {
				resolve(body);
			} else {
				reject(error);
			}
		}, function(err){
			console.log('req error');
			console.log(err);
			reject(error);
		})
	})
	return promise;
}

function getMetaImage(body){
	var body2 = jsdom(body).defaultView,
		$$ = jqwery(body2),
		meta = $$('head meta[property="og:image"]'),
		imageUrl;
	if(meta && meta[0]){
		imageUrl = meta[0].getAttribute('content');
		if(imageUrl){
			return imageUrl;
		} return null;
	} return null;
}

function checkLoadImage(param, link){
	var loadImage;
	switch (param) {
		case true:
			loadImage = true;
			break;
		case 'random':
			var isExcluded = false;
			for(var i=0; i < constants.excludeInstantView.length; i++){
					if(link.indexOf(constants.excludeInstantView[i]) > -1){
							isExcluded = true;
							break;
					}
			}
			loadImage = isExcluded ? false : Math.random() >= 0.5;
			break;
		default:
			loadImage = false;
	}
	return loadImage;
}

function formatMessageTags(messageParts) {
	var message = [],
		tags = [],
		tagsString = '';
	messageParts.forEach(function(word){
		if(word.indexOf('##') === 0){
			tags.push(word.slice(1));
		} else {
			message.push(word);
		}
	});
	tagsString = tags.join(' ');
	return tagsString ? (tagsString + '\n\n' + message.join(' ')) : message.join(' ');
}

module.exports = {
	parsePostString: async function(postData, postType, loadImage){
		var dataList,
			link,
			message,
			result;
		switch(postType){
			case constants.links:
				dataList = postData.split(' ');
				link = dataList.splice(0,1)[0];
				message = formatMessageTags(dataList) + '\n\n' + link
				result = {
					message: message,
				};
				loadImage = checkLoadImage(loadImage, link)
				if(loadImage){
						var body;
						try{
							body = await makeGetRequest(link);
						} catch(e){
							console.log('err')
							console.log(e);
						}
						if(body && result.message.length < constants.maxPhotoTextLength){
								var imageUrl = getMetaImage(body);
								if(imageUrl){
									result = {
										message: message,
										photo: imageUrl
									};
								}
						}
				}
				break;
			default:
				result = {
				    message: postData
        		};
		}
		return result;
	},
	parsePostStringVk: function(postData, postType){
		var dataList,
			link,
			result;
		switch(postType){
			case constants.links:
				dataList = postData.split(' ');
				link = dataList.splice(0,1)[0];
				result = {
					message: dataList.join(' '),
					link: link
				};
				break;
			default:
				result = {
				    message: postData
        };
		}
		return result;
	}
}
