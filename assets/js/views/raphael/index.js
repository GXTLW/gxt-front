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
  var equalAngle = startAngle === endAngle;

  anticlockwise = anticlockwise === 0 ? 0 : 1;

  if (startAngle < 0) {
    startAngle = 2 * PI - Math.abs(startAngle / PI % 2 * PI);
  }

  if (endAngle < 0) {
    endAngle = 2 * PI - Math.abs(endAngle / PI % 2 * PI);
  }

  var large = endAngle - startAngle;

  if ((anticlockwise === 1 && startAngle > endAngle)
    || (anticlockwise === 0 && startAngle < endAngle)) {
    large = 2 * PI - Math.abs(large / PI % 2 * PI);
  }

  // Fixed IE bug
  if (!(large / PI % 2)) {
    endAngle += 0.000000001;
  }

  if (!large && !equalAngle) {
    large = 2 * PI;
    endAngle = startAngle - 0.0001;
  }

  var xStart = x + Math.cos(startAngle) * radius;
  var yStart = y + Math.sin(startAngle) * radius;
  var xEnd = x + Math.cos(endAngle) * radius;
  var yEnd = y + Math.sin(endAngle) * radius;
  var pStart = getCoords(xStart, yStart);
  var pEnd = getCoords(xEnd, yEnd);

  path = [
    ['M', pStart.x, pStart.y],
    ['A', radius, radius, 0, large > PI ? 1 : 0, anticlockwise, pEnd.x, pEnd.y]
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
