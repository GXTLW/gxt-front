/**
 * Created by nuintun on 2016/9/23.
 */

'use strict';

var util = require('../../lib/util');

module.exports = [
  {
    route: '/',
    action: util.require('controller/index/index')
  }
];
