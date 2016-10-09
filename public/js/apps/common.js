/**
 * Created by nuintun on 2016/8/2.
 */

'use strict';

var $ = require('marquee');
var Carousel = require('carousel');

$(function (){
  var banner = $('.ui-banner');
  var panels = banner.find('.ui-slider li');

  // 主广告
  new Carousel({
    element: banner,
    panels: panels,
    autoplay: true,
    hasTriggers: true,
    easing: 'easeOutStrong',
    effect: 'scrollx',
    classPrefix: 'ui-banner',
    prevBtn: banner.find('.ui-banner-prev'),
    nextBtn: banner.find('.ui-banner-next'),
    viewSize: [1920, 550]
  }).render();

  var notice = $('#marquee-notice');

  notice.marquee({ duration: 100000 });

  // 百度统计
  // require.async('//hm.baidu.com/hm.js?1c66fd20ce257b7023e522efb4623ef2');
  // 百度收录
  // require.async('//push.zhanzhang.baidu.com/push.js');
});
