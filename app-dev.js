/**
 * Created by nuintun on 2016/9/26.
 */

'use strict';

// set development env
process.env.NODE_ENV = 'development';

// run app
const app = require('./app');

var server = app.listen(8080, () => {
  var address = server.address();

  console.log('listening on port ' + address.port + '.');
});
