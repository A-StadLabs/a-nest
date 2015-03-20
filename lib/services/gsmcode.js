'use strict';
var config = require('../config');
var Firebase = require('firebase');

function Gsmcode() {}

// exchange GSM number (parameter id ) for a custom code
// callback fn(err,code);
Gsmcode.prototype.createCode = function createCode(gsm, fn) {
  var findUser = new Firebase(config.firebase.baseurl + "/user/" + gsm + "/");
  findUser.once("value", function(snapshot) {
    var code = Math.floor(Math.random() * 900000) + 100000;
    if (snapshot.val()) {
      var usergsm = snapshot.key();
      var setCode = new Firebase(config.firebase.baseurl + "/codes/" + code + "/" + gsm + "/");
      var setLogin = new Firebase(config.firebase.baseurl + "/user/" + gsm + "/lastlogin/");
      setLogin.set(Firebase.ServerValue.TIMESTAMP);
      setCode.set(true);
    } else {
      var createUser = new Firebase(config.firebase.baseurl + "/user/" + gsm + "/");
      createUser.set({
        "gsm": gsm,
        "lastlogin": Firebase.ServerValue.TIMESTAMP
      });
      var setCode = new Firebase(config.firebase.baseurl + "/codes/" + code + "/" + gsm + "/");
      setCode.set(true);
    }
    fn(null, code);
  });
}

// exchange gsm+code for user
Gsmcode.prototype.getUser = function getUser(gsm, code, fn) {
  //console.log('getUser '+ gsm + ','+code);
  var findCode = new Firebase(config.firebase.baseurl + "/codes/" + code + "/");
  findCode.once("value", function(findcoderesult) {
    if (findcoderesult.val()) {
      var getUser = new Firebase(config.firebase.baseurl + "/user/" + gsm + "/");
      getUser.once("value", function(getuserresult) {
        return fn(null, getuserresult.val());
      });
    } else {
      return fn(null, null);
    }
  });
}

module.exports = new Gsmcode();