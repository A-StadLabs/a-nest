'use strict';
var express = require('express');
var app = express();
var request = require('request');
var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var config = require('./lib/config');

// load services from seperate files
var twilio = require('./lib/services/twilio');
var gsmcode = require('./lib/services/gsmcode');
var util = require('util');

app.use(cookieParser())

app.use(session({
  keys: ['secret1', 'secret2'],
  maxAge: 60 * 60 * 24 * 2 * 1000,
  // seconden * minuten * uren * dagen * milliseconden
  secure:false,
  name: 'astadlabs'
  }));

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.listen(app.get('port'), function() {
});

// check userstatus
app.get('/user', function(req, res) {
  console.log('Sessie? '+ req.session.userobject);
  if (req.session.userobject) {
    res.send({ "status": "OK", "user": req.session.userobject });
    console.log(req.session.userobject);
  } else {
    res.send({
      'status': 'E',
      'user': 'User not logged in.',
    });
  }
});

// Check of de user al bestaat, indien niet gaan we een user aanmaken.
app.get('/usercheck', function(req, res) {
  //console.log(val);
  var searchstring = req.query.gsm;
  gsmcode.createCode(searchstring, function(err, code) {
    twilio.sendsms(searchstring, 'Je code is ' + code, function(err) {
      if (err) {
        console.log('code: ', code, err);
      } else {
        console.log(code+ ' sms sent to ' + searchstring);
      }
    }); 
    res.send({
      message: 1
    });
  });
});

// Check code en login
app.get('/codecheck', function(req, res) {
  console.log('codecheck');
  var mysession = req.session;
  gsmcode.getUser(req.query.gsm, req.query.kode, function(err, user) {
    if (user) {
      console.log('user gevonden...');
      console.log('USER: ',user);
      mysession.userobject = user; 
      mysession.gsm = req.query.gsm;
      console.log('sessie object: ',req.session.userobject);
      res.json({"status": "OK", "user": user});
    } else {
      console.log('geen user gevonden...');
      res.json({"status": "E"});
    }
  });
});

// Incoming sms checken
app.get('/incoming', function(req, res) {
  console.log(res);
});

//logout
app.get('/logout', function(req, res) {
  req.session = null;
  res.send("logged out");
});