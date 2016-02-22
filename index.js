var request=require('superagent');
var http = require('http');
var mongoose=require('models/mongodb.js');

const port = 8000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text' ,'Accept-Charset': 'utf-8'});
var url = 'http://www.bd-film.com/zx/21642.htm';

request
    .get(url)
    .end(function(e, r){
        var detialRex = /<!-- 标题 --><h3>([^《]+《([^》]+)》[^<]+)[\s\S]+?导演:([^<]+)[\s\S]+?[\s\S]+?主演:([^<]+)[\s\S]+?[\s\S]+?制片国家\/地区:[^>]+>([^<]+)[\s\S]+?语言:([^<]+)[\s\S]+?[\s\S]+?上映日期:\s*(\d+-\d+-\d+)[\s\S]+?片长:([^<]+)[\s\S]+?剧情简介[\s\S]+?([\u4e00-\u9fa5][^<]+)/;
        var movieItems=detialRex.exec(r.text);
        var movie=new Object();
        movie.title=movieItems[1];
        movie.name=movieItems[2];
        movie.director=movieItems[3];
        movie.actor=movieItems[4];
        movie.region=movieItems[5];
        movie.language=movieItems[6];
        movie.showtime=movieItems[7];
        movie.duringtime=movieItems[8];
        movie.summary=movieItems[9];
        var picRex = /"filmpic\d+"(?:(?!\ssrc)[\s\S])+\ssrc="([^"]+)"/gi;
        movie.pictures=new Array();
        var i=0;
        while(true)
        {
            var moviePictures=picRex.exec(r.text);
            if(moviePictures==null)
            {
                break;
            }
            movie.pictures[i]=moviePictures[1];
            i++;
        }
        var MoviePost = new Schema({
            title     : String,
            body      : String,
            date      : Date
        });

        res.end(JSON.stringify(movie));
    })

}).listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});