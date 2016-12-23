'use strict'

var
  request = require('request'),
  schedule = require('node-schedule'),
  config = require('./../config/config'),
  Alert = require('./../models/alert'),
  Timetable = require('./../models/timetable'),
  resource = require('./resource');

exports.receivedMessage = function(event) {
  var
    senderID = event.sender.id,
    recipientID = event.recipient.id,
    timeOfMessage = event.timestamp,
    message = event.message;

  if (message.is_echo) {
    return;
  } else if (message.quick_reply) {
    processQuickReply(senderID, message.quick_reply);
    return;
  }
  processText(senderID, message);
  return;
}

exports.receivedPostback = function(event) {
  var
    senderID = event.sender.id,
    recipientID = event.recipient.id,
    timeOfPostback = event.timestamp,
    payload = event.postback.payload;

  switch (payload) {
    case 'GET_STARTED_PAYLOAD':
      sendQuickReply(senderID, 'Olá, como posso ajudá-lo?');
      break;
    case 'HELP_PAYLOAD':
      sendTextMessage(senderID, 'HELP TEXT');
      break;
    case 'UNREGISTER_PAYLOAD':
      sendTextMessage(senderID, 'HELP TEXT');
      break;
    default:
      sendQuickReply(senderID, 'Olá, como posso ajudá-lo?');
      break;
  }
}

function processText(senderID, message) {
  sendQuickReply(senderID, 'Olá, como posso ajudá-lo?');
}

function processQuickReply(recipientId, quickReply) {
  sendTypingOn(recipientId);
  var payload = quickReply.payload.split(';');
  switch (payload[0]) {
    case 'RIOACRE_PAYLOAD':
      resource.getRiverData('13600002', function(river) {
        sendTypingOff(recipientId);
        sendRiverMessage(recipientId, river);
      }, function(errorMessage) {
        sendTypingOff(recipientId);
        sendTextMessage(recipientId, errorMessage);
      });
      break;
    case 'RIOMADEIRA_PAYLOAD':
      resource.getRiverData('15400000', function(river) {
        sendTypingOff(recipientId);
        sendRiverMessage(recipientId, river);
      }, function(errorMessage) {
        sendTypingOff(recipientId);
        sendTextMessage(recipientId, errorMessage);
      });
      break;
    case 'REGISTER_PAYLOAD':
      registerUser(recipientId, payload[1]);
      break;
    case 'NOT_REGISTER_PAYLOAD':
      sendTextMessage(recipientId, ';)');
      break;
    case 'HELP_PAYLOAD':
      sendTextMessage(recipientId, 'HELP TEXT');
      break;
    default:
      sendQuickReply(recipientId, 'Olá, como posso ajudá-lo?');
      break;
  }
}

function sendTextMessage(recipientId, messageText) {
  var
    messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: messageText,
        metadata: 'DEVELOPER_DEFINED_METADATA'
      }
    };

  callSendAPI(messageData);
}

function sendQuickReply(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      quick_replies: [
        {
          'content_type': 'text',
          'title': 'Rio Acre agora',
          'payload': 'RIOACRE_PAYLOAD'
        },
        {
          'content_type': 'text',
          'title': 'Rio Madeira agora',
          'payload':'RIOMADEIRA_PAYLOAD'
        },
        {
          'content_type': 'text',
          'title': 'Ajuda',
          'payload': 'HELP_PAYLOAD'
        }
      ]
    }
  };

  callSendAPI(messageData);
}

function sendTypingOn(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: 'typing_on'
  };
  callSendAPI(messageData);
}

function sendTypingOff(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    sender_action: 'typing_off'
  };
  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: config.fb.access_token },
    method: 'POST',
    json: messageData
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log('Successfully sent message with id %s to recipient %s', messageId, recipientId);
      } else {
      console.log('Successfully called Send API for recipient %s', recipientId);
      }
    } else {
      console.error('Failed calling Send API', response.statusCode, response.statusMessage, body.error);
    }
  });
}

function sendRiverMessage(recipientId, river) {
  Alert.find({ user: recipientId, station: river.info.id }, function(error, alerts) {
    if (error) {
      console.error(error);
      sendTextMessage(recipientId, "Estou indiponível no momento");
      return;
    }
    if (alerts.length) {
      sendTextMessage(recipientId, getRiverText(river));
      return;
    }
    var messageData = {
      recipient: {
        id: recipientId
      },
      message: {
        text: getRiverText(river),
        quick_replies: [
          {
            'content_type': 'text',
            'title': 'Receber alertas',
            'payload': 'REGISTER_PAYLOAD'+ ';' + river.info.id
          },
          {
            'content_type': 'text',
            'title': 'Obrigado',
            'payload': 'NOT_REGISTER_PAYLOAD'
          }
        ]
      }
    };

    callSendAPI(messageData);
    return;
  });
}

function registerUser(recipientId, riverId) {
  var alert = new Alert({
    user: recipientId,
    station: riverId
  });
  alert.save(function(error) {
    if (error) {
      console.error(error);
      return;
    }
    sendTextMessage(recipientId, "Você receberá alertas a partir de agora.");
    return;
  });
}

function unregisterUser(recipientId) {
  Alert.remove({user: recipientId}, function(error) {
    if (error) {
      console.error(error);
      return;
    }
    sendTextMessage(recipientId, "Nenhum alerta será enviado à você. Para voltar a receber, basta solicitar novamente.");
    return;
  });
}

function getRiverText(river) {
  var measured = Math.round((river.data[0].measured * 0.001) * 100) / 100;
  var str = 'Atualmente o nível do '+river.info.riverName+', em '+river.info.name+' está em '+measured+' metros. ';
  str += getAlertTimestamp(river);
  return str;
}

function getAlertTimestamp(river) {
    if (!river) return '';
    // Checks flood threshold
    for (var i = 0; i < river.data.length; i++) {
      if (river.data[i].predicted >= river.info.floodThreshold) {
        return 'A previsão é que o nível chegue em estado de cheia aos '+river.data[i].predicted+' metros em '+river.data[i].timestamp+' horas.';
      };
    }
    // Checks warning threshold
    for (var i = 0; i < river.data.length; i++) {
      if (river.data[i].predicted >= river.info.warningThreshold) {
        return 'A previsão é que o nível chegue em estado de alerta aos '+river.data[i].predicted+' metros em '+river.data[i].timestamp+' horas.';
      };
    }
    return 'A previsão é que o nível mantenha seu estado atual pelas próximas horas.';
  }

function sendAlertToAll(recipients, alert) {
  for (var i = 0; i < recipients.length; i++) {
    sendTextMessage(recipients[i].user, alert.message);
  }
}

// Execute a cron job every 1 minute
schedule.scheduleJob('* * * * *', function() {
  var cursor = Alert.aggregate([ { $group: { _id: "$station" }} ]).cursor({ batchSize: 1000 }).exec();
  cursor.each(function(error, doc) {
    if (doc) {
      resource.getAlert(doc._id, function(alert) {
        console.log("GET "+ doc._id);
        // Check if a new alert was posted
        Timetable.find({station: doc._id}, function(error, result) {
          if (error) {
            console.log(error);
            return;
          }
          var timetable = result[0];
          console.log("== Timetable ==");
          console.log(timetable.timestamp);
          console.log("====");
          if (timetable && timetable.timestamp !== alert.timestamp) {
            Alert.find({station: doc._id}, function(error, alerts) {
              if (error) {
                console.log(error);
                return;
              }
              Timetable.findOneAndUpdate(
                { station: doc._id},
                {
                  timestamp: alert.timestamp,
                  station: doc._id
                }, function(error) {
                  if (error) {
                    console.log(error);
                    return;
                  }
                  console.log("Timestamp changed [old "+timetable.timestamp+"] [new "+alert.timestamp+"]");
                  sendAlertToAll(alerts, alert);
                });
            });
          }

        });
      }, function(error) {
        console.log(error);
      });
    }
  });

});
