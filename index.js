var request=require('superagent');
var http = require('http');

const port = 8000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text' ,'Accept-Charset': 'utf-8'});
var url = 'http://www.bd-film.com/zx/21642.htm';
request
    .get(url)
    .end(function(e, r){
        var myRe = /<!-- 标题 --><h3>([^《]+《([^》]+)》[^<]+)[\s\S]+?导演:([^<]+)[\s\S]+?[\s\S]+?主演:([^<]+)[\s\S]+?[\s\S]+?制片国家\/地区:[^>]+>([^<]+)[\s\S]+?语言:([^<]+)[\s\S]+?[\s\S]+?上映日期:\s*(\d+-\d+-\d+)[\s\S]+?片长:([^<]+)[\s\S]+?剧情简介[\s\S]+?([\u4e00-\u9fa5][^<]+)/;
        var str = r.text;
        var myArray;
        var result;
        myArray=myRe.exec(str);
        res.end(myArray[1]);
    })

}).listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});