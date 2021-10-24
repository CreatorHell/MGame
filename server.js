const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const fs = require('fs');
const events = require('events');
const dbConfig = require('./DBConfig');
const userSQL = require('./Usersql');
const http = require('http');
const querystring = require("querystring");
const cookieParser = require('cookie-parser')


var router = express.Router();
var app = express();
var url = require('url');

var pool = mysql.createPool(dbConfig.mysql);
console.log("数据库链接池创建成功！");

var responseJSON = function(res, ret) {
	if (typeof ret == 'undefined') {
		res.json({
			code: '-200',
			msg: '操作失败',
		});
	} else {
		res.json(ret);
	}
};

app.use(cookieParser());

app.get('/reg', function(req, res, next) {
	console.log(req.query.username, req.query.password);
	pool.getConnection(function(err, connection) {
		console.log("取得数据库链接！");
		var param = req.query || req.params;
		var UserName = param.username;
		var Password = param.password;
		var _res = res;
		connection.query(userSQL.queryAll, function(err, res) {
			console.log("查询完成！");
			var isTrue = false;
			if (res) {
				for (var i = 0; i < res.length; i++) {
					if (res[i].username == UserName &&
						res[i].password == Password) {
						isTrue = true;
					}
				}
			}
			var data = {};
			data.isreg = !isTrue;
			if (isTrue) {
				data.result = {
					code: 1,
					msg: 'User has already exist.'
				};
			} else {
				connection.query(userSQL.insert, [param.username, param.password], function(err,
					result) {
					if (result) {
						data.result = {
							code: 200,
							msg: 'Register Success'
						};
					} else {
						data.result = {
							code: -1,
							msg: 'Register Failiure'
						};
					}
				});
			}
			if (err) data.err = err;
			setTimeout(function() {
				responseJSON(_res, data)
			}, 300);
			connection.release();
		});
	});
});

app.get('/login', function(req, res, next) {
	pool.getConnection(function(err, connection) {
			var param = req.query || req.params;
			var UserName = param.username;
			var Password = param.password;
			var _res = res;
			connection.query(userSQL.queryAll, function(err, res, result) {
					var isUser = false;
					var data = {};
					if (res) {
						for (var i = 0; i < res.length; i++) {
							if (res[i].username == UserName) {
								isUser = true;
								if (res[i].password == Password) {
									// data.isLogin = true;
									// data.userInfo = {};
									// data.userInfo.username = UserName;
									// data.userInfo.password = Password;
									// data.result = {
									// 	code : 200,
									// 	msg : 'succeed'
									//_res.writeHead(200, {
									//	'Content-Type': 'text/plain',
									//});
									_res.cookie('username',res[i].username,{maxAge:599999});
									_res.redirect('game/gamestart.html');
									_res.end()

								};
							} else {
								// data.isLogin = false;
								// data.userInfo = {};
								// data.userInfo.username = UserName;
								// data.userInfo.password = null;
								// data.result = {
								// 	code : -1,
								// 	msg : 'Password Wrong'
								// };
								// _res.write('<!-- Begin Stream -->\n');
								// fs.createReadStream('login_error.html').pipe(parser).on('end',()=>{
								// 	_res.write('\n<!-- End Stream -->')
								// }).pipe(_res);
							}
						}
					}
					if (!isUser) {
						// data.isLogin = false;
						// data.userInfo = {};
						// data.userInfo.username = null;
						// data.userInfo.password = null;
						// data.result = {
						// 	code : -2,
						// 	msg : 'No User'
						// };
					}
					if (err) data.err = err;
					//responseJSON(_res, data);
	
				
					connection.release();
			});
	});
});

var eventEmitter = new events.EventEmitter();
eventEmitter.on('error', function() {
	console.log("Something was wrong ！");
	return;
})



//var app = express();
var urlencodedParser = bodyParser.urlencoded({
	extended: false
});

app.get('/*', function(req, res) {
	res.sendFile(__dirname + '/' + url.parse(req.url).pathname);
});


app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By", ' 3.2.1')
	//这段仅仅为了方便返回json而已
	res.header("Content-Type", "application/json;charset=utf-8");
	if (req.method == 'OPTIONS') {
		//让options请求快速返回
		res.sendStatus(200);
	} else {
		next();
	}
})




var server = app.listen(8080, function() {
	var host = server.Address
	var port = server.port

	console.log("服务器启动成功！");
});
