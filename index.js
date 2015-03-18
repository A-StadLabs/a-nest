'use strict';
var express = require('express');
var app = express();
var request = require('request');
var toughcookie = require('tough-cookie');
// var session = require('express-session');
var passport = require('passport');
var Firebase = require('firebase');
//require the Twilio module and create a REST client
//var twilio = require('twilio/lib')('ACCOUNT_SID', 'AUTH_TOKEN');
app.set('port', (process.env.PORT || 5000));

// serveer de polymeer
app.use(express.static(__dirname + '/public'));

app.use(passport.session());

// gewuun ne status update
app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

//Een api om een sms te sturen
app.get('/sendsms', function(req, res){
  var gsmnummer = req.query.gsmnummer;
  console.log(gsmnummer);
  //Send an text message
  twilio.sendMessage({

    to: gsmnummer, // Any number Twilio can deliver to
    from: '+32460202222', // A number you bought from Twilio and can use for outbound communication
    body: 'Hier komt dan de login code.' // body of the SMS message

    }, function(err, responseData) { //this function is executed when a response is received from Twilio

    if (!err) { // "err" is an error received during the request, if any

        // "responseData" is a JavaScript object containing data received from Twilio.
        // A sample response from sending an SMS message is here (click "JSON" to see how the data appears in JavaScript):
        // http://www.twilio.com/docs/api/rest/sending-sms#example-1

        console.log(responseData.from); // outputs "+14506667788"
        console.log(responseData.body); // outputs "word to your mother."

    }

    if(err) {
      console.log(err);
    }

  });
  res.send('iets');
});


// Incoming sms checken
app.get('/incoming', function(req, res){
  console.log(res);
});

// Check of de user al bestaat, indien niet gaan we een user aanmaken.

app.get('/usercheck', function(req, res){
  //console.log(val);
  var searchstring = req.query.gsm;
  var findUser = new Firebase("https://blazing-fire-6426.firebaseio.com/user/"+searchstring+"/");
    findUser.once("value", function(snapshot) {
      if(snapshot.val()){
        console.log('ik heb een user gevonden: ', snapshot.key());
        var usergsm = snapshot.key();
        var code = Math.floor(Math.random() * 900000) + 100000;
        var setCode = new Firebase("https://blazing-fire-6426.firebaseio.com/codes/"+code+"/"+usergsm+"/");
        setCode.set(true);
      } else {
        console.log('nu zou ik een nieuwe user aanmaken');
        var createUser = new Firebase("https://blazing-fire-6426.firebaseio.com/user/"+searchstring+"/");
        var code = Math.floor(Math.random() * 900000) + 100000;
        var setCode = new Firebase("https://blazing-fire-6426.firebaseio.com/codes/"+code+"/"+searchstring+"/");
        setCode.set(true);
        createUser.set({"gsm": searchstring, "lastlogin": Firebase.ServerValue.TIMESTAMP});
      }  
    res.send(code);
  });
});

// Check code en login
app.get('/codecheck', function(req, res){
  var code = req.query.kode;
  var gsm = req.query.gsm;
  var findCode = new Firebase("https://blazing-fire-6426.firebaseio.com/codes/"+code+"/");
    findCode.once("value", function(snapshot) {
      if(snapshot.val()){
        //console.log(snapshot.val());
        res.send('ok ik heb een code voor '+gsm);
        var getUser = new Firebase("https://blazing-fire-6426.firebaseio.com/user/"+gsm+"/");
        getUser.once("value", function(snapshot) {
          console.log(snapshot.val());
          req.session.userobject = snapshot.val();
          console.log(req.session.userobject);  
        }); 
      } else {
        res.send('geen code gevonden.');
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
	req.session.destroy(function(err) {
  	// cannot access session here
	});
});

// check user
app.get('/user', function(req, res){
	if(req.session.userobject){
		res.send(req.session.userobject);
    console.log(req.session.userobject);
	} else {
    console.log(req.session.userobject);
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
