var request=require('superagent');
var http = require('http');
//var mongoose=require('./models/mongodb.js');


const port = 8000;

http.createServer((req, res) => {

request
    .get('http://www.bd-film.com')
    .end(function(e, r){
        var movieModelRex=new RegExp("<li\\s+class=\"divider-vertical\"></li><li\\s*><a\\s+href=\"(htt[^\"]+)","g");
        var modelidex=0;
        while(true)
        {
            var mvModels=movieModelRex.exec(r.text);
            if(mvModels==null)
            {
                break;
            }
            var modelurl=mvModels[1];
            request
                .get(modelurl)
                .end(function(e, r){
                    var detailList= r.text;
                    var movieLinkRegex=new RegExp("<td>\\s+<i\\s+class=\"icon-th[\\s\\S]+?<a\\s+href=\"([^\"]+)\"\\s+ti","g");
                    var mi=0;
                    while(true)
                    {
                        var movielink=movieLinkRegex.exec(detailList);
                        if(movielink==null)
                        {
                            var nextLinkRegex=new RegExp("<a\\s+href=\"([^\"]+)\">下一页","g");

                            break;
                        }
                        var movieUrl=movielink[1];
                        request
                            .get(movieUrl)
                            .end(function(e, r){
                                var detailList= r.text;

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
                            });
                        mi++;
                    }
                });
            modelidex++;
        }

        /*

        res.end(JSON.stringify(movie));*/
    })

}).listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});