var request=require('superagent');
var http = require('http');
var co=require('co');
var Q = require("q");
var EventEmitter=require('events').EventEmitter;
var ee=new EventEmitter();
var schedule = require("node-schedule");


const MovieModels=new Array();
Currentmodel="";
const port = 8000;
MatchFlaseTime=0;
//容错次数
falsetime=3;
var mongoose=require('./models/mongodb.js');

//定时任务
var rule = new schedule.RecurrenceRule();

rule.minute = 59;

var j = schedule.scheduleJob(rule, function(){

    if(MovieModels.length==0)
    {
        MatchModels(true);
    }
});


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
        var originurl="http://www.bd-film.com/zx/index.htm";
        var htmltext=yield GetHtmlCode(originurl);
        var movieModelRex=new RegExp("<li\\s+class=\"divider-vertical\"></li><li\\s*(?:class=\"active\")?\\s*?><a\\s+href=\"(htt[^\"]+)","g");
        var matches;

        while (matches = movieModelRex.exec(htmltext)) {
            MovieModels.push(matches[1]);
        }
        var index=MovieModels.indexOf(originurl);
        for(i=0;i<index;i++)
        {
            MovieModels.shift();
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
    Currentmodel=modelLink;
    if(Currentmodel!=null)
    {
        co(function *() {
            var htmltext=yield GetHtmlCode(modelLink);
            ee.emit('MovieMaches', htmltext);
        });
    }
    else
    {
        console.log("抓取完成,等待下一轮");
    }
});

ee.on('NextPage', function(PageHtml) {
    var nextpageindex=/(?:<a\s+href="([^"]+)">下一页|$)/.exec(PageHtml)[1];

    if(nextpageindex != "" && nextpageindex != undefined && nextpageindex != null)
    {
        co(function *() {
            var nexturl=/[\s\S]+\//.exec(Currentmodel)[0]+nextpageindex;
            var htmltext=yield GetHtmlCode(nexturl);
            ee.emit('MovieMaches', htmltext);
        });
    }
    else
    {
        ee.emit('NextModel');
    }
});

ee.on('MovieMaches', function(PageHtml) {
    var movieLinklRex=new RegExp("<td>\\s+<i\\s+class=\"icon-th[\\s\\S]+?<a\\s+href=\"([^\"]+)\"\\s+ti","g");
    var matches,linkList=new Array();

    while (matches = movieLinklRex.exec(PageHtml)) {
        linkList.push(matches[1]);
    }
    ee.emit('MovieWrite', linkList,PageHtml);
});

ee.on('MovieWrite', function(moviesLink,modelHtml) {
    co(function *(){
        for(var index in moviesLink) {
            if(MatchFlaseTime>=3)
            {
                break;
            }
            console.log("开始处理:"+moviesLink[index]);
            var modelDetailHtml = yield GetHtmlCode(moviesLink[index]);
            var isMovieRegex=/label\s*label-warning/;
            if(!isMovieRegex.test(modelDetailHtml))
            {
                continue;
            }
            var movie = new Object();
            movie.title = /(?:<!--\s*标题\s*--><h3>([^《\[]*(?:\[|《)([^\]》]+)[^<]+)<\/h3>|$)/.exec(modelDetailHtml)[1];
            movie.name = /(?:<!--\s*标题\s*--><h3>([^《\[]*(?:\[|《)([^\]》]+)[^<]+)<\/h3>|$)/.exec(modelDetailHtml)[2];
            movie.director = /(?:导\s*演:?([^<]+)<|$)/gi.exec(modelDetailHtml)[1];
            movie.actor = /(?:主\s*演:?([^<]+)<|$)/gi.exec(modelDetailHtml)[1];
            movie.region = /(?:制片国家\/地区:?(?:(?![\u4e00-\u9fa5])[\s\S])+([\u4e00-\u9fa5]+)|$)/gi.exec(modelDetailHtml)[1];
            movie.language = /(?:语\s*言:?(?:(?![\u4e00-\u9fa5])[\s\S])+([\u4e00-\u9fa5]+)|$)/gi.exec(modelDetailHtml)[1];
            movie.showtime = /(?:(?:上映日期:|首播:)\s*(\d*-?\d*-?\d*)|$)/gi.exec(modelDetailHtml)[1];
            movie.duringtime = /(?:[\s\S]长:([^<]+)[\s\S]+?|$)/gi.exec(modelDetailHtml)[1];
            movie.summary = /(?:剧情简介[\s\S]+?([\u4e00-\u9fa5][^<]+)|$)/gi.exec(modelDetailHtml)[1];
            movie.downloadlink=/(?:<a\s+class="label\s*label-warning(?:(?!href)[\s\S])+href="((?:ed2k|ftp)[^"]+)|$)/gi.exec(modelDetailHtml)[1];
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
            console.log("在做入库:"+movie.name+".  " +"下载地址:"+movie.downloadlink);
            mongoose.add(movie,function(result,doc){
                if(result==false)
                {
                    MatchFlaseTime=MatchFlaseTime+1;
                }
                else
                {
                    MatchFlaseTime=0;
                }
            });
        }
        if(MatchFlaseTime>=falsetime)
        {
            MatchFlaseTime=0;
            ee.emit('NextModel', modelHtml);
        }
        else
        {
            ee.emit('NextPage', modelHtml);
        }
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