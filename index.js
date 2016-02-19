var request=require('superagent');

var url = 'http://www.bd-film.com/zx/21627.htm';
request
    .get(url)
    .end(function(err, res){
        console.log(res.text);
    });