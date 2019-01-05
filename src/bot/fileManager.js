 var fs = require("fs"),
    _ = require('lodash'),
    constants = require('./constants');

function FileManager(){}

FileManager.prototype.readDataFromFile = function(path){
    var content = null;

    try{
        var content = fs.readFileSync(path, 'utf8');
    } catch (error){
        console.error(error);
    }
    return content;
}

 FileManager.prototype.readDataFromJson = function(path){
     var content = this.readDataFromFile(path);
     try{
         content = JSON.parse(content);
     } catch (error){
         console.error(error);
     }
     return content;
 }

 FileManager.prototype.readStringFromFile = function(filePath){
     var result = this.readDataFromFile(filePath);
     console.log('data from db - ', result && result.length)
     if(result){
         var lines = result.split(constants.splitter),
             result = lines.splice(0,1)[0];

         fs.writeFileSync(filePath, lines.join(constants.splitter));
     }

     return result;
 }

 FileManager.prototype.viewContent = function(filePath, count, offset){
     var result = this.readDataFromFile(filePath);
     if(result){
         count = parseInt(count) + parseInt(offset);
         if(count === count){
             var lines = result.split(constants.splitter),
             result = lines.slice(offset,count).join('\n \n');
         }
     }
     return result;
 }

FileManager.prototype.deleteContentItems = function(filePath, contents){
     var result = this.readDataFromFile(filePath);
     if(result && contents.length){
         var lines = result.split(constants.splitter),
            contentArray = [];
         contents.forEach(function(content){
             var currentLine = _.find(lines, function(line) { return line && line.indexOf(content) > -1 });
             if(currentLine){
                 contentArray.push(currentLine);
             }
         })
         if(contentArray.length){
            var prevCount = lines.length;
            var without = _.without.bind(_, lines)
            lines = without.apply(_, contentArray);
            fs.writeFileSync(filePath, lines.join(constants.splitter));
            result = prevCount !== lines.length;
         } else {
            result = false;
         }

     }

     return result;
 }

 FileManager.prototype.getDataItem = function(filePath){
     var data = this.readStringFromFile(filePath);
     return data;
 }

 FileManager.prototype.getOldTitles = function(filePath){
     var result = this.readDataFromFile(filePath),
         lines = [];
     if(result){
         lines = result.split('\n');
     }
     return lines;
 }

 FileManager.prototype.addNewArrayData = function(newData, filePath){
     var result = this.readDataFromFile(filePath);
     if(result){
         var lines = result.split(constants.splitter);
         lines = newData.concat(lines);
         fs.writeFileSync(filePath, lines.join(constants.splitter));
         return true;
     } return false;
 }

 FileManager.prototype.getVoteResults = function(path){
     var content = this.readDataFromJson(path);
     content = content || {};
     return content;
 }

FileManager.prototype.getSettings = function(path){
     var content = this.readDataFromJson(path);
     return content;
 }

 FileManager.prototype.vote = function(params){
     var channel = params.channel_id,
        post = params.post_id,
        result = params.result
     var results = this.getVoteResults('./channels/votes.json');
     results[channel] = results[channel] || {};
     results[channel][post] = result;


     fs.writeFileSync('./channels/votes.json', JSON.stringify(results), 'utf8');
 }

var fileManager = new FileManager();

module.exports = fileManager;
