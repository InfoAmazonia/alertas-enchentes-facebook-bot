'use strict'

var
  request = require('request'),
  config = require('./../config/config');

exports.getRiverStatus = function(station, successCallback, errorCallback) {
  request({
      url: config.api + 'station/'+station+'/now',
      json: true
  }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        errorCallback("Não foi possível obter status desse rio.");
        return;
      }
      successCallback(body);
      return;
  });
}

exports.getAlert = function(station, successCallback, errorCallback) {
  request({
      url: config.api + 'station/'+station+'/alert',
      json: true
  }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        errorCallback("Não foi possível obter dados desse rio.");
        return;
      }
      successCallback(body);
      return;
  });
}
