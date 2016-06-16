// Dependencies:
var toH = require('./index.js');
var h = require('hyperscript');

// AST:
var tree = { type: 'element',
   tagName: 'p',
   properties: { id: 'alpha', className: [ 'bravo' ] },
   children:
    [ { type: 'text',
        value: 'charlie ' },
      { type: 'element',
        tagName: 'strong',
        properties: { style: 'color: red;' },
        children:
         [ { type: 'text',
             value: 'delta' } ] },
      { type: 'text',
        value: ' echo.' } ] }

// Transform (`hyperscript` needs `outerHTML` to stringify):
var doc = toH(h, tree).outerHTML;

// Yields:
console.log('html', doc);
