'use strict'

var test = require('tape')
var namespaces = require('web-namespaces')
var u = require('unist-builder')
var h = require('hyperscript')
var v = require('virtual-dom/h')
var vs = require('virtual-dom/virtual-hyperscript/svg')
var r = require('react').createElement
var rehype = require('rehype')
var vToString = require('vdom-to-html')
var rToString = require('react-dom/server').renderToStaticMarkup
var Vue = require('vue')
var VueSSR = require('vue-server-renderer')
var toH = require('.')

var processor = rehype().data('settings', {fragment: true, position: false})

test('hast-to-hyperscript', function(t) {
  var hast

  t.equal(typeof toH, 'function', 'should expose a function')

  t.test('should throw if not given h', function(st) {
    t.throws(function() {
      toH(null, u('element'))
    }, /h is not a function/)

    st.end()
  })

  t.test('should throw if not given a node', function(st) {
    t.throws(function() {
      toH(h)
    }, /Expected root or element, not `undefined`/)

    t.throws(function() {
      toH(h, u('text', 'Alpha'))
    }, /Error: Expected root or element, not `text`/)

    t.throws(function() {
      toH(h, u('text', 'value'))
    }, /Expected root or element/)

    st.end()
  })

  hast = u('root', [
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

  var doc = [
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

  t.test('should support `hyperscript`', function(st) {
    // `hyperscript` does not support SVG (camelcased props).
    var baseline = doc.replace(/viewBox/, 'viewbox')
    var actual = toH(h, hast)
    var expected = h('div', [
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

    st.deepEqual(html(actual.outerHTML), html(baseline), 'equal output')

    st.deepEqual(
      html(expected.outerHTML),
      html(baseline),
      'equal output baseline'
    )

    st.end()
  })

  t.test('should support `virtual-dom/h`', function(st) {
    var baseline = doc.replace(/color:red;/, 'color: red')
    var actual = toH(v, hast)
    var expected = v('div', {key: 'h-1'}, [
      v(
        'h1',
        {
          key: 'h-2',
          attributes: {id: 'a', class: 'b c', hidden: true, height: 2}
        },
        [
          'bravo ',
          v(
            'strong',
            {
              key: 'h-3',
              attributes: {
                'aria-valuenow': '1',
                foo: 'bar',
                camelCase: 'on off',
                'data-123': '456',
                'data-some': 'yes',
                style: 'color: red'
              }
            },
            'charlie'
          ),
          ' delta',
          v('input', {
            key: 'h-4',
            checked: true,
            attributes: {type: 'file', accept: '.jpg, .jpeg'}
          })
        ]
      ),
      vs(
        'svg',
        {
          key: 'h-5',
          namespace: namespaces.svg,
          attributes: {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 500 500'
          }
        },
        [
          vs('circle', {
            key: 'h-6',
            namespace: namespaces.svg,
            attributes: {cx: 120, cy: 120, r: 100}
          })
        ]
      )
    ])

    st.deepEqual(json(actual), json(expected), 'equal syntax trees')

    st.deepEqual(html(vToString(actual)), html(baseline), 'equal output')

    st.deepEqual(
      html(vToString(expected)),
      html(baseline),
      'equal output baseline'
    )

    st.end()
  })

  t.test('should support `React.createElement` in `development`', function(st) {
    var currentEnv = process.env.NODE_ENV
    var baseline = doc.replace(/color:red;/, 'color:red')
    process.env.NODE_ENV = 'development'

    var actual = toH(r, hast)
    var expected = r(
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

    st.deepEqual(json(actual), json(expected), 'equal syntax trees')

    st.deepEqual(html(rToString(actual)), html(baseline), 'equal output')

    st.deepEqual(
      html(rToString(expected)),
      html(baseline),
      'equal output baseline'
    )

    process.env.NODE_ENV = currentEnv

    st.end()
  })

  t.test('should support `React.createElement` in `production`', function(st) {
    var currentEnv = process.env.NODE_ENV
    var baseline = doc.replace(/color:red;/, 'color:red')
    process.env.NODE_ENV = 'production'

    var actual = toH(r, hast)
    var expected = r(
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

    st.deepEqual(json(actual), json(expected), 'equal syntax trees')

    st.deepEqual(html(rToString(actual)), html(baseline), 'equal output')

    st.deepEqual(
      html(rToString(expected)),
      html(baseline),
      'equal output baseline'
    )

    process.env.NODE_ENV = currentEnv
    st.end()
  })

  t.test('should support `Vue`', function(st) {
    var baseline = doc.replace(/<div>/, '<div data-server-rendered="true">')
    var actual
    var expected

    st.plan(3)

    Promise.all([vueToString(actualRender), vueToString(expectedRender)])
      .then(function(all) {
        var actualString = all[0]
        var expectedString = all[0]

        st.deepEqual(clean(actual), clean(expected), 'equal syntax trees')
        st.deepEqual(html(actualString), html(baseline), 'equal output')

        st.deepEqual(
          html(expectedString),
          html(baseline),
          'equal output baseline'
        )
      })
      .catch(function(error) {
        st.ifErr(error, 'did not expect an error')
      })

    function actualRender(h) {
      actual = toH(h, hast)
      return actual
    }

    function expectedRender(h) {
      expected = h(
        'div',
        {key: 'h-1', attrs: {'data-server-rendered': 'true'}},
        [
          h(
            'h1',
            {
              key: 'h-2',
              attrs: {
                class: 'b c',
                id: 'a',
                hidden: true,
                height: 2
              }
            },
            [
              'bravo ',
              h(
                'strong',
                {
                  key: 'h-3',
                  style: {color: 'red'},
                  attrs: {
                    foo: 'bar',
                    camelCase: 'on off',
                    'data-123': '456',
                    'data-some': 'yes',
                    'aria-valuenow': '1'
                  }
                },
                ['charlie']
              ),
              ' delta',
              h('input', {
                key: 'h-4',
                attrs: {
                  checked: true,
                  type: 'file',
                  accept: '.jpg, .jpeg'
                }
              })
            ]
          ),
          h(
            'svg',
            {
              key: 'h-5',
              attrs: {
                xmlns: 'http://www.w3.org/2000/svg',
                viewBox: '0 0 500 500'
              }
            },
            [h('circle', {key: 'h-6', attrs: {cx: 120, cy: 120, r: 100}})]
          )
        ]
      )
      return expected
    }

    function identity(value) {
      return value
    }

    function vueToString(render) {
      return VueSSR.createRenderer({template: identity}).renderToString(
        new Vue({render: render}).$mount()
      )
    }

    function clean(node) {
      remove(node)
      return json(node)
    }

    function remove(node) {
      delete node.context
      if (node.children) {
        node.children.forEach(remove)
      }
    }
  })

  t.test('should support keys', function(st) {
    st.equal(
      toH(h, u('element', {tagName: 'div'})).key,
      undefined,
      'should not patch `keys` normally'
    )

    st.equal(
      toH(h, u('element', {tagName: 'div'}), 'prefix-').key,
      'prefix-1',
      'should patch `keys` when given'
    )

    st.equal(
      toH(v, u('element', {tagName: 'div'})).key,
      'h-1',
      'should patch `keys` on vdom'
    )

    st.equal(
      toH(r, u('element', {tagName: 'div'})).key,
      'h-1',
      'should patch `keys` on react'
    )

    st.deepEqual(
      toH(v, u('element', {tagName: 'div', properties: {style: 'color: red'}}))
        .properties.attributes.style,
      'color: red',
      'vdom: should patch a style declaration correctly'
    )

    st.deepEqual(
      toH(r, u('element', {tagName: 'div', properties: {style: 'color: red'}}))
        .props.style,
      {color: 'red'},
      'react: should parse a style declaration'
    )

    st.deepEqual(
      toH(
        r,
        u('element', {
          tagName: 'div',
          properties: {
            style:
              'color: red; background-color: blue; -moz-transition: initial; -ms-transition: unset'
          }
        })
      ).props.style,
      {
        color: 'red',
        backgroundColor: 'blue',
        msTransition: 'unset',
        MozTransition: 'initial'
      },
      'react: should parse vendor prefixed in style declarations'
    )

    st.throws(
      function() {
        toH(
          r,
          u('element', {
            tagName: 'div',
            properties: {style: 'color:red; /*'}
          })
        )
      },
      /^Error: div\[style\]:1:12: End of comment missing$/,
      'react: should ignore invalid style declarations'
    )

    st.deepEqual(
      toH(
        r,
        u('element', {
          tagName: 'div',
          properties: {
            foo: 'bar',
            camelCase: 'on off',
            'data-123': '456',
            'data-some': 'yes',
            'aria-valuenow': '1'
          }
        })
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

    st.end()
  })

  t.test('should support space', function(st) {
    st.equal(
      toH(v, u('element', {tagName: 'div'})).namespace,
      null,
      'should start in HTML'
    )

    st.equal(
      toH(v, u('element', {tagName: 'div'}), {space: 'svg'}).namespace,
      namespaces.svg,
      'should support `space: "svg"`'
    )

    st.equal(
      toH(v, u('element', {tagName: 'svg'})).namespace,
      namespaces.svg,
      'should infer `space: "svg"`'
    )

    st.end()
  })

  t.test('flattens a `root` with one element to that child', function(st) {
    var actual = toH(
      h,
      u('root', [u('element', {tagName: 'h1', properties: {id: 'a'}}, [])])
    )
    var expected = h('h1#a')
    var doc = '<h1 id="a"></h1>'

    st.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    st.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline')
    st.end()
  })

  t.test('flattens a `root` without children to a `div`', function(st) {
    var actual = toH(h, u('root', []))
    var expected = h('div')
    var doc = '<div></div>'

    st.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    st.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline')
    st.end()
  })

  t.test('flattens a `root` with a text child to a `div`', function(st) {
    var actual = toH(h, u('root', [u('text', 'Alpha')]))
    var expected = h('div', 'Alpha')
    var doc = '<div>Alpha</div>'

    st.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    st.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline')
    st.end()
  })

  t.test('flattens a `root` with more children to a `div`', function(st) {
    var actual = toH(
      h,
      u('root', [
        u('element', {tagName: 'h1'}, [u('text', 'Alpha')]),
        u('element', {tagName: 'p'}, [u('text', 'Bravo')])
      ])
    )
    var expected = h('div', [h('h1', 'Alpha'), h('p', 'Bravo')])
    var doc = '<div><h1>Alpha</h1><p>Bravo</p></div>'

    st.deepEqual(html(actual.outerHTML), html(doc), 'equal output')
    st.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline')
    st.end()
  })

  t.test('should support mapping to React properties', function(st) {
    var actual = toH(
      r,
      u(
        'element',
        {
          tagName: 'svg',
          properties: {xmlnsXLink: 'http://www.w3.org/1999/xlink'}
        },
        [
          u('element', {
            tagName: 'line',
            properties: {strokeDashArray: 4}
          })
        ]
      )
    )
    var expected = r(
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

    st.deepEqual(json(actual), json(expected), 'equal syntax trees')
    st.end()
  })

  t.test('should use a node as a rendering context', function(st) {
    function mockR() {
      return {
        node: this
      }
    }

    var node = u(
      'element',
      {
        tagName: 'svg',
        properties: {xmlnsXLink: 'http://www.w3.org/1999/xlink'}
      },
      [
        u('element', {
          tagName: 'line',
          properties: {strokeDashArray: 4}
        })
      ]
    )
    var actual = toH(mockR, node)

    st.equal(actual.node, node, 'equal rendering context')
    st.end()
  })

  t.end()
})

function html(doc) {
  return processor.parse(doc)
}

function json(value) {
  return JSON.parse(JSON.stringify(value))
}
