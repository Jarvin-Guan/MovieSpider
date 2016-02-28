var mongoose = require('mongoose');

// 本地 mongodb链接地址
var mongodbUri = 'mongodb://127.0.0.1:27017/DaoCloudDemo';

try {
    // 链接格式:    mongodb://user:pass@localhost:port/database
    // DaoCloud链接地址
    mongodbUri = 'mongodb://';

    if (process.env.MONGODB_USERNAME) {
        mongodbUri += process.env.MONGODB_USERNAME;

        if (process.env.MONGODB_PASSWORD) {
            mongodbUri += ":" + process.env.MONGODB_PASSWORD
        }
        mongodbUri += "@";
    }

    mongodbUri += (process.env.MONGODB_PORT_27017_TCP_ADDR || 'localhost')
        + ":" + (process.env.MONGODB_PORT_27017_TCP_PORT || 27017)
        + '/' + (process.env.MONGODB_INSTANCE_NAME || 'test');
}
catch (e) {
}

console.log(mongodbUri);

// 链接mongodb
var db = mongoose.connect(mongodbUri);

var movieSchema = new mongoose.Schema({
    name: {type: String},
    "title": {type: String},
    "director": {type: String},
    "actor": {type: String},
    "region": {type: String},
    "language": {type: String},
    "duringtime": {type: String},
    "showtime": {type: String},
    "summary": {type: String},
    "pictures": {type: Array},
    "downloadlink":{type:String}
});

var movieModel = db.model('movie', movieSchema);

// 添加
function add(movie) {
    // 判断是否存在
    searchOne({
        name: movie.name
    }).then(function(data) {
        if (data) {
            console.log('已经存在'+movie.name);
            return false;
        }
        else {
            //  添加一条
            movieModel.create(movie, function(err, doc) {
                return true;
            });
        }
    });
}

// 按条件查找
function searchOne(condition) {
    return movieModel.findOne(condition || {});
}

exports.searchOne = searchOne;
exports.add = add;