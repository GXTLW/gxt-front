/**
 * Created by nuintun on 2016/9/26.
 */

'use strict';

var cwd = process.cwd();
var path = require('path');

module.exports = {
  cwd: cwd,
  require: function (src){
    return require(path.resolve(cwd, src));
  }
};
