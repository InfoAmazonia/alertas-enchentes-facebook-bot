'use strict'

const
  request = require('request'),
  config = require('./../config/config'),
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
        sendTextMessage(recipientId, getRiverText(river));
      }, function(errorMessage) {
        sendTypingOff(recipientId);
        sendTextMessage(recipientId, errorMessage);
      });
      break;
    case 'RIOMADEIRA_PAYLOAD':
      resource.getRiverData('15400000', function(river) {
        sendTypingOff(recipientId);
        sendTextMessage(recipientId, getRiverText(river));
      }, function(errorMessage) {
        sendTypingOff(recipientId);
        sendTextMessage(recipientId, errorMessage);
      });
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

function getRiverText(river) {
  var measured = Math.round((river.data[0].measured * 0.001) * 100) / 100;
  var str = 'Atualmente o nível do '+river.info.riverName+', em '+river.info.name+' está em '+measured+' metros.';
  str += getAlertTimestamp(river);
  return str;
}

function getAlertTimestamp(river) {
    if (!river) return '';
    // Checks flood threshold
    for (var i = 0; i < river.data.length; i++) {
      if (river.data[i].predicted >= river.info.floodThreshold) {
        return {
          title: ':warning:',
          description: 'A previsão é que o nível chegue em estado de cheia aos '+river.data[i].predicted+' metros em '+river.data[i].timestamp+' horas.',
          timestamp: data[i].id.timestamp
        };
      };
    }
    // Checks warning threshold
    for (var i = 0; i < river.data.length; i++) {
      if (river.data[i].predicted >= river.info.warningThreshold) {
        return {
          title: ':warning:',
          description: 'A previsão é que o nível chegue em estado de alerta aos '+river.data[i].predicted+' metros em '+river.data[i].timestamp+' horas.',
          timestamp: data[i].id.timestamp
        };
      };
    }
    return {
      title: ':white_check_mark:',
      description: 'A previsão é que o nível mantenha seu estado atual pelas próximas horas.',
      timestamp: null
    };
  }
