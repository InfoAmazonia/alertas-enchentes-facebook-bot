'use strict'

const
  request = require('request'),
  config = require('./../config/config');

exports.getRiverData = function(station) {
  request({
      url: config.api + 'station/'+station+'/prediction',
      json: true
  }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        return;
      }
      callback(body);
      return;
  });
}
