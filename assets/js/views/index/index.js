/**
 * Created by nuintun on 2016/7/23.
 */

'use strict';

var $ = require('jquery');
var Lazy = require('lazy');
var Toast = require('toast');

$(function (){
  var array = [1, 2, 3, 4, 5, 6];
  var lazyArray = Lazy([1, 2, 3, 4, 5, 6])
    .filter(function (item){
      seajs.log('filter');

      return item < 4;
    })
    .map(function (item){
      seajs.log('map');

      return item * item;
    });

  seajs.log(array);
  seajs.log(lazyArray.value());
});
