# hast-to-hyperscript [![Build Status][build-badge]][build-page] [![Coverage Status][coverage-badge]][coverage-page]

Convert a [HAST][] [Node][node] to another virtual node through
a hyperscript compatible interface such as [virtual dom][vdom],
[`React.createElement`][react], or [hyperscript][].

## Installation

[npm][]:

```bash
npm install hast-to-hyperscript
```

**hast-to-hyperscript** is also available as an AMD, CommonJS, and
globals module, [uncompressed and compressed][releases].

## Usage

Dependencies:

```javascript
var toHyperscript = require('hast-to-hyperscript');
var React = require('react');
var h = require('hyperscript');
var v = require('virtual-dom/h');
```

HAST Tree:

```javascript
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
```

Compiling with `hyperscript`:

```javascript
var result = toHyperscript(tree, h).outerHTML;
```

Yields:

```html
<a href="http://alpha.com" id="bravo" download="download" class="charlie delta">Echo</a>
```

Or with `virtual-dom/h`:

```javascript
result = toHyperscript(tree, v);
```

Yields:

```js
VirtualNode {
  tagName: 'A',
  properties:
   { href: 'http://alpha.com',
     id: 'bravo',
     download: true,
     attributes: { class: 'charlie delta' } },
  children: [ VirtualText { text: 'Echo' } ],
  key: undefined,
  namespace: null,
  count: 1,
  hasWidgets: false,
  hasThunks: false,
  hooks: undefined,
  descendantHooks: false }
```

Or `React.createElement`:

```javascript
result = toHyperscript(tree, React.createElement);
```

Yields:

```js
{ '$$typeof': Symbol(react.element),
  type: 'a',
  key: null,
  ref: null,
  props:
   { href: 'http://alpha.com',
     id: 'bravo',
     className: 'charlie delta',
     download: true,
     children: [ 'Echo' ] },
  _owner: null,
  _store: {} }
```

## API

### `toHyperscript(node, h)`

Convert a [HAST][] [Node][node] to another virtual node through
a hyperscript compatible interface such as [virtual dom][vdom],
[`React.createElement`][react], or [hyperscript][].

Note that, although the signatures of the above mentioned “compatible”
interfaces are the same, they differ in how they handle text or
properties.  Other “compatible” interfaces might not be “compatible”.

**Parameters**:

*   `node` (HAST [`Node`][node]) — Node to convert;
*   `h` (`Function`) — Hyperscript compatible interface.

**Returns**: `Array|Object?` — A node, created through invoking `h()`.
`undefined` is returned if the given HAST node is neither element nor
text (such as comments, character-data, or doctypes).
[Root][] nodes result in `Array.<Object>`.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://img.shields.io/travis/wooorm/hast-to-hyperscript.svg

[build-page]: https://travis-ci.org/wooorm/hast-to-hyperscript

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/hast-to-hyperscript.svg

[coverage-page]: https://codecov.io/github/wooorm/hast-to-hyperscript?branch=master

[npm]: https://docs.npmjs.com/cli/install

[releases]: https://github.com/wooorm/hast-to-hyperscript/releases

[license]: LICENSE

[author]: http://wooorm.com

[hast]: https://github.com/wooorm/hast

[node]: https://github.com/wooorm/hast#node

[root]: https://github.com/wooorm/hast#root

[hyperscript]: https://github.com/dominictarr/hyperscript

[vdom]: https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript

[react]: https://facebook.github.io/react/docs/top-level-api.html#react.createelement
