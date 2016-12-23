'use strict';

var
  express = require('express'),
  bodyParser = require('body-parser'),
  logger = require('morgan');

var app = express();
app.use(logger('short'));
app.use(bodyParser.json());

var config = require('./src/config/config');
require('./src/config/routes')(app, config);
require('./src/config/mongoose')(config);

app.listen(config.port, function() {
  console.log('Listening on port ' + config.port);
});
