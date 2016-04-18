/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module hast-to-hyperscript
 * @fileoverview Test suite for `hast-to-hyperscript`.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var fs = require('fs');
var path = require('path');
var test = require('tape');
var hast = require('hast');
var h = require('virtual-dom/h');
var isEmpty = require('is-empty');
var html2vdom = require('html-to-vdom');
var vdom2html = require('vdom-to-html');
var React = require('react');
var hyperscript = require('hyperscript');
var toHyperscript = require('..');

/*
 * Methods.
 */

var read = fs.readFileSync;
var basename = path.basename;
var join = path.join;

/*
 * Constants.
 */

var FIXTURES = path.join(__dirname, 'fixture');

/**
 * Normalize html to vdom results to be more like vdom
 * itself.
 *
 * @param {Array.<Node>} nodes - List of virtual nodes.
 */
function normalize(nodes) {
    var length = nodes.length;
    var index = -1;
    var node;

    while (++index < length) {
        node = nodes[index];

        if (node.tagName) {
            node.tagName = node.tagName.toUpperCase();
        }

        if (isEmpty(node.properties)) {
            delete node.properties;
        } else if (isEmpty(node.properties.attributes)) {
            delete node.properties.attributes;
        }

        if (node.children) {
            normalize(node.children);
        }
    }

    return nodes;
}

/*
 * Set-up html to vdom.
 */

html2vdom = html2vdom({
    'VNode': require('virtual-dom/vnode/vnode'),
    'VText': require('virtual-dom/vnode/vtext')
});

/*
 * Tests.
 */

test('hast-to-hyperscript', function (t) {
    t.throws(
        function () {
            toHyperscript({'type': 'text'});
        },
        'Expected `hyperscript`, `virtual-hyperscript`, ' +
        '`React.createElement`, or similar',
        'should throw when not given `h.js`'
    );

    t.throws(
        function () {
            toHyperscript(null, h);
        },
        'Expected node',
        'should throw when not given `node`'
    );

    t.test('text', function (st) {
        st.test('virtual-dom/h', function (sst) {
            var vnode = toHyperscript({
                'type': 'text',
                'value': 'foo'
            }, h);

            sst.equal(
                vnode.type,
                'VirtualText',
                'should have a `VirtualText` type'
            );

            sst.equal(
                vnode.version,
                '2',
                'should have a `2` version'
            );

            sst.end();
        });

        st.test('hyperscript', function (sst) {
            var vnode = toHyperscript({
                'type': 'text',
                'value': 'foo'
            }, hyperscript);

            sst.equal(
                vnode.nodeName,
                '#text',
                'should have a `nodeName` set to `#text`'
            );

            sst.equal(
                vnode.value,
                'foo',
                'should have a `foo` value'
            );

            sst.end();
        });

        st.test('React.createElement', function (sst) {
            var value = toHyperscript({
                'type': 'text',
                'value': 'foo'
            }, React.createElement);

            sst.equal(value, 'foo', 'should be a `string`');

            sst.end();
        });

        st.end();
    });

    t.test('element', function (st) {
        var tree = {
            'type': 'element',
            'tagName': 'a',
            'properties': {
                'className': ['alpha', 'bravo'],
                'id': 'charlie',
                'htmlFor': 'delta',
                'unknown': 'echo',

                // Namespacing:
                'xmlLang': 'en-GB',

                // turned on boolean
                'download': true,

                // turned off boolean
                'itemScope': false,

                // Null
                'itemProp': null,

                // Undefined
                'href': undefined,

                // NaN
                'colSpan': NaN
            },
            'children': []
        };

        st.test('virtual-dom/h', function (sst) {
            var vnode = toHyperscript(tree, h);

            sst.equal(
                vnode.type,
                'VirtualNode',
                'should have a `VirtualNode` type'
            );

            sst.equal(
                vnode.tagName,
                'A',
                'should have a `string` `tagName`'
            );

            sst.equal(
                typeof vnode.properties,
                'object',
                'should have an `object` properties'
            );

            sst.ok(
                Array.isArray(vnode.children),
                'should have a `children` array'
            );

            sst.equal(
                vnode.version,
                '2',
                'should have a `2` version'
            );

            sst.deepEqual(
                vnode.properties,
                {
                    'attributes': {
                        'class': 'alpha bravo',
                        'unknown': 'echo',
                        'xml:lang': 'en-GB'
                    },
                    'download': true,
                    'htmlFor': 'delta',
                    'id': 'charlie'
                },
                'should have properties'
            );

            sst.end();
        });

        st.test('hyperscript', function (sst) {
            var vnode = toHyperscript(tree, hyperscript);

            sst.equal(
                vnode.nodeName,
                'a',
                'should have a `string` `nodeName`'
            );

            sst.equal(
                typeof vnode.classList,
                'object',
                'should have an `object` classList'
            );

            sst.equal(
                typeof vnode.dataset,
                'object',
                'should have an `object` dataset'
            );

            sst.ok(
                Array.isArray(vnode.childNodes),
                'should have a `childNodes` array'
            );

            sst.ok(
                Array.isArray(vnode.attributes),
                'should have a `attributes` array'
            );

            sst.equal(
                vnode.className,
                'alpha bravo',
                'should have `className`s'
            );

            sst.equal(
                vnode.id,
                'charlie',
                'should have `id`'
            );

            sst.equal(
                vnode.htmlFor,
                'delta',
                'should have `htmlFor`'
            );

            sst.equal(
                vnode.download,
                'download',
                'should have `download`'
            );

            sst.equal(
                vnode.unknown,
                'echo',
                'should have `unknown`'
            );

            sst.equal(
                vnode['xml:lang'],
                'en-GB',
                'should have `xml:lang`'
            );

            sst.end();
        });

        st.test('React.createElement', function (sst) {
            var vnode = toHyperscript(tree, React.createElement);

            sst.equal(
                vnode.type,
                'a',
                'should have a `string` `type`'
            );

            sst.equal(
                typeof vnode.props,
                'object',
                'should have an `object` `props`'
            );

            sst.ok(
                Array.isArray(vnode.props.children),
                'should have a `props.children` `array`'
            );

            sst.deepEqual(
                vnode.props,
                {
                    'children': [],
                    'className': 'alpha bravo',
                    'download': true,
                    'htmlFor': 'delta',
                    'id': 'charlie',
                    'unknown': 'echo',
                    'xmlLang': 'en-GB'
                },
                'should have properties'
            );

            sst.end();
        });

        st.end();
    });

    t.test('comment', function (st) {
        var tree = {
            'type': 'comment',
            'value': 'foo'
        };

        st.test('virtual-dom/h', function (sst) {
            sst.equal(
                toHyperscript(tree, h),
                undefined,
                'should ignore comments'
            );

            sst.end();
        });

        st.test('hyperscript', function (sst) {
            sst.equal(
                toHyperscript(tree, hyperscript),
                undefined,
                'should ignore comments'
            );

            sst.end();
        });

        st.test('React.createElement', function (sst) {
            sst.equal(
                toHyperscript(tree, React.createElement),
                undefined,
                'should ignore comments'
            );

            sst.end();
        });

        st.end();
    });

    t.test('directive', function (st) {
        var tree = {
            'type': 'directive',
            'name': '!doctype',
            'value': '!doctype html'
        };

        st.test('virtual-dom/h', function (sst) {
            sst.equal(
                toHyperscript(tree, h),
                undefined,
                'should ignore directives'
            );

            sst.end();
        });

        st.test('hyperscript', function (sst) {
            sst.equal(
                toHyperscript(tree, hyperscript),
                undefined,
                'should ignore directives'
            );

            sst.end();
        });

        st.test('React.createElement', function (sst) {
            sst.equal(
                toHyperscript(tree, React.createElement),
                undefined,
                'should ignore directives'
            );

            sst.end();
        });

        st.end();
    });

    t.test('cdata', function (st) {
        var tree = {
            'type': 'cdata',
            'name': '<delta>Echo</delta>'
        };

        st.test('virtual-dom/h', function (sst) {
            sst.equal(
                toHyperscript(tree, h),
                undefined,
                'should ignore cdata'
            );

            sst.end();
        });

        st.test('hyperscript', function (sst) {
            sst.equal(
                toHyperscript(tree, hyperscript),
                undefined,
                'should ignore cdata'
            );

            sst.end();
        });

        st.test('React.createElement', function (sst) {
            sst.equal(
                toHyperscript(tree, React.createElement),
                undefined,
                'should ignore cdata'
            );

            sst.end();
        });

        st.end();
    });

    t.test('root', function (st) {
        var tree = {
            'type': 'root',
            'children': [
                {
                    'type': 'directive',
                    'name': '!doctype',
                    'value': '!doctype html'
                },
                {
                    'type': 'text',
                    'value': 'foo'
                },
                {
                    'type': 'cdata',
                    'value': '<delta>Echo</delta>'
                },
                {
                    'type': 'comment',
                    'value': 'foo'
                },
                {
                    'type': 'element',
                    'tagName': 'div',
                    'children': []
                }
            ]
        };

        st.test('virtual-dom/h', function (sst) {
            sst.deepEqual(toHyperscript(tree, h), [
                {
                    'text': 'foo'
                },
                {
                    'tagName': 'DIV',
                    'properties': {},
                    'children': [],
                    'key': undefined,
                    'namespace': null,
                    'count': 0,
                    'hasWidgets': false,
                    'hasThunks': false,
                    'hooks': undefined,
                    'descendantHooks': false
                }
            ], 'should ignore invisible children');

            sst.end();
        });

        st.test('hyperscript', function (sst) {
            var result = toHyperscript(tree, hyperscript);

            sst.equal(result.length, 2);

            sst.deepEqual(result[0], {
                'nodeName': '#text',
                'nodeType': 3,
                'parentElement': null,
                'value': 'foo'
            });

            sst.equal(result[1].outerHTML, '<div></div>');

            sst.end();
        });

        st.test('React.createElement', function (sst) {
            var result = toHyperscript(tree, React.createElement);

            sst.deepEqual(JSON.parse(JSON.stringify(result)), [
                'foo',
                {
                    'type': 'div',
                    'ref': null,
                    'props': {
                        'children': []
                    },
                    'key': null,
                    '_store': {},
                    '_owner': null
                }
            ], 'should ignore invisible children');

            sst.end();
        });

        st.end();
    });

    t.end();
});

test('fixtures', function (t) {
    /**
     * Test a fixture.
     *
     * @param {string} filename - File path.
     */
    function subtest(filename) {
        var doc = read(join(FIXTURES, filename), 'utf8');
        var input = toHyperscript(hast.parse(doc), h);
        var output = normalize(html2vdom(doc));

        t.deepEqual(
            input,
            output,
            basename(filename) + ' (tree)'
        );

        t.equal(
            vdom2html(input[0]) + '\n',
            doc,
            basename(filename) + ' (value)'
        );
    }

    fs
        .readdirSync(FIXTURES)
        .forEach(function (filename) {
            if (filename.charAt(0) !== '.') {
                subtest(filename);
            }
        });

    t.end();
});
