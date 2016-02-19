var http=require('http')
var server=http.createServer(function(req,res)
{
    res.writeHead(200,{
        'Content-Type':'text/plain'
    })
    res.end('Head World!jarvin tt '+temp);
})

server.listen(8000,function(){
    console.log('Docker DEMO with node1');
})/**
 * Created by Jarvin-Guan on 16/2/19.
 */
