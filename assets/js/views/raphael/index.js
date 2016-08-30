/**
 * Created by nuintun on 2016/8/30.
 */

'use strict';

var $ = require('jquery');
var Raphael = require('raphael');

var PI = Math.PI;

function getCoords(x, y){
  var m = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ];

  return {
    x: (x * m[0][0] + y * m[1][0] + m[2][0]),
    y: (x * m[0][1] + y * m[1][1] + m[2][1])
  };
}

function arc(x, y, radius, startAngle, endAngle, anticlockwise){
  var path;
  var large = 0;

  anticlockwise = anticlockwise === 0 ? 0 : 1;

  if (startAngle < 0) {
    startAngle = Math.abs(startAngle % (2 * PI));
  }

  if (endAngle < 0) {
    endAngle = Math.abs(endAngle % (2 * PI));
  }

  var offset = endAngle - startAngle;

  if (anticlockwise === 1 && (offset > PI || offset > -PI)) {
    large = 1;
  } else if (anticlockwise === 0 && (offset < PI || offset < -PI)) {
    large = 1;
  }

  var xStart = x + Math.cos(startAngle) * radius;
  var yStart = y + Math.sin(startAngle) * radius;
  var pStart = getCoords(xStart, yStart);
  var xEnd = x + Math.cos(endAngle) * radius;
  var yEnd = y + Math.sin(endAngle) * radius;
  var pEnd = getCoords(xEnd, yEnd);

  path = [
    ['M', pStart.x, pStart.y],
    ['A', radius, radius, 0, large, anticlockwise, pEnd.x, pEnd.y]
  ];

  return { path: path };
}

$(function (){
  var radius = 175;
  var strokeWidth = 21;
  var canvas = $('#raphael');
  var width = canvas.width();
  var height = canvas.height();
  var baseX = width / 2;
  var baseY = height / 2;
  var brush = Raphael(canvas[0], width, height);

  brush.customAttributes.arc = arc;

  brush
    .circle(baseX, baseY, radius)
    .attr({
      stroke: '#f1edff',
      'stroke-width': strokeWidth
    });

  brush
    .path()
    .attr({
      stroke: '#8384ff',
      'stroke-width': strokeWidth,
      arc: [baseX, baseY, radius, -0.5 * PI, 1.5 * PI, 0]
    })
});
