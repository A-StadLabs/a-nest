'use strict';
var express = require('express');
var app = express();
var request = require('request');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var Firebase = require('firebase');
var config = require('./config.json');
var twilio = require('twilio/lib')(config.twilio.ACCOUNT_SID, config.twilio.AUTH_TOKEN);

app.use(cookieParser())
app.use(cookieSession({
    keys: ['secret1', 'secret2']
}));
//app.use(passport.initialize());
//app.use(passport.session());
//app.use(passport.authenticate('remember-me'));
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

//app.use(passport.session());

// gewuun ne status update
app.listen(app.get('port'), function() {
  //console.log("Node app is running at localhost:" + app.get('port'));
});

function sendsms(gsmnummer,body,cb){
  twilio.sendMessage({
    to: gsmnummer,
    from: '+32460202222',
    body: body
  },cb);

  console.log('send sms to '+gsmnummer+' met code '+body);
}

// exchange GSM number (parameter id ) for a custom code
function findById(gsm, fn) {
 var findUser = new Firebase("https://blazing-fire-6426.firebaseio.com/user/"+gsm+"/");
    findUser.once("value", function(snapshot) {
      var code = Math.floor(Math.random() * 900000) + 100000;
      if(snapshot.val()){
        //console.log('ik heb een user gevonden: ', snapshot.key());
        var usergsm = snapshot.key();
        var setCode = new Firebase("https://blazing-fire-6426.firebaseio.com/codes/"+code+"/"+gsm+"/");
        // update last login date
        var setLogin = new Firebase("https://blazing-fire-6426.firebaseio.com/user/"+gsm+"/lastlogin/");
        setLogin.set(Firebase.ServerValue.TIMESTAMP);
        setCode.set(true);
        //sendsms(gsm, code);
      } else {
        //console.log('nu zou ik een nieuwe user aanmaken');
        var createUser = new Firebase("https://blazing-fire-6426.firebaseio.com/user/"+gsm+"/");
        createUser.set({"gsm": gsm, "lastlogin": Firebase.ServerValue.TIMESTAMP});
        var setCode = new Firebase("https://blazing-fire-6426.firebaseio.com/codes/"+code+"/"+gsm+"/");
        setCode.set(true);
        //sendsms(gsm, code);
      }
      fn(null,code); 
    });
}
// exchange gsm+code for user
function validateCode(gsm,code,fn){
  //console.log('validatecode '+ gsm + ','+code);
  var findCode = new Firebase("https://blazing-fire-6426.firebaseio.com/codes/"+code+"/");
    findCode.once("value", function(findcoderesult) {
      if(findcoderesult.val()){
        //console.log(snapshot.val());
        //res.send('ok ik heb een code voor '+gsm);
        //console.log('code gevonden voor ' + gsm);
        var getUser = new Firebase("https://blazing-fire-6426.firebaseio.com/user/"+gsm+"/");
        getUser.once("value", function(getuserresult) {
          //console.log(snapshot.val());
          //req.session.userobject = snapshot.val();
          //console.log(req.session.userobject);
          //console.log('userobject gevonden');
          //console.log(getuserresult.val());
          return fn(null,getuserresult.val());  
        }); 
      } else {
        //console.log('geen code gevonden');
        return fn(null,null);
//        res.send('geen code gevonden.');
      }
    });
}

// Incoming sms checken
app.get('/incoming', function(req, res){
  console.log(res);
});

// Check of de user al bestaat, indien niet gaan we een user aanmaken.

app.get('/usercheck', function(req, res){
  //console.log(val);
  var searchstring = req.query.gsm;
  findById(searchstring,function(err,code){
    sendsms(searchstring,'Je code is ' + code,function(err){
      if (err){
        console.log(err);
      }else{
        console.log('sms sent to ' + searchstring);
      }
    });
    res.send({message:'code sent to user'});
  });
});

// Check code en login
app.get('/codecheck', function(req, res){
  console.log('codecheck');
  validateCode(req.query.gsm,req.query.kode,function(err,user){
    if (user){
      console.log('user gevonden...');
      console.log(user);
      req.session.userobject = user;
      res.json(user);
    }else{
      console.log('geen user gevonden...');
      res.json({});
    }
  });
});

// Login voor profiel
app.get('/login', function(req, res){
	var user = req.query.username;
	var pass = req.query.password;
 	//console.log(val);
 	request.post({
  		headers: {'Content-Type' : 'application/json'},
  		method: 'post',
  		jar: true,
  		url:     'https://www.antwerpen.be/srv/user/d/auth',
  		json: {"username": user, "password": pass}
	}, function(error, response, body){
		  //req.session.userobject = body;
      console.log(body.success);
      if(body.success===true){
        req.session.userobject = body;
      }
  		res.send(body);
	});
});

//logout
app.get('/logout', function(req, res){
	req.session = null;
  res.send("logged out");
});

// check user
app.get('/user', function(req, res){
	if(req.session && req.session.userobject){
		res.send(req.session.userobject);
    console.log(req.session.userobject);
	} else {
    //console.log(req.session.userobject);
		res.send({ 'userstatus': 'E', 'msg': 'User not logged in.'});
    //req.session.destroy(function(err) {
    // cannot access session here
  //});
	}
});

// CRS persoon 
app.get('/crs-persoon', function(req, res){
  //console.log(val);
  req.session.userobject;
  request.get({url: 'https://www.antwerpen.be/srv/user/d/account/crsklant/crspersoon', jar: true}, function(error, response, body){
      res.send(body);
  });
});

// CRS medewerker
app.get('/crs-medewerker', function(req, res){
  //console.log(val);
  req.session.userobject;
  request.get({url: 'https://www.antwerpen.be/srv/user/d/account/crsklant/info', jar: true}, function(error, response, body){
      res.send(body);
  });
});

// Find address  
app.get('/adres', function(req, res){
  var val = req.query.search;
  //req.session.userobject;
  request.get({url: 'https://www.antwerpen.be/srv/d/astad/location/search/'+val, jar: true}, function(error, response, body){
      res.send(body);
  });
});

// Notificaties 
app.get('/notifications', function(req, res){
 	//console.log(val);
 	req.session.userobject;
 	request.get({url: 'https://www.antwerpen.be/srv/notification/d/unread', jar: true}, function(error, response, body){
  		res.send(body);
	});
});

//Vind een gebruiker
app.get('/gebruiker', function(req, res){
  //console.log(val);
  var searchstring = req.query.search;
  var users =[];
  var findUser = new Firebase("https://blazing-fire-6426.firebaseio.com/chat/directory/");
          findUser.on("child_added", function(snapshot) {
            if(snapshot.val().username.substr(0, searchstring.length) == searchstring){
              users.push({ "username": snapshot.val().username, "userid": snapshot.val().userid, "avatar": snapshot.val().avatar, "firstname": snapshot.val().firstname });
              console.log(users);
            }
          });

          res.send(users);
});

// Notificaties

// Een notificatie versturen
app.get('/notificatie', function(req, res){
  //console.log(val);
  var user = req.query.user;
  var app = req.query.app;
  var msg = req.query.msg;
  var link = req.query.link;

  request.post({
    headers: {'Content-Type' : 'application/json'},
    method: 'post',
    url: 'https://www.antwerpen.be/srv/notification/d/add-notification', 
    jar: true,
    json: {app: app, // welke app verzend het
    user: username,  // naar wie moet dat
    message: msg, // wat is je bericht
    link: link},
    }, function(error, response, body){
      res.send(body);
      console.log(body);
  });
});
