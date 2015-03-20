'use strict';
var config = require('../../config.json');

if (process.env.config) {
	try {
		var env_config = JSON.parse(process.env.config);
		config = env_config;
	} catch (e) {
		// not a JSON string
		console.log('config env var found - but is not a JSON string : "' + process.env.config + '"');
	}
}

console.log('config=');
console.log(config);

module.exports = config;