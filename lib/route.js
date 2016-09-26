/**
 * Created by nuintun on 2016/9/26.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const util = require('./util');
const router = require('koa-router');

// route
const route = router();

// load routes
function load(dir){
  fs.readdir(dir, function (error, files){
    if (error) throw error;

    files.forEach(function (filename){
      var src = path.join(dir, filename);

      fs.stat(src, function (error, stats){
        if (stats.isDirectory()) {
          load(src);
        } else {
          var ext = path.extname(src).toLowerCase();

          if (ext === '.js') {
            var routes = util.require(src);

            routes.forEach(function (item){
              var method = item.method || 'get';
              
              route[method](item.route, item.action);
            });
          }
        }
      });
    });
  });

  return route.routes();
}

module.exports = load;
