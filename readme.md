# hast-to-hyperscript

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[hast][] utility to turn hast into React, Preact, Vue, etc.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`toH(h, tree[, options|prefix])`](#tohh-tree-optionsprefix)
    *   [`function h(name, props, children)`](#function-hname-props-children)
*   [Examples](#examples)
    *   [Example: React](#example-react)
    *   [Example: Preact](#example-preact)
    *   [Example: Vue](#example-vue)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a utility that can be used to turn hast into something else
through a “hyperscript” interface.

[`hyperscript`][hyperscript] is a rather old package that made HTML from
JavaScript and its API was later modelled by `createElement` from
[`react`][react] (and [`preact`][preact]) and `h` from
`hyperscript`, [`virtual-dom`][virtual-dom] (and [`vue`][vue]).

This package uses that API to translate between hast and anything else.

## When should I use this?

you can use this utility when you need to turn hast into something else,
either through a “hyperscript” interface that already exists (`createElement`
from `react` and `preact` or `h` from `hyperscript`, `virtual-dom`, `vue`),
or through such a translation function that you make yourself.

## Install

This package is [ESM only][esm].
In Node.js (version 12.20+, 14.14+, or 16.0+), install with [npm][]:

```sh
npm install hast-to-hyperscript
```

In Deno with [`esm.sh`][esmsh]:

```js
import {toH} from 'https://esm.sh/hast-to-hyperscript@10'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {toH} from 'https://esm.sh/hast-to-hyperscript@10?bundle'
</script>
```

## Use

```js
import {toH} from 'hast-to-hyperscript'
import h from 'hyperscript'

const tree = {
  type: 'element',
  tagName: 'p',
  properties: {id: 'alpha', className: ['bravo']},
  children: [
    {type: 'text', value: 'charlie '},
    {
      type: 'element',
      tagName: 'strong',
      properties: {style: 'color: red;'},
      children: [{type: 'text', value: 'delta'}]
    },
    {type: 'text', value: ' echo.'}
  ]
}

// Transform (`hyperscript` needs `outerHTML` to serialize):
const doc = toH(h, tree).outerHTML

console.log(doc)
```

Yields:

```html
<p class="bravo" id="alpha">charlie <strong>delta</strong> echo.</p>
```

## API

This package exports the identifiers `toH`.
There is no default export.

### `toH(h, tree[, options|prefix])`

turn hast into React, Preact, Vue, etc.

###### Parameters

*   `h` ([`Function`][h]) — hyperscript function
*   `tree` ([`Node`][node]) — tree to transform
*   `prefix` — treated as `{prefix: prefix}`
*   `options.prefix` (`string` or `boolean`, optional)
    — prefix to use as a prefix for keys passed in `props` to `h()`,
    this behavior is turned off by passing `false` and turned on by passing
    a `string`.
    By default, `h-` is used as a prefix if the given `h` is detected as being
    `virtual-dom/h` or `React.createElement`
*   `options.space` (enum, `'svg'` or `'html'`, default: `'html'`)
    — whether `node` is in the `'html'` or `'svg'` space.
    If an `<svg>` element is found when inside the HTML space, `toH`
    automatically switches to the SVG space when entering the element, and
    switches back when exiting

###### Returns

`*` — Anything returned by calling `h()`.

### `function h(name, props, children)`

Create an element from the given values.

###### Parameters

*   `this` (`Node`) — node that is currently transformed
*   `name` (`string`) — tag name of element to create
*   `props` (`Record<string, string>`) — attributes to set
*   `children` (`Array<any>`) — list of children (results of previously called
    `h()`)

###### Returns

`*` — Anything.

##### Caveats

###### Nodes

Most hyperscript implementations only support elements and texts.
hast supports doctype, comment, and root nodes as well.

*   If anything other than an `element` or `root` node is given, `toH` throws
*   If a `root` is given with no children, an empty `div` element is returned
*   If a `root` is given with one element child, that element is transformed
*   Otherwise, the children are wrapped in a `div` element

If unknown nodes (a node with a type not defined by hast) are found as
descendants of the given tree, they are ignored: only text and element are
transformed.

###### Support

Although there are lots of libraries mentioning support for a hyperscript-like
interface, there are significant differences between them.
For example, [`hyperscript`][hyperscript] doesn’t support classes in `props` and
[`virtual-dom/h`][virtual-dom] needs an `attributes` object inside `props` most
of the time.
`toH` works around these differences for:

*   [`createElement` from `react`][react]
*   `createElement` from Vue 2 and [`h` from `vue` 3+][vue]
*   [`virtual-dom/h`][virtual-dom]
*   [`hyperscript`][hyperscript]

## Examples

### Example: React

```js
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {h} from 'hastscript'
import {toH} from 'hast-util-to-hyperscript'

const tree = h('h1', ['Hello, ', h('em', 'world'), '!'])

console.log(renderToStaticMarkup(toH(createElement, tree)));
```

Yields:

```html
<h1>Hello, <em>world</em>!</h1>
```

### Example: Preact

```js
import {createElement} from 'preact'
import render from 'preact-render-to-string'
import {h} from 'hastscript'
import {toH} from 'hast-util-to-hyperscript'

const tree = h('h1', ['Hello, ', h('em', 'world'), '!'])

console.log(render(toH(createElement, tree)));
```

Yields:

```html
<h1>Hello, <em>world</em>!</h1>
```

### Example: Vue

```js
import * as vue from 'vue'
import serverRenderer from '@vue/server-renderer'
import {h} from 'hastscript'
import {toH} from 'hast-util-to-hyperscript'

const tree = h('h1', ['Hello, ', h('em', 'world'), '!'])

console.log(await serverRenderer.renderToString(
  vue.createSSRApp(() => toH(vue.h, tree))
))
```

Yields:

```html
<h1>Hello, <em>world</em>!</h1>
```

## Types

This package is fully typed with [TypeScript][].
It exports the additional types `CreateElementLike` and `Options`.

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 12.20+, 14.14+, and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Security

Use of `hast-to-hyperscript` can open you up to a
[cross-site scripting (XSS)][xss] attack if the hast tree is unsafe.
Use [`hast-util-sanitize`][hast-util-sanitize] to make the hast tree safe.

## Related

*   [`hastscript`](https://github.com/syntax-tree/hastscript)
    — hyperscript compatible interface for creating nodes
*   [`hast-util-sanitize`][hast-util-sanitize]
    — sanitize nodes
*   [`hast-util-from-dom`](https://github.com/syntax-tree/hast-util-from-dom)
    — transform a DOM tree to hast
*   [`unist-builder`](https://github.com/syntax-tree/unist-builder)
    — create any unist tree
*   [`xastscript`](https://github.com/syntax-tree/xastscript)
    — create a xast tree

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definitions -->

[build-badge]: https://github.com/syntax-tree/hast-to-hyperscript/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/hast-to-hyperscript/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/hast-to-hyperscript.svg

[coverage]: https://codecov.io/github/syntax-tree/hast-to-hyperscript

[downloads-badge]: https://img.shields.io/npm/dm/hast-to-hyperscript.svg

[downloads]: https://www.npmjs.com/package/hast-to-hyperscript

[size-badge]: https://img.shields.io/bundlephobia/minzip/hast-to-hyperscript.svg

[size]: https://bundlephobia.com/result?p=hast-to-hyperscript

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[license]: license

[author]: https://wooorm.com

[health]: https://github.com/syntax-tree/.github

[contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/main/support.md

[coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[hyperscript]: https://github.com/hyperhype/hyperscript

[react]: https://reactjs.org/docs/react-api.html#createelement

[preact]: https://preactjs.com/guide/v8/api-reference/#preacth--preactcreateelement

[virtual-dom]: https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript#hselector-properties-children

[vue]: https://vuejs.org/api/render-function.html#h

[hast]: https://github.com/syntax-tree/hast

[node]: https://github.com/syntax-tree/hast#nodes

[hast-util-sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[h]: #function-hname-props-children
