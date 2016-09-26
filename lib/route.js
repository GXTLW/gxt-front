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
 * @param router_base
 * @param controller_base
 * @returns {*|string}
 */
function src4controller(src, router_base, controller_base){
  return util.normalize(path.join(controller_base, path.relative(router_base, src)))
}

/**
 * Router
 * @param base
 * @constructor
 */
/**
 * Router
 * @param router_base
 * @param controller_base
 * @returns {router}
 * @constructor
 */
function Router(router_base, controller_base){
  var ctx = this;

  if (!(ctx instanceof Router)) {
    return new Router(router_base, controller_base);
  }

  if (!router_base || !util.string(router_base)) {
    router_base = 'router';
  }

  if (!controller_base || !util.string(controller_base)) {
    controller_base = 'controller';
  }

  ctx.router_base = router_base;
  ctx.controller_base = controller_base;

  // fetch
  return ctx.fetch(router_base);
}

/**
 * fetch
 * @param dir
 * @returns {router}
 */
Router.prototype.fetch = function (dir){
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
            var controller_src = src4controller(src, ctx.router_base, ctx.controller_base);

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

module.exports = Router;
