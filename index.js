var request=require('superagent');

var url = 'https://api.github.com/repos/visionmedia/superagent';
request
    .get(url)
    .end(function(err, res){
        console.log(res.text);
    });