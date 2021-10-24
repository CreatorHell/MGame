const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const events = require('events');
const http = require('http');
const querystring = require("querystring");
const cookieParser = require('cookie-parser')
const MongoClient = require('mongodb').MongoClient;

var router = express.Router();
var app = express();
var url = require('url');

var mongoURL = "mongodb://localhost:27017/";
var dbName = 'test';
var clName = 'users';


var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use('/public', express.static('public'));
app.use(cookieParser());

app.get('/reg', function(req, res, next) {
	var Username = req.query.username;
	var Password = req.query.password1;
	console.log(req.query.username, req.query.password1);
	MongoClient.connect(mongoURL, function(err, db) {
		if (err) throw err;
		var dbo = db.db(dbName);
		var usernameStr = {
			'username': Username
		};
		var PasswordStr = {
			'password': Password
		};
		var isHas = false;
		dbo.collection(clName).find(usernameStr).toArray(function(err, result) {
			if (err) throw err;
			var isLogin = false;
			for (var i = 0; i < result.length; i++) {
				if (result[i].username == Username) {
					isHas = true;
					if (result[i].password == Password) {
						res.cookie('username', Username, {
							maxAge: 600000
						});
						res.cookie('password', Password, {
							maxAge: 600000
						});
						res.cookie('score', result[i].score, {
							maxAge: 600000
						});
						res.redirect('game.html');
						isLogin = true;
						console.log("登陆成功！");
					} else {
						res.redirect('has_user.html');
						console.log("已经存在该用户!");
					}
					break;
				}
			}
			if (!isHas) {
				var myobj = {
					'username': Username,
					'password': Password,
					'score': 0
				};
				dbo.collection(clName).insertOne(myobj, function(err, data) {
					if (err) throw err;
					console.log(Username + "注册成功！");
					db.close();
				});
				res.redirect('login_page.html');
			}
			res.end();
		})
	})

});

app.get('/login', function(req, res, next) {

	var Username = req.query.username;
	var Password = req.query.password;
	var Score = null;
	console.log(Username + ':' + Password);
	MongoClient.connect(mongoURL, function(err, db) {
		if (err) throw err;
		var isHas = false;
		var dbo = db.db(dbName);
		var usernameStr = {
			'username': Username
		};
		var passwordStr = {
			'password': Password
		};
		dbo.collection(clName).find(usernameStr).toArray(function(err, result) {
			var isLogin = false;
			if (err) throw err;
			for (var i = 0; i < result.length; i++) {
				if (result[i].username == Username) {
					isHas = true;
					if (result[i].password == Password) {
						isLogin = true;
						res.cookie('username', Username, {
							maxAge: 600000
						});
						res.cookie('score', result[i].score, {
							maxAge: 600000
						});
						res.redirect('game.html');
					} else {
						isLogin = false;
						res.redirect('login_error.html');
					}
				}
			}
			if (!isHas) {
				res.redirect('no_user.html');
			}
			res.end();
			db.close();
		})
	})
});

app.post('/update', urlencodedParser, function(req, res) {
	var Username = req.body.username;
	var Score = req.body.score;
	console.log(Username + ':' + Score);

	MongoClient.connect(mongoURL, function(err, db) {
		if (err) throw err;
		var isHas = false;
		var dbo = db.db(dbName);
		var usernameStr = {
			'username': Username
		};
		var updateStr = {
			$set:{'score': parseInt(Score)}
		}
		dbo.collection(clName).updateOne(usernameStr, updateStr, function(err, data) {
			if (err) throw err;
			//console.log("正在更新 (?:?)", usernameStr['username'], updateStr['score']);
			db.close();
			res.redirect('game.html');
			res.end();
		})
	})

})

app.get('/get_rank', function(req, res, next) {
	MongoClient.connect(mongoURL, function(err, db) {
		if (err) throw err;
		var dbo = db.db(dbName);
		var mysort = {
			'score': -1
		};
		dbo.collection(clName).find({}).sort(mysort).toArray(function(err, result) {
			if (err) throw err;
			// console.log(result);
			var rank_data = "";
			for (var i = 0; i < 15 && i < result.length; i++) {
				rank_data += "$" + result[i].username + '#' + result[i].score + '#';
			}
			rank_data = rank_data.substr(1);
			//console.log(rank_data);
			res.cookie('rank_data',rank_data,{maxAge:600000});
			console.log("获取rank成功");
			// console.log("返回数据如下：");
			// console.log(res.cookie);
			res.redirect('rank.html');
			res.end();
			db.close();
		})
	})
})

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
