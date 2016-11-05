'use strict';

/* Dependencies. */
var test = require('tape');
var u = require('unist-builder');
var h = require('hyperscript');
var v = require('virtual-dom/h');
var r = require('react').createElement;
var circular = require('circular.js');
var toH = require('../hast-to-hyperscript/index.js');

/* Tests. */
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
    }, /Expected element, not `undefined`/);

    t.throws(function () {
      toH(h, 'text');
    }, /Error: Expected element, not `text`/);

    t.throws(function () {
      toH(h, u('text', 'value'));
    }, /Expected element/);

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
        // unknown booleans are ignored.
        ignored: false,
        // falsey known booleans are ignore.
        disabled: 0,
        // Unknown props are dash-cased.
        // Unknown lists are space-separated.
        camelCase: ['on', 'off'],
        // Known comma-separated lists:
        accept: ['.jpg', '.jpeg']
      }
    }, [u('text', 'charlie')]),
    u('text', ' delta')
  ]);

  t.deepEqual(
    clean(toH(h, hast)),
    clean(h('h1#a.b.c', {hidden: '', height: '2'}, [
      'bravo ',
      h('strong', {
        style: {color: 'red'},
        'camel-case': 'on off',
        accept: '.jpg, .jpeg'
      }, 'charlie'),
      ' delta'
    ])),
    'should support `hyperscript`'
  );

  t.deepEqual(
    clean(toH(v, hast)),
    clean(v('h1#a.b.c', {
      key: 'h-1',
      attributes: {hidden: '', height: '2'}
    }, [
      'bravo ',
      v('strong', {
        key: 'h-2',
        style: 'color: red',
        accept: '.jpg, .jpeg',
        attributes: {'camel-case': 'on off'}
      }, 'charlie'),
      ' delta'
    ])),
    'should support `virtual-dom/h`'
  );

  t.deepEqual(
    clean(toH(r, hast)),
    clean(r(
      'h1',
      {
        key: 'h-1',
        id: 'a',
        className: 'b c',
        hidden: '',
        height: '2'
      },
      'bravo ',
      r('strong', {
        key: 'h-2',
        style: 'color: red',
        'camel-case': 'on off',
        accept: '.jpg, .jpeg'
      }, ['charlie']),
      ' delta'
    )),
    'should support `React.createElement`'
  );

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

    st.end();
  });

  t.end();
});

/** Clean. */
function clean(node) {
  return JSON.parse(JSON.stringify(node, circular()));
}
