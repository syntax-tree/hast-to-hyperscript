// Dependencies:
var toHyperscript = require('./index.js');
var React = require('react');
var h = require('hyperscript');
var v = require('virtual-dom/h');

// HAST Tree:
var tree = {
    'type': 'element',
    'tagName': 'a',
    'properties': {
        'href': 'http://alpha.com',
        'id': 'bravo',
        'className': ['charlie', 'delta'],
        'download': true
    },
    'children': [{
        'type': 'text',
        'value': 'Echo'
    }]
};

// Compiling with `hyperscript`:
var result = toHyperscript(tree, h).outerHTML;

// Yields:
console.log('html', result);

// Or with `virtual-dom/h`:
result = toHyperscript(tree, v);

// Yields:
console.log('js', require('util').inspect(result));

// Or `React.createElement`:
result = toHyperscript(tree, React.createElement);

// Yields:
console.log('js', require('util').inspect(result));
