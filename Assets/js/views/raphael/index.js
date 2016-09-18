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
  var large = 0;
  var zero = startAngle === endAngle;
  var circle = endAngle !== startAngle
    && (endAngle - startAngle) % (2 * PI) === 0;
  var strokeWidth = this.attrs['stroke-width'] || 1;
  var fixAngle = 0.0125 * PI * strokeWidth / radius;

  anticlockwise = anticlockwise === 0 ? 0 : 1;

  if (startAngle < 0) {
    startAngle = 2 * PI + startAngle % (2 * PI);
  }

  if (endAngle < 0) {
    endAngle = 2 * PI + endAngle % (2 * PI);
  }

  if (circle) {
    large = 1;
    endAngle = anticlockwise ? startAngle - fixAngle : startAngle + fixAngle;
  } else {
    var offset = endAngle - startAngle;

    if (anticlockwise && (offset > 0 ? offset > PI : offset > -PI)) {
      large = 1;
    } else if (!anticlockwise && (offset > 0 ? offset < PI : offset < -PI)) {
      large = 1;
    }
  }

  var xStart = x + Math.cos(startAngle) * radius;
  var yStart = y + Math.sin(startAngle) * radius;
  var pStart = getCoords(xStart, yStart);
  var path = [['M', pStart.x, pStart.y]];

  if (zero) {
    path.push(['L', pStart.x, pStart.y]);

    return path;
  }

  var xEnd = x + Math.cos(endAngle) * radius;
  var yEnd = y + Math.sin(endAngle) * radius;
  var pEnd = getCoords(xEnd, yEnd);

  path.push(['A', radius, radius, 0, large, anticlockwise, pEnd.x, pEnd.y]);

  if (circle) {
    startAngle = anticlockwise ? startAngle + fixAngle : startAngle - fixAngle;

    xStart = x + Math.cos(startAngle) * radius;
    yStart = y + Math.sin(startAngle) * radius;
    pStart = getCoords(xStart, yStart);

    path.push(['L', pStart.x, pStart.y]);
  }

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
      arc: [baseX, baseY, radius, 0, 0]
    })
    .animate({
      arc: [baseX, baseY, radius, 0, 2 * PI]
    }, 900, 'bounce');
});
