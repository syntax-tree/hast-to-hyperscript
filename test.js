/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Root} Root
 */

import assert from 'node:assert/strict'
import process from 'node:process'
import test from 'node:test'
import {webNamespaces} from 'web-namespaces'
import {u} from 'unist-builder'
import {removePosition} from 'unist-util-remove-position'
import {fromHtml} from 'hast-util-from-html'
import hyperscript from 'hyperscript'
import {createElement as r} from 'react'
import {renderToStaticMarkup as rToString} from 'react-dom/server'
import {h, s} from 'hastscript'
import {h as v} from 'virtual-dom'
// @ts-expect-error: hush
import vs from 'virtual-dom/virtual-hyperscript/svg.js'
// @ts-expect-error: hush
import vToString from 'vdom-to-html'
import * as vue from 'vue'
import serverRenderer from '@vue/server-renderer'
import {toH} from './index.js'

test('toHyperscript', async (t) => {
  assert.equal(typeof toH, 'function', 'should expose a function')

  assert.throws(
    () => {
      // @ts-expect-error: runtime
      toH(null, h())
    },
    /h is not a function/,
    'should throw if not given h'
  )

  assert.throws(
    () => {
      // @ts-expect-error runtime.
      toH(hyperscript)
    },
    /Expected root or element, not `undefined`/,
    'should throw if not given a node (1)'
  )

  assert.throws(
    () => {
      toH(hyperscript, u('text', 'Alpha'))
    },
    /Error: Expected root or element, not `text`/,
    'should throw if not given a node (2)'
  )

  assert.throws(
    () => {
      toH(hyperscript, u('text', 'value'))
    },
    /Expected root or element/,
    'should throw if not given a node (3)'
  )

  const hast = h(null, [
    h('h1', {id: 'a', className: ['b', 'c'], hidden: true, height: 2}, [
      'bravo ',
      u('comment', 'Hello!'),
      // Note: here we manually generate an `element`, to force properties.
      u(
        'element',
        {
          tagName: 'strong',
          properties: {
            style: 'color: red',
            // Unknown booleans are ignored.
            ignored: false,
            // Falsey known booleans are ignored.
            disabled: 0,
            // Unknown props are left as-is.
            foo: 'bar',
            // Unknown lists are space-separated.
            camelCase: ['on', 'off'],
            // Data properties.
            dataSome: 'yes',
            // Numeric-start data properties.
            data123: '456',
            // ARIA props.
            ariaValuenow: '1'
          }
        },
        [u('text', 'charlie')]
      ),
      ' delta',
      h('input', {
        checked: true,
        type: 'file',
        // Known comma-separated lists:
        accept: ['.jpg', '.jpeg']
      })
    ]),
    s('svg', {xmlns: 'http://www.w3.org/2000/svg', viewBox: [0, 0, 500, 500]}, [
      s('circle', {cx: 120, cy: 120, r: 100})
    ])
  ])

  const doc = [
    '<div>',
    '<h1',
    ' id="a"',
    ' class="b c"',
    ' hidden',
    ' height="2"',
    '>bravo ',
    '<strong',
    ' style="color:red;"',
    ' foo="bar"',
    ' camelCase="on off"',
    ' data-123="456"',
    ' data-some="yes"',
    ' aria-valuenow="1"',
    '>charlie</strong> ',
    'delta',
    '<input checked type="file" accept=".jpg, .jpeg">',
    '</h1>',
    '<svg',
    ' xmlns="http://www.w3.org/2000/svg"',
    ' viewBox="0 0 500 500"',
    '>',
    '<circle',
    ' cx="120"',
    ' cy="120"',
    ' r="100"',
    '>',
    '</circle>',
    '</svg>',
    '</div>'
  ].join('')

  await t.test('should support `hyperscript`', () => {
    // `hyperscript` does not support SVG (camelcased props).
    const baseline = doc.replace(/viewBox/, 'viewbox')
    const actual = toH(hyperscript, hast)
    const expected = hyperscript('div', [
      hyperscript('h1#a.b.c', {hidden: '', attrs: {height: '2'}}, [
        'bravo ',
        hyperscript(
          'strong',
          {
            style: {color: 'red'},
            'data-123': '456',
            'data-some': 'yes',
            attrs: {foo: 'bar', camelCase: 'on off', 'aria-valuenow': '1'}
          },
          'charlie'
        ),
        ' delta',
        hyperscript('input', {
          checked: '',
          attrs: {type: 'file', accept: '.jpg, .jpeg'}
        })
      ]),
      hyperscript(
        'svg',
        {attrs: {xmlns: 'http://www.w3.org/2000/svg', viewbox: '0 0 500 500'}},
        hyperscript('circle', {attrs: {cx: 120, cy: 120, r: 100}}, [])
      )
    ])

    // @ts-expect-error `outerHTML` definitely does exist.
    assert.deepEqual(html(actual.outerHTML), html(baseline), 'equal output')

    assert.deepEqual(
      html(expected.outerHTML),
      html(baseline),
      'equal output baseline'
    )
  })

  await t.test('should support `virtual-dom/h`', () => {
    const baseline = doc.replace(/color:red;/, 'color: red;')
    /** @type {ReturnType<v>} */
    const actual = toH(v, hast)
    const expected = v('div', {key: 'h-1'}, [
      v(
        'h1',
        {
          key: 'h-2',
          // @ts-expect-error Works fine.
          attributes: {id: 'a', class: 'b c', hidden: true, height: 2}
        },
        [
          'bravo ',
          v(
            'strong',
            {
              key: 'h-3',
              style: {color: 'red'},
              attributes: {
                'aria-valuenow': '1',
                foo: 'bar',
                camelCase: 'on off',
                'data-123': '456',
                'data-some': 'yes'
              }
            },
            'charlie'
          ),
          ' delta',
          v(
            'input',
            {
              key: 'h-4',
              checked: true,
              attributes: {type: 'file', accept: '.jpg, .jpeg'}
            },
            []
          )
        ]
      ),
      vs(
        'svg',
        {
          key: 'h-5',
          namespace: webNamespaces.svg,
          attributes: {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 500 500'
          }
        },
        [
          vs('circle', {
            key: 'h-6',
            namespace: webNamespaces.svg,
            attributes: {cx: 120, cy: 120, r: 100}
          })
        ]
      )
    ])

    assert.deepEqual(json(actual), json(expected), 'equal syntax trees')
    assert.deepEqual(html(vToString(actual)), html(baseline), 'equal output')
    assert.deepEqual(
      html(vToString(expected)),
      html(baseline),
      'equal output baseline'
    )
  })

  await t.test('should support `React.createElement` in `development`', () => {
    const currentEnv = process.env.NODE_ENV
    const baseline = doc.replace(/color:red;/, 'color:red')
    process.env.NODE_ENV = 'development'

    const actual = toH(r, hast)
    const expected = r(
      'div',
      {key: 'h-1'},
      r(
        'h1',
        {
          key: 'h-2',
          id: 'a',
          className: 'b c',
          hidden: true,
          height: 2
        },
        'bravo ',
        r(
          'strong',
          {
            key: 'h-3',
            style: {color: 'red'},
            ignored: false,
            disabled: 0,
            foo: 'bar',
            camelCase: 'on off',
            'data-123': '456',
            'data-some': 'yes',
            'aria-valuenow': '1'
          },
          ['charlie']
        ),
        ' delta',
        r('input', {
          key: 'h-4',
          checked: true,
          type: 'file',
          accept: '.jpg, .jpeg'
        })
      ),
      r(
        'svg',
        {
          key: 'h-5',
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: '0 0 500 500'
        },
        [r('circle', {key: 'h-6', cx: 120, cy: 120, r: 100})]
      )
    )

    assert.deepEqual(json(actual), json(expected), 'equal syntax trees')

    assert.deepEqual(html(rToString(actual)), html(baseline), 'equal output')

    assert.deepEqual(
      html(rToString(expected)),
      html(baseline),
      'equal output baseline'
    )

    process.env.NODE_ENV = currentEnv
  })

  await t.test('should support `React.createElement` in `production`', () => {
    const currentEnv = process.env.NODE_ENV
    const baseline = doc.replace(/color:red;/, 'color:red')
    process.env.NODE_ENV = 'production'

    const actual = toH(r, hast)
    const expected = r(
      'div',
      {key: 'h-1'},
      r(
        'h1',
        {
          key: 'h-2',
          id: 'a',
          className: 'b c',
          hidden: true,
          height: 2
        },
        'bravo ',
        r(
          'strong',
          {
            key: 'h-3',
            style: {color: 'red'},
            ignored: false,
            disabled: 0,
            foo: 'bar',
            camelCase: 'on off',
            'data-123': '456',
            'data-some': 'yes',
            'aria-valuenow': '1'
          },
          ['charlie']
        ),
        ' delta',
        r('input', {
          key: 'h-4',
          checked: true,
          type: 'file',
          accept: '.jpg, .jpeg'
        })
      ),
      r(
        'svg',
        {
          key: 'h-5',
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: '0 0 500 500'
        },
        [r('circle', {key: 'h-6', cx: 120, cy: 120, r: 100})]
      )
    )

    assert.deepEqual(json(actual), json(expected), 'equal syntax trees')

    assert.deepEqual(html(rToString(actual)), html(baseline), 'equal output')

    assert.deepEqual(
      html(rToString(expected)),
      html(baseline),
      'equal output baseline'
    )

    process.env.NODE_ENV = currentEnv
  })

  await t.test('should support `Vue`', async () => {
    const h = vue.h
    const actual = await serverRenderer.renderToString(
      vue.createSSRApp(() => toH(h, hast))
    )
    const expected = await serverRenderer.renderToString(
      vue.createSSRApp(() => {
        return h('div', {key: 'h-1', attrs: {'data-server-rendered': 'true'}}, [
          h(
            'h1',
            {
              key: 'h-2',
              id: 'a',
              class: 'b c',
              hidden: true,
              height: 2
            },
            [
              'bravo ',
              h(
                'strong',
                {
                  key: 'h-3',
                  style: 'color: red',
                  ignored: false,
                  foo: 'bar',
                  camelCase: 'on off',
                  'data-some': 'yes',
                  'data-123': '456',
                  'aria-valuenow': '1'
                },
                ['charlie']
              ),
              ' delta',
              h('input', {
                key: 'h-4',
                checked: true,
                type: 'file',
                accept: '.jpg, .jpeg'
              })
            ]
          ),
          h(
            'svg',
            {
              key: 'h-5',
              xmlns: 'http://www.w3.org/2000/svg',
              viewBox: '0 0 500 500'
            },
            [h('circle', {key: 'h-6', cx: 120, cy: 120, r: 100})]
          )
        ])
      })
    )

    assert.equal(actual, expected, 'equal output')
  })

  await t.test('should support keys', () => {
    assert.equal(
      // @ts-expect-error Types are wrong.
      toH(hyperscript, h('div')).key,
      undefined,
      'should not patch `keys` normally'
    )

    assert.equal(
      // @ts-expect-error Types are wrong.
      toH(hyperscript, h('div'), 'prefix-').key,
      'prefix-1',
      'should patch `keys` when given'
    )

    assert.equal(
      // @ts-expect-error Types are wrong.
      toH(hyperscript, h('div'), true).key,
      'h-1',
      'should patch `keys` when `true`'
    )

    assert.equal(
      // @ts-expect-error Types are wrong.
      toH(hyperscript, h('div'), false).key,
      undefined,
      'should not patch `keys` when `false`'
    )

    assert.equal(toH(v, h('div')).key, 'h-1', 'should patch `keys` on vdom')

    assert.equal(toH(r, h('div')).key, 'h-1', 'should patch `keys` on react')
  })

  await t.test('should support style and other funky props', () => {
    assert.deepEqual(
      vToString(toH(v, h('div', {style: 'color:red'}))),
      '<div style="color: red;"></div>',
      'vdom: should patch a style declaration correctly'
    )

    assert.deepEqual(
      toH(
        hyperscript,
        h('div', {style: 'color: red'})
        // @ts-expect-error Types are wrong.
      ).outerHTML,
      '<div style="color:red;"></div>',
      'hyperscript: should parse a style declaration'
    )

    assert.deepEqual(
      toH(r, h('div', {style: 'color: red'})).props,
      {style: {color: 'red'}},
      'react: should parse a style declaration'
    )

    assert.deepEqual(
      toH(
        r,
        h('div', {
          style:
            'color: red; background-color: blue; -moz-transition: initial; -ms-transition: unset'
        })
      ).props,
      {
        style: {
          color: 'red',
          backgroundColor: 'blue',
          msTransition: 'unset',
          MozTransition: 'initial'
        }
      },
      'react: should parse vendor prefixed in style declarations'
    )

    assert.throws(
      () => {
        toH(r, h('div', {style: 'color:red; /*'}))
      },
      /^Error: div\[style]:1:12: End of comment missing$/,
      'react: should ignore invalid style declarations'
    )

    assert.deepEqual(
      toH(
        r,
        // Important manual field names.
        u(
          'element',
          {
            tagName: 'div',
            properties: {
              foo: 'bar',
              camelCase: 'on off',
              'data-123': '456',
              'data-some': 'yes',
              'aria-valuenow': '1'
            }
          },
          []
        )
      ).props,
      {
        foo: 'bar',
        camelCase: 'on off',
        'data-123': '456',
        'data-some': 'yes',
        'aria-valuenow': '1'
      },
      'react: should transform unknown props to camelCase except for data and aria'
    )
  })

  await t.test('should support space', () => {
    assert.equal(toH(v, h('div')).namespace, null, 'should start in HTML')

    assert.equal(
      toH(v, h('div'), {space: 'svg'}).namespace,
      webNamespaces.svg,
      'should support `space: "svg"`'
    )

    assert.equal(
      toH(v, s('svg')).namespace,
      webNamespaces.svg,
      'should infer `space: "svg"`'
    )
  })

  await t.test('flattens a `root` with one element to that child', () => {
    const actual = toH(hyperscript, h(null, [h('h1', {id: 'a'})]))
    const expected = hyperscript('h1#a')
    const doc = '<h1 id="a"></h1>'

    // @ts-expect-error seems to exist fine 🤷‍♂️
    assert.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    assert.deepEqual(
      html(expected.outerHTML),
      html(doc),
      'equal output baseline'
    )
  })

  await t.test('flattens a `root` without children to a `div`', () => {
    const actual = toH(hyperscript, h(null))
    const expected = hyperscript('div')
    const doc = '<div></div>'

    // @ts-expect-error Types are wrong.
    assert.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    assert.deepEqual(
      html(expected.outerHTML),
      html(doc),
      'equal output baseline'
    )
  })

  await t.test('flattens a `root` with a text child to a `div`', () => {
    const actual = toH(hyperscript, h(null, 'Alpha'))
    const expected = hyperscript('div', 'Alpha')
    const doc = '<div>Alpha</div>'

    // @ts-expect-error Types are wrong.
    assert.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    assert.deepEqual(
      html(expected.outerHTML),
      html(doc),
      'equal output baseline'
    )
  })

  await t.test('flattens a `root` with more children to a `div`', () => {
    const actual = toH(
      hyperscript,
      h(null, [h('h1', 'Alpha'), h('p', 'Bravo')])
    )
    const expected = hyperscript('div', [
      hyperscript('h1', 'Alpha'),
      hyperscript('p', 'Bravo')
    ])
    const doc = '<div><h1>Alpha</h1><p>Bravo</p></div>'

    // @ts-expect-error Types are wrong.
    assert.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    assert.deepEqual(
      html(expected.outerHTML),
      html(doc),
      'equal output baseline'
    )
  })

  await t.test('should support mapping to React properties', () => {
    const actual = toH(
      r,
      s('svg', {xmlnsXLink: 'http://www.w3.org/1999/xlink'}, [
        s('line', {strokeDashArray: 4}, [])
      ])
    )
    const expected = r(
      'svg',
      {key: 'h-1', xmlnsXlink: 'http://www.w3.org/1999/xlink'},
      [r('line', {key: 'h-2', strokeDasharray: 4})]
    )

    assert.deepEqual(json(actual), json(expected), 'equal syntax trees')
  })

  await t.test('should use a node as a rendering context', () => {
    const node = h('svg', {xmlnsXLink: 'http://www.w3.org/1999/xlink'}, [
      h('line', {strokeDashArray: 4})
    ])
    const actual = toH(
      /** @this {Element} */
      function () {
        return {node: this}
      },
      node
    )

    assert.equal(actual.node, node, 'equal rendering context')
  })
})

/**
 * @param {string} doc
 * @returns {Root}
 */
function html(doc) {
  const tree = fromHtml(doc, {fragment: true})
  removePosition(tree, true)
  return tree
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function json(value) {
  return JSON.parse(JSON.stringify(value))
}
