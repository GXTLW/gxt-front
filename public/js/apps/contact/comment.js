/**
 * Created by nuintun on 2016/9/30.
 */

'use strict';

var $ = require('jquery');
var Toast = require('toast');

$(function (){
  var form = $('#form');

  form.on('submit', function (e){
    e.preventDefault();

    Toast.info('在线留言功能正在开发中，敬请期待！');
  });
});
