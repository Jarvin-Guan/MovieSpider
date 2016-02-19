var http=require('http')
var temp=0;
var server=http.createServer(function(req,res)
{
    res.writeHead(200,{
        'Content-Type':'text/plain'
    })
    if(temp==0)
    {
        temp=Math.random();
    }
    res.end('Head World!jarvin tt '+temp);
})

server.listen(8000,function(){
    console.log('Docker DEMO with node2');
})/**
 * Created by Jarvin-Guan on 16/2/19.
 */
