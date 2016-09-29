/**
 * Created by nuintun on 2016/9/29.
 */

'use strict';

const nunjucks = require('nunjucks');

module.exports = function (app, options){
  if (app.context.render) return;

  app.context.render = function (view, data){
    console.log(this.routeData);
  };
};
