'use strict';

var test = require('tape');
var u = require('unist-builder');
var h = require('hyperscript');
var v = require('virtual-dom/h');
var r = require('react').createElement;
var rehype = require('rehype');
var vToString = require('vdom-to-html');
var rToString = require('react-dom/server').renderToStaticMarkup;
var toH = require('./');

var processor = rehype().data('settings', {fragment: true, position: false});

test('hast-to-hyperscript', function (t) {
  var hast;

  t.equal(typeof toH, 'function', 'should expose a function');

  t.test('should throw if not given h', function (st) {
    t.throws(function () {
      toH(null, u('element'));
    }, /h is not a function/);

    st.end();
  });

  t.test('should throw if not given a node', function (st) {
    t.throws(function () {
      toH(h);
    }, /Expected root or element, not `undefined`/);

    t.throws(function () {
      toH(h, u('text', 'Alpha'));
    }, /Error: Expected root or element, not `text`/);

    t.throws(function () {
      toH(h, u('text', 'value'));
    }, /Expected root or element/);

    st.end();
  });

  hast = u('element', {
    tagName: 'h1',
    properties: {id: 'a', className: ['b', 'c'], hidden: true, height: 2}
  }, [
    u('text', 'bravo '),
    u('comment', 'Hello!'),
    u('element', {
      tagName: 'strong',
      properties: {
        style: 'color: red',
        // Unknown booleans are ignored.
        ignored: false,
        // Falsey known booleans are ignore.
        disabled: 0,
        // Unknown props are dash-cased.
        // Unknown lists are space-separated.
        camelCase: ['on', 'off'],
        // Data properties.
        dataSome: 'yes',
        // ARIA props.
        ariaValuenow: '1'
      }
    }, [u('text', 'charlie')]),
    u('text', ' delta'),
    u('element', {
      tagName: 'input',
      properties: {
        type: 'file',
        // Known comma-separated lists:
        accept: ['.jpg', '.jpeg']
      }
    }, [])
  ]);

  var doc = [
    '<h1',
    ' id="a"',
    ' class="b c"',
    ' hidden',
    ' height="2"',
    '>bravo ',
    '<strong',
    ' style="color:red;"',
    ' camel-case="on off"',
    ' data-some="yes"',
    ' aria-valuenow="1"',
    '>charlie</strong> ',
    'delta',
    '<input type="file" accept=".jpg, .jpeg">',
    '</h1>'
  ].join('');

  t.test('should support `hyperscript`', function (st) {
    var actual = toH(h, hast);
    var expected = h('h1#a.b.c', {hidden: '', attrs: {height: '2'}}, [
      'bravo ',
      h('strong', {
        style: {color: 'red'},
        'data-some': 'yes',
        attrs: {
          'camel-case': 'on off',
          'aria-valuenow': '1'
        }
      }, 'charlie'),
      ' delta',
      h('input', {type: 'file', accept: '.jpg, .jpeg'})
    ]);

    st.deepEqual(html(actual.outerHTML), html(doc), 'equal output');
    st.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline');
    st.end();
  });

  t.test('should support `virtual-dom/h`', function (st) {
    var baseline = doc.replace(/color:red;/, 'color: red');
    var actual = toH(v, hast);
    var expected = v('h1#a.b.c', {key: 'h-1', attributes: {hidden: true, height: 2}}, [
      'bravo ',
      v('strong', {
        key: 'h-2',
        attributes: {
          'aria-valuenow': '1',
          'camel-case': 'on off',
          'data-some': 'yes',
          style: 'color: red'
        }
      }, 'charlie'),
      ' delta',
      v('input', {
        key: 'h-3',
        type: 'file',
        accept: '.jpg, .jpeg'
      })
    ]);

    st.deepEqual(html(vToString(actual)), html(baseline), 'equal output');
    st.deepEqual(html(vToString(expected)), html(baseline), 'equal output baseline');
    st.end();
  });

  t.test('should support `React.createElement` in `development`', function (st) {
    var currentEnv = process.env.NODE_ENV;
    var baseline = doc.replace(/color:red;/, 'color:red').replace(/camel-case/, 'camelCase');
    process.env.NODE_ENV = 'development';

    var actual = toH(r, hast);
    var expected = r(
      'h1',
      {
        key: 'h-1',
        id: 'a',
        className: 'b c',
        hidden: true,
        height: 2
      },
      'bravo ',
      r('strong', {
        key: 'h-2',
        style: {color: 'red'},
        camelCase: 'on off',
        'data-some': 'yes',
        'aria-valuenow': '1'
      }, ['charlie']),
      ' delta',
      r('input', {
        key: 'h-3',
        type: 'file',
        accept: '.jpg, .jpeg'
      })
    );

    st.deepEqual(html(rToString(actual)), html(baseline), 'equal output');
    st.deepEqual(html(rToString(expected)), html(baseline), 'equal output baseline');
    process.env.NODE_ENV = currentEnv;
    st.end();
  });

  t.test('should support `React.createElement` in `production`', function (st) {
    var currentEnv = process.env.NODE_ENV;
    var baseline = doc.replace(/color:red;/, 'color:red').replace(/camel-case/, 'camelCase');
    process.env.NODE_ENV = 'production';

    var actual = toH(r, hast);
    var expected = r(
      'h1',
      {
        key: 'h-1',
        id: 'a',
        className: 'b c',
        hidden: true,
        height: 2
      },
      'bravo ',
      r('strong', {
        key: 'h-2',
        style: {color: 'red'},
        camelCase: 'on off',
        'data-some': 'yes',
        'aria-valuenow': '1'
      }, ['charlie']),
      ' delta',
      r('input', {
        key: 'h-3',
        type: 'file',
        accept: '.jpg, .jpeg'
      })
    );

    st.deepEqual(html(rToString(actual)), html(baseline), 'equal output');
    st.deepEqual(html(rToString(expected)), html(baseline), 'equal output baseline');
    process.env.NODE_ENV = currentEnv;
    st.end();
  });

  t.test('should support keys', function (st) {
    st.equal(
      toH(h, u('element', {tagName: 'div'})).key,
      undefined,
      'should not patch `keys` normally'
    );

    st.equal(
      toH(h, u('element', {tagName: 'div'}), 'prefix-').key,
      'prefix-1',
      'should patch `keys` when given'
    );

    st.equal(
      toH(v, u('element', {tagName: 'div'})).key,
      'h-1',
      'should patch `keys` on vdom'
    );

    st.equal(
      toH(r, u('element', {tagName: 'div'})).key,
      'h-1',
      'should patch `keys` on react'
    );

    st.deepEqual(
      toH(v, u('element', {tagName: 'div', properties: {style: 'color: red'}})).properties.attributes.style,
      'color: red',
      'vdom: should patch a style declaration correctly'
    );

    st.deepEqual(
      toH(r, u('element', {tagName: 'div', properties: {style: 'color: red'}})).props.style,
      {color: 'red'},
      'react: should parse a style declaration'
    );

    st.deepEqual(
      toH(r, u('element', {tagName: 'div', properties: {
        style: 'color: red; background-color: blue; -moz-transition: initial; -ms-transition: unset'
      }})).props.style,
      {
        color: 'red',
        backgroundColor: 'blue',
        msTransition: 'unset',
        MozTransition: 'initial'
      },
      'react: should parse vendor prefixed in style declarations'
    );

    st.deepEqual(
      toH(r, u('element', {tagName: 'div', properties: {style: '; color; border: 1;'}})).props.style,
      {border: '1'},
      'react: should parse an invalid style declaration'
    );

    st.deepEqual(
      toH(r, u('element', {tagName: 'div', properties: {
        'camel-case': 'on off',
        'data-some': 'yes',
        'aria-valuenow': '1'
      }})).props,
      {
        camelCase: 'on off',
        'data-some': 'yes',
        'aria-valuenow': '1'
      },
      'react: should transform unknown props to camelCase except for data and aria'
    );

    st.end();
  });

  t.test('flattens a `root` with one element child to that child', function (st) {
    var actual = toH(h, u('root', [u('element', {tagName: 'h1', properties: {id: 'a'}}, [])]));
    var expected = h('h1#a');
    var doc = '<h1 id="a"></h1>';

    st.deepEqual(html(actual.outerHTML), html(doc), 'equal output');
    st.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline');
    st.end();
  });

  t.test('flattens a `root` without children to a `div`', function (st) {
    var actual = toH(h, u('root', []));
    var expected = h('div');
    var doc = '<div></div>';

    st.deepEqual(html(actual.outerHTML), html(doc), 'equal output');
    st.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline');
    st.end();
  });

  t.test('flattens a `root` with a text child to a `div`', function (st) {
    var actual = toH(h, u('root', [u('text', 'Alpha')]));
    var expected = h('div', 'Alpha');
    var doc = '<div>Alpha</div>';

    st.deepEqual(html(actual.outerHTML), html(doc), 'equal output');
    st.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline');
    st.end();
  });

  t.test('flattens a `root` with more children to a `div`', function (st) {
    var actual = toH(h, u('root', [
      u('element', {tagName: 'h1'}, [u('text', 'Alpha')]),
      u('element', {tagName: 'p'}, [u('text', 'Bravo')])
    ]));
    var expected = h('div', [h('h1', 'Alpha'), h('p', 'Bravo')]);
    var doc = '<div><h1>Alpha</h1><p>Bravo</p></div>';

    st.deepEqual(html(actual.outerHTML), html(doc), 'equal output');
    st.deepEqual(html(expected.outerHTML), html(doc), 'equal output baseline');
    st.end();
  });

  t.end();
});

function html(doc) {
  return processor.parse(doc);
}
