/*******************************************************************************
 * KindEditor - WYSIWYG HTML Editor for Internet
 * Copyright (C) 2006-2011 kindsoft.net
 *
 * @author Roddy <luolonghao@gmail.com>
 * @site http://www.kindsoft.net/
 * @licence http://www.kindsoft.net/license.php
 *******************************************************************************/

KindEditor.plugin('preview', function(K) {
  var self = this,
    name = 'preview',
    undefined;
  self.clickToolbar(name, function() {
    var lang = self.lang(name + '.'),
      html = '<div style="padding:10px 20px;">'
      + '<iframe class="ke-textarea" frameborder="0" style="width:708px;height:500px;"></iframe>'
      + '</div>',
      dialog = self.createDialog({
        name: name,
        width: 750,
        title: self.lang(name),
        body: html
      }),
      iframe = K('iframe', dialog.div),
      doc = K.iframeDoc(iframe),
      editorHtml = self.edit.doc.getElementsByTagName('html')[0],
      direction = editorHtml.dir || '';

    html = '<!DOCTYPE html>'
      + (direction ? '<html dir="' + _direction + '">' : '<html>')
      + '<head><meta charset="utf-8" /><title></title>'
      + (self.cssPath ? '<link type="text/css" rel="stylesheet" href="' + self.cssPath + '" />' : '')
      + (self.cssData ? '<style type="text/css">' + self.cssData + '</style></head>' : '')
      + (self.bodyClass ? '<body class="' + self.bodyClass + '">' : '<body>')
      + self.html() + '</body></html>';

    doc.open();
    doc.write(html);
    doc.close();
    iframe[0].contentWindow.focus();
  });
});
