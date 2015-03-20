'use strict';
var config = require('../config');
var twilio = require('twilio/lib')(config.twilio.ACCOUNT_SID, config.twilio.AUTH_TOKEN);

function Twilio() {}

Twilio.prototype.sendsms = function(gsmnummer, body, cb) {
	if (config.twilio.simulationmode !== true) {
		twilio.sendMessage({
			to: gsmnummer,
			from: '+32460202222',
			body: body
		}, cb);
	} else {
		console.log('SMS sending is disabled. to:' + gsmnummer + ' body:' + body);
	}
}

module.exports = new Twilio();