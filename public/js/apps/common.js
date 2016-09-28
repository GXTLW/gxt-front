/**
 * Created by nuintun on 2016/8/2.
 */

'use strict';

var $ = require('jquery');
var Marquee = require('marquee');
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

  notice.marquee({ duration: 20000 });
});
