var request=require('superagent');
var http = require('http');

const port = 8000;

http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text' });
var url = 'http://www.bd-film.com/zx/21627.htm';
request
    .get(url)
    .end(function(e, r){
        res.end(r.text);
    })

}).listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});