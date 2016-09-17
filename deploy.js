/**
 * Created by liuyan on 2016/9/17.
 */

var fs = require('fs');
var path = require('path');
var http = require('http');
var rimraf = require('del');
var safeWriteStream = require('safe-write-stream');

rimraf.sync('deplay');

function normalize(src){
  return '/' + src.replace(/\\/g, '/');
}

function request(src, callback){
  return http.get('http://127.0.0.1:9090' + src, callback);
}

function read(dir){
  fs.readdir(dir, function (error, files){
    if (error) throw error;

    files.forEach(function (filename){
      var src = path.join(dir, filename);

      fs.stat(src, function (error, stats){
        if (stats.isDirectory()) {
          read(src);
        } else {
          src = normalize(src);

          request(src, function (res){
            console.log('deplay:', src);

            src = 'deploy/' + src.replace(/^\/statics\/views\//, '');

            res.pipe(safeWriteStream(src));
          });
        }
      });
    });

  });
}

read('statics/views');
