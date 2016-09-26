/**
 * Created by nuintun on 2016/9/26.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const util = require('./util');
const router = require('koa-router')();

/**
 * src for controller
 * @param src
 * @param base
 * @returns {*|string}
 */
function src4controller(src, base){
  return util.normalize(path.join('controller', path.relative(base, src)))
}

/**
 * Loader
 * @param base
 * @constructor
 */
function Loader(base){
  var ctx = this;

  if (!(ctx instanceof Loader)) {
    return new Loader(base);
  }

  ctx.base = base;

  // fetch
  return ctx.fetch(base);
}

/**
 * fetch
 * @param dir
 * @returns {Loader}
 */
Loader.prototype.fetch = function (dir){
  var ctx = this;

  // readdir
  fs.readdir(dir, function (error, files){
    if (error) throw error;

    // read file
    files.forEach(function (filename){
      var src = util.normalize(path.join(dir, filename));

      // file states
      fs.stat(src, function (error, stats){
        // if error throw error
        if (error) {
          throw error;
        }

        // dir
        if (stats.isDirectory()) {
          ctx.fetch(src);
        } else {
          var ext = path
            .extname(src)
            .toLowerCase();

          if (ext === '.js') {
            var routes = util.require(src);
            var controller_src = src4controller(src, ctx.base);

            // assert routes
            if (util.object(routes)) {
              // load controller
              try {
                var controller = util.require(controller_src);
              } catch (e) {
                throw new Error(`Controller: ${controller_src} not found!`)
              }

              // assert controller
              if (util.object(controller)) {
                Object.keys(routes).forEach(function (url){
                  var route = routes[url];

                  // assert route
                  if (util.array(route)) {
                    route.forEach(function (item){
                      var action_name = item.action;
                      var action = controller[action_name];

                      // assert action
                      if (action) {
                        var method = route.method || 'get';

                        if (router[method]) {
                          router[method](url, action);
                        } else {
                          throw new Error(`Method: ${method} not support!`);
                        }
                      } else {
                        throw new Error(`Action: ${action_name} can't be found in controller: ${controller_src}!`);
                      }
                    });
                  } else {
                    throw new TypeError(`Route: ${url} invalid!`)
                  }
                });
              } else {
                throw new TypeError(`Controller: ${controller_src} invalid!`)
              }
            } else {
              throw new TypeError(`Router: ${src} invalid!`);
            }
          }
        }
      });
    });
  });

  // router
  return router;
};

module.exports = Loader;
