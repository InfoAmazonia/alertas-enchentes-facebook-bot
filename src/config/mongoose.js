'use strict'

var
	mongoose = require('mongoose');

module.exports = function(config) {
	mongoose.connect(config.db, function(error) {
		if (error) {
			console.log('Cannot connect to database');
			throw error;
		}
		console.log('Database connected!');
		var db = mongoose.connection;
	});
};
