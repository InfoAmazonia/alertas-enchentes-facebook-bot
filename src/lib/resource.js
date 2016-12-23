'use strict'

var
  request = require('request'),
  config = require('./../config/config');

exports.getRiverData = function(station, successCallback, errorCallback) {
  request({
      url: config.api + 'station/'+station+'/prediction',
      json: true
  }, function (error, response, body) {
      if (error || response.statusCode !== 200) {
        errorCallback("Não foi possível obter dados desse rio.");
        return;
      }
      if (body.data.length) {
        successCallback(body);
      } else {
        errorCallback("Sem informações disponíveis no momento");
      }
      return;
  });
}
