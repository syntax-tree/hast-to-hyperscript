/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Root} Root
 */

import process from 'node:process'
import test from 'tape'
import {webNamespaces} from 'web-namespaces'
import {u} from 'unist-builder'
import {removePosition} from 'unist-util-remove-position'
import {fromHtml} from 'hast-util-from-html'
import h from 'hyperscript'
import {createElement as r} from 'react'
import {renderToStaticMarkup as rToString} from 'react-dom/server'
import {h as v} from 'virtual-dom'
// @ts-expect-error: hush
import vs from 'virtual-dom/virtual-hyperscript/svg.js'
// @ts-expect-error: hush
import vToString from 'vdom-to-html'
import * as vue from 'vue'
import serverRenderer from '@vue/server-renderer'
import {toH} from './index.js'

test('toHyperscript', (t) => {
  t.equal(typeof toH, 'function', 'should expose a function')

  t.test('should throw if not given h', (t) => {
    t.throws(() => {
      // @ts-expect-error: runtime
      toH(null, u('element', {tagName: ''}, []))
    }, /h is not a function/)

    t.end()
  })

  t.test('should throw if not given a node', (t) => {
    t.throws(() => {
      // @ts-expect-error runtime.
      toH(h)
    }, /Expected root or element, not `undefined`/)

    t.throws(() => {
      toH(h, u('text', 'Alpha'))
    }, /Error: Expected root or element, not `text`/)

    t.throws(() => {
      toH(h, u('text', 'value'))
    }, /Expected root or element/)

    t.end()
  })

  const hast = u('root', [
    u(
      'element',
      {
        tagName: 'h1',
        properties: {id: 'a', className: ['b', 'c'], hidden: true, height: 2}
      },
      [
        u('text', 'bravo '),
        u('comment', 'Hello!'),
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
        u('text', ' delta'),
        u(
          'element',
          {
            tagName: 'input',
            properties: {
              checked: true,
              type: 'file',
              // Known comma-separated lists:
              accept: ['.jpg', '.jpeg']
            }
          },
          []
        )
      ]
    ),
    u(
      'element',
      {
        tagName: 'svg',
        properties: {
          xmlns: 'http://www.w3.org/2000/svg',
          viewBox: [0, 0, 500, 500]
        }
      },
      [
        u(
          'element',
          {tagName: 'circle', properties: {cx: 120, cy: 120, r: 100}},
          []
        )
      ]
    )
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

  t.test('should support `hyperscript`', (t) => {
    // `hyperscript` does not support SVG (camelcased props).
    const baseline = doc.replace(/viewBox/, 'viewbox')
    const actual = toH(h, hast)
    const expected = h('div', [
      h('h1#a.b.c', {hidden: '', attrs: {height: '2'}}, [
        'bravo ',
        h(
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
        h('input', {checked: '', attrs: {type: 'file', accept: '.jpg, .jpeg'}})
      ]),
      h(
        'svg',
        {attrs: {xmlns: 'http://www.w3.org/2000/svg', viewbox: '0 0 500 500'}},
        h('circle', {attrs: {cx: 120, cy: 120, r: 100}}, [])
      )
    ])

    // @ts-expect-error `outerHTML` definitely does exist.
    t.deepEqual(html(actual.outerHTML), html(baseline), 'equal output')

    t.deepEqual(
      html(expected.outerHTML),
      html(baseline),
      'equal output baseline'
    )

    t.end()
  })

  t.test('should support `virtual-dom/h`', (t) => {
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

    t.deepEqual(json(actual), json(expected), 'equal syntax trees')

    t.deepEqual(html(vToString(actual)), html(baseline), 'equal output')

    t.deepEqual(
      html(vToString(expected)),
      html(baseline),
      'equal output baseline'
    )

    t.end()
  })

  t.test('should support `React.createElement` in `development`', (t) => {
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

    t.deepEqual(json(actual), json(expected), 'equal syntax trees')

    t.deepEqual(html(rToString(actual)), html(baseline), 'equal output')

    t.deepEqual(
      html(rToString(expected)),
      html(baseline),
      'equal output baseline'
    )

    process.env.NODE_ENV = currentEnv

    t.end()
  })

  t.test('should support `React.createElement` in `production`', (t) => {
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

    t.deepEqual(json(actual), json(expected), 'equal syntax trees')

    t.deepEqual(html(rToString(actual)), html(baseline), 'equal output')

    t.deepEqual(
      html(rToString(expected)),
      html(baseline),
      'equal output baseline'
    )

    process.env.NODE_ENV = currentEnv
    t.end()
  })

  t.test('should support `Vue`', async (t) => {
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

    t.equal(actual, expected, 'equal output')
  })

  t.test('should support keys', (t) => {
    t.equal(
      // @ts-expect-error Types are wrong.
      toH(h, u('element', {tagName: 'div'}, [])).key,
      undefined,
      'should not patch `keys` normally'
    )

    t.equal(
      // @ts-expect-error Types are wrong.
      toH(h, u('element', {tagName: 'div'}, []), 'prefix-').key,
      'prefix-1',
      'should patch `keys` when given'
    )

    t.equal(
      // @ts-expect-error Types are wrong.
      toH(h, u('element', {tagName: 'div'}, []), true).key,
      'h-1',
      'should patch `keys` when `true`'
    )

    t.equal(
      // @ts-expect-error Types are wrong.
      toH(h, u('element', {tagName: 'div'}, []), false).key,
      undefined,
      'should not patch `keys` when `false`'
    )

    t.equal(
      toH(v, u('element', {tagName: 'div'}, [])).key,
      'h-1',
      'should patch `keys` on vdom'
    )

    t.equal(
      toH(r, u('element', {tagName: 'div'}, [])).key,
      'h-1',
      'should patch `keys` on react'
    )

    t.end()
  })

  t.test('should support style and other funky props', (t) => {
    t.deepEqual(
      vToString(
        toH(
          v,
          u('element', {tagName: 'div', properties: {style: 'color:red'}}, [])
        )
      ),
      '<div style="color: red;"></div>',
      'vdom: should patch a style declaration correctly'
    )

    t.deepEqual(
      toH(
        h,
        u('element', {tagName: 'div', properties: {style: 'color: red'}}, [])
        // @ts-expect-error Types are wrong.
      ).outerHTML,
      '<div style="color:red;"></div>',
      'hyperscript: should parse a style declaration'
    )

    t.deepEqual(
      toH(
        r,
        u('element', {tagName: 'div', properties: {style: 'color: red'}}, [])
      ).props,
      {style: {color: 'red'}},
      'react: should parse a style declaration'
    )

    t.deepEqual(
      toH(
        r,
        u(
          'element',
          {
            tagName: 'div',
            properties: {
              style:
                'color: red; background-color: blue; -moz-transition: initial; -ms-transition: unset'
            }
          },
          []
        )
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

    t.throws(
      () => {
        toH(
          r,
          u(
            'element',
            {tagName: 'div', properties: {style: 'color:red; /*'}},
            []
          )
        )
      },
      /^Error: div\[style]:1:12: End of comment missing$/,
      'react: should ignore invalid style declarations'
    )

    t.deepEqual(
      toH(
        r,
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

    t.end()
  })

  t.test('should support space', (t) => {
    t.equal(
      toH(v, u('element', {tagName: 'div'}, [])).namespace,
      null,
      'should start in HTML'
    )

    t.equal(
      toH(v, u('element', {tagName: 'div'}, []), {space: 'svg'}).namespace,
      webNamespaces.svg,
      'should support `space: "svg"`'
    )

    t.equal(
      toH(v, u('element', {tagName: 'svg'}, [])).namespace,
      webNamespaces.svg,
      'should infer `space: "svg"`'
    )

    t.end()
  })

  t.test('flattens a `root` with one element to that child', (t) => {
    const actual = toH(
      h,
      u('root', [u('element', {tagName: 'h1', properties: {id: 'a'}}, [])])
    )
    const expected = h('h1#a')
    const doc = '<h1 id="a"></h1>'

    // @ts-expect-error seems to exist fine 🤷‍♂️
    t.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    t.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline')
    t.end()
  })

  t.test('flattens a `root` without children to a `div`', (t) => {
    const actual = toH(h, u('root', []))
    const expected = h('div')
    const doc = '<div></div>'

    // @ts-expect-error Types are wrong.
    t.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    t.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline')
    t.end()
  })

  t.test('flattens a `root` with a text child to a `div`', (t) => {
    const actual = toH(h, u('root', [u('text', 'Alpha')]))
    const expected = h('div', 'Alpha')
    const doc = '<div>Alpha</div>'

    // @ts-expect-error Types are wrong.
    t.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    t.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline')
    t.end()
  })

  t.test('flattens a `root` with more children to a `div`', (t) => {
    const actual = toH(
      h,
      u('root', [
        u('element', {tagName: 'h1'}, [u('text', 'Alpha')]),
        u('element', {tagName: 'p'}, [u('text', 'Bravo')])
      ])
    )
    const expected = h('div', [h('h1', 'Alpha'), h('p', 'Bravo')])
    const doc = '<div><h1>Alpha</h1><p>Bravo</p></div>'

    // @ts-expect-error Types are wrong.
    t.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    t.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline')
    t.end()
  })

  t.test('should support mapping to React properties', (t) => {
    const actual = toH(
      r,
      u(
        'element',
        {
          tagName: 'svg',
          properties: {xmlnsXLink: 'http://www.w3.org/1999/xlink'}
        },
        [u('element', {tagName: 'line', properties: {strokeDashArray: 4}}, [])]
      )
    )
    const expected = r(
      'svg',
      {
        key: 'h-1',
        xmlnsXlink: 'http://www.w3.org/1999/xlink'
      },
      [
        r('line', {
          key: 'h-2',
          strokeDasharray: 4
        })
      ]
    )

    t.deepEqual(json(actual), json(expected), 'equal syntax trees')
    t.end()
  })

  t.test('should use a node as a rendering context', (t) => {
    /**
     * @this {Element}
     */
    function mockR() {
      return {node: this}
    }

    const node = u(
      'element',
      {
        tagName: 'svg',
        properties: {xmlnsXLink: 'http://www.w3.org/1999/xlink'}
      },
      [u('element', {tagName: 'line', properties: {strokeDashArray: 4}}, [])]
    )
    const actual = toH(mockR, node)

    t.equal(actual.node, node, 'equal rendering context')
    t.end()
  })

  t.end()
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
