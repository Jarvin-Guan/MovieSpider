var request=require('superagent');
var http = require('http');
var co=require('co');
var Q = require("q");
var EventEmitter=require('events').EventEmitter;
var ee=new EventEmitter();

const MovieModels=new Array();
const port = 8000;
//var mongoose=require('./models/mongodb.js');

function GetHtmlCode(url){
    var dfd = Q.defer();
    request
        .get(url)
        .end(function(e, r) {
            dfd.resolve(r.text);
        });
    return dfd.promise;
}

function MatchModels(isEmitNextModel)
{
    co(function *(){
        var htmltext=yield GetHtmlCode("http://www.bd-film.com");
        var movieModelRex=new RegExp("<li\\s+class=\"divider-vertical\"></li><li\\s*><a\\s+href=\"(htt[^\"]+)","g");
        var matches;

        while (matches = movieModelRex.exec(htmltext)) {
            MovieModels.push(matches[1]);
        }
    }).then(function()
    {
        if(isEmitNextModel)
        {
            ee.emit('NextModel');
        }
    })}



ee.on('NextModel', function() {
    var modelLink=MovieModels.shift();
    co(function *() {
        var htmltext=yield GetHtmlCode(modelLink);
        ee.emit('MovieMaches', htmltext);
    });
});

ee.on('MovieMaches', function(modelHtml) {
    var movieLinklRex=new RegExp("<td>\\s+<i\\s+class=\"icon-th[\\s\\S]+?<a\\s+href=\"([^\"]+)\"\\s+ti","g");
    var matches,linkList=new Array();

    while (matches = movieLinklRex.exec(modelHtml)) {
        linkList.push(matches[1]);
    }
    ee.emit('MovieWrite', linkList);
});

ee.on('MovieWrite', function(moviesLink) {
    co(function *(){
        for(var index in moviesLink) {
            var modelDetailHtml = yield GetHtmlCode(moviesLink[index]);
            var isMovieRegex=/简介/;
            if(!isMovieRegex.test(modelDetailHtml))
            {
                continue;
            }
            var movie = new Object();
            movie.title = /<!-- 标题 --><h3>([^《]+《([^》]+)》[^<]+)[\s\S]+?/gi.exec(modelDetailHtml)[1];
            movie.name = /<!-- 标题 --><h3>([^《]+《([^》]+)》[^<]+)[\s\S]+?/gi.exec(modelDetailHtml)[2];
            movie.director = /(?:导\s*演:?([^<]+)<|$)/gi.exec(modelDetailHtml)[1];
            movie.actor = /(?:主\s*演:?([^<]+)<|$)/gi.exec(modelDetailHtml)[1];
            movie.region = /(?:制片国家\/地区:?(?:(?![\u4e00-\u9fa5])[\s\S])+([\u4e00-\u9fa5]+)|$)/gi.exec(modelDetailHtml)[1];
            movie.language = /(?:语\s*言:?(?:(?![\u4e00-\u9fa5])[\s\S])+([\u4e00-\u9fa5]+)|$)/gi.exec(modelDetailHtml)[1];
            movie.showtime = /(?:(?:上映日期:|首播:)\s*(\d*-?\d*-?\d*)|$)/gi.exec(modelDetailHtml)[1];
            movie.duringtime = /(?:[\s\S]长:([^<]+)[\s\S]+?|$)/gi.exec(modelDetailHtml)[1];
            movie.summary = /(?:剧情简介[\s\S]+?([\u4e00-\u9fa5][^<]+)|$)/gi.exec(modelDetailHtml)[1];

            var picRex = /"filmpic\d+"(?:(?!\ssrc)[\s\S])+\ssrc="([^"]+)"/gi;
            movie.pictures = new Array();
            var i = 0;
            while (true) {
                var moviePictures = picRex.exec(modelDetailHtml);
                if (moviePictures == null) {
                    break;
                }
                movie.pictures[i] = moviePictures[1];
                i++;
            }
            console.log(movie.name);
        }
        ee.emit('NextModel');
    })


});

http.createServer((req, res) => {
    if(req.url=='/favicon.ico')
{
    return;
}
MatchModels(true);
res.end(JSON.stringify("ok"));
}).listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

function onerror(err) {
    console.error(err.stack);
};