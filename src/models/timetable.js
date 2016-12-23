'use strict'

var
  mongoose = require('mongoose');

var timetableSchema = mongoose.Schema({
  timestamp: Number,
  station: Number
});

module.exports = mongoose.model('Timetable', timetableSchema);
