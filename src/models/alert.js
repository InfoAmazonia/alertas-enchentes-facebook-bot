'use strict'

var
  mongoose = require('mongoose');

var alertSchema = mongoose.Schema({
  user: Number,
  station: Number
});

module.exports = mongoose.model('Alert', alertSchema);
