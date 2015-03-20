'use strict';
var express = require('express');
var app = express();
var request = require('request');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var config = require('./lib/config');
// load services from seperate files
var twilio = require('./lib/services/twilio');
var gsmcode = require('./lib/services/gsmcode');

app.use(cookieParser())
app.use(cookieSession({
  keys: ['secret1', 'secret2']
}));
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});

// Check of de user al bestaat, indien niet gaan we een user aanmaken.
app.get('/usercheck', function(req, res) {
  //console.log(val);
  var searchstring = req.query.gsm;
  gsmcode.createCode(searchstring, function(err, code) {
    twilio.sendsms(searchstring, 'Je code is ' + code, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('sms sent to ' + searchstring);
      }
    });
    res.send({
      message: 'code sent to user'
    });
  });
});

// Check code en login
app.get('/codecheck', function(req, res) {
  console.log('codecheck');
  gsmcode.getUser(req.query.gsm, req.query.kode, function(err, user) {
    if (user) {
      console.log('user gevonden...');
      console.log(user);
      req.session.userobject = user;
      res.json(user);
    } else {
      console.log('geen user gevonden...');
      res.json({});
    }
  });
});


// Incoming sms checken
app.get('/incoming', function(req, res) {
  console.log(res);
});

// Login voor profiel
app.get('/login', function(req, res) {
  var user = req.query.username;
  var pass = req.query.password;
  //console.log(val);
  request.post({
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'post',
    jar: true,
    url: 'https://www.antwerpen.be/srv/user/d/auth',
    json: {
      "username": user,
      "password": pass
    }
  }, function(error, response, body) {
    //req.session.userobject = body;
    console.log(body.success);
    if (body.success === true) {
      req.session.userobject = body;
    }
    res.send(body);
  });
});

//logout
app.get('/logout', function(req, res) {
  req.session = null;
  res.send("logged out");
});

// check user
app.get('/user', function(req, res) {
  if (req.session && req.session.userobject) {
    res.send(req.session.userobject);
    console.log(req.session.userobject);
  } else {
    //console.log(req.session.userobject);
    res.send({
      'userstatus': 'E',
      'msg': 'User not logged in.'
    });
    //req.session.destroy(function(err) {
    // cannot access session here
    //});
  }
});

// // CRS persoon 
// app.get('/crs-persoon', function(req, res) {
//   //console.log(val);
//   req.session.userobject;
//   request.get({
//     url: 'https://www.antwerpen.be/srv/user/d/account/crsklant/crspersoon',
//     jar: true
//   }, function(error, response, body) {
//     res.send(body);
//   });
// });

// // CRS medewerker
// app.get('/crs-medewerker', function(req, res) {
//   //console.log(val);
//   req.session.userobject;
//   request.get({
//     url: 'https://www.antwerpen.be/srv/user/d/account/crsklant/info',
//     jar: true
//   }, function(error, response, body) {
//     res.send(body);
//   });
// });

// // Find address  
// app.get('/adres', function(req, res) {
//   var val = req.query.search;
//   //req.session.userobject;
//   request.get({
//     url: 'https://www.antwerpen.be/srv/d/astad/location/search/' + val,
//     jar: true
//   }, function(error, response, body) {
//     res.send(body);
//   });
// });

// // Notificaties 
// app.get('/notifications', function(req, res) {
//   //console.log(val);
//   req.session.userobject;
//   request.get({
//     url: 'https://www.antwerpen.be/srv/notification/d/unread',
//     jar: true
//   }, function(error, response, body) {
//     res.send(body);
//   });
// });

// //Vind een gebruiker
// app.get('/gebruiker', function(req, res) {
//   //console.log(val);
//   var searchstring = req.query.search;
//   var users = [];
//   var findUser = new Firebase("https://blazing-fire-6426.firebaseio.com/chat/directory/");
//   findUser.on("child_added", function(snapshot) {
//     if (snapshot.val().username.substr(0, searchstring.length) == searchstring) {
//       users.push({
//         "username": snapshot.val().username,
//         "userid": snapshot.val().userid,
//         "avatar": snapshot.val().avatar,
//         "firstname": snapshot.val().firstname
//       });
//       console.log(users);
//     }
//   });

//   res.send(users);
// });

// // Notificaties

// // Een notificatie versturen
// app.get('/notificatie', function(req, res) {
//   //console.log(val);
//   var user = req.query.user;
//   var app = req.query.app;
//   var msg = req.query.msg;
//   var link = req.query.link;

//   request.post({
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     method: 'post',
//     url: 'https://www.antwerpen.be/srv/notification/d/add-notification',
//     jar: true,
//     json: {
//       app: app, // welke app verzend het
//       user: username, // naar wie moet dat
//       message: msg, // wat is je bericht
//       link: link
//     },
//   }, function(error, response, body) {
//     res.send(body);
//     console.log(body);
//   });
// });
