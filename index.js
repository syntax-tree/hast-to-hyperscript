'use strict';

/* Dependencies. */
var paramCase = require('kebab-case');
var information = require('property-information');
var spaces = require('space-separated-tokens');
var commas = require('comma-separated-tokens');
var nan = require('is-nan');
var is = require('unist-util-is');

/* Expose. */
module.exports = wrapper;

/* Wrapper around `toH`. */
function wrapper(h, node, prefix) {
  if (typeof h !== 'function') {
    throw new Error('h is not a function');
  }

  if (!is('element', node)) {
    throw new Error('Expected element, not `' + node + '`');
  }

  if (prefix === null || prefix === undefined) {
    prefix = react(h) || vdom(h) ? 'h-' : false;
  }

  return toH(h, node, {
    prefix: prefix,
    key: 0,
    react: react(h),
    vdom: vdom(h),
    hyperscript: hyperscript(h)
  });
}

/* Transform a HAST node through a hyperscript interface
 * to *anything*! */
function toH(h, node, ctx) {
  var selector = node.tagName;
  var properties;
  var attributes;
  var children;
  var property;
  var elements;
  var length;
  var index;
  var value;

  properties = node.properties;
  attributes = {};

  for (property in properties) {
    addAttribute(attributes, property, properties[property], ctx);
  }

  if (ctx.vdom) {
    selector = selector.toUpperCase();
  }

  if (ctx.hyperscript && attributes.id) {
    selector += '#' + attributes.id;
    delete attributes.id;
  }

  if ((ctx.hyperscript || ctx.vdom) && attributes.className) {
    selector += '.' + spaces.parse(attributes.className).join('.');
    delete attributes.className;
  }

  if (ctx.prefix) {
    ctx.key++;
    attributes.key = ctx.prefix + ctx.key;
  }

  elements = [];
  children = node.children || [];
  length = children.length;
  index = -1;

  while (++index < length) {
    value = children[index];

    if (is('element', value)) {
      elements.push(toH(h, value, ctx));
    } else if (is('text', value)) {
      elements.push(value.value);
    }
  }

  /* Ensure no React warnings are triggered for
   * void elements having children passed in. */
  if (elements.length === 0) {
    elements = undefined;
  }

  return h(selector, attributes, elements);
}

/* Add `name` and its `value` to `props`. */
function addAttribute(props, name, value, ctx) {
  var info = information(name) || {};

  /* Ignore nully, `false`, `NaN`, and falsey known
   * booleans. */
  if (
    value === null ||
    value === undefined ||
    value === false ||
    nan(value) ||
    (info.boolean && !value)
  ) {
    return;
  }

  name = info.name || paramCase(name);

  if (info.boolean) {
    /* Treat `true` and truthy known booleans. */
    value = '';
  } else if (typeof value === 'object' && 'length' in value) {
    /* Accept `array`.  Most props are space-separater. */
    value = (info.commaSeparated ? commas : spaces).stringify(value);
  }

  value = String(value || '');

  if (
    ctx.vdom &&
    info.name !== 'class' &&
    (info.mustUseAttribute || !info.name)
  ) {
    if (!props.attributes) {
      props.attributes = {};
    }

    props.attributes[name] = value;

    return;
  }

  props[info.propertyName || name] = value;
}

/* Check if `h` is `react.createElement`.  It doesn’t accept
 * `class` as an attribute, it must be added through the
 * `selector`. */
function react(h) {
  var node = h && h('div');
  return node && node._store && node.key === null;
}

/* Check if `h` is `hyperscript`.  It doesn’t accept
 * `class` as an attribute, it must be added through the
 * `selector`. */
function hyperscript(h) {
  return h && h.context && h.cleanup;
}

/**
 * Check if `h` is `virtual-dom/h`.  It’s the only
 * hyperscript “compatible” interface needing `attributes`. */
function vdom(h) {
  try {
    return h('div').type === 'VirtualNode';
  } catch (err) { /* Empty */ }

  /* istanbul ignore next */
  return false;
}
