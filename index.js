/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module hast:to-hyperscript
 * @fileoverview HAST to virtual dom.
 */

'use strict';

/* eslint-env commonjs */

/*
 * Dependencies.
 */

var information = require('property-information');

/*
 * Methods.
 */

var has = Object.prototype.hasOwnProperty;

/*
 * Constants (types).
 */

var T_TEXT = 'text';
var T_ELEMENT = 'element';

/*
 * Default element tag name.
 */

var DEFAULT_TAG_NAME = 'div';

/*
 * Delimiters.
 */

var DELIMITER_COMMA = ', ';
var DELIMITER_SPACE = ' ';

/*
 * Errors.
 */

var E_INVALID_NODE = 'Expected node';
var E_INVALID_HYPERSCRIPT = 'Expected `hyperscript`, ' +
    '`virtual-hyperscript`, `React.createElement`, or similar';

/**
 * Compile a `properties` object to hyperscript applicable
 * properties (and attributes?).
 *
 * @param {Object?} properties - HAST properties.
 * @param {Function} h - `virtual-hyperscript`.
 * @return {Object?} - Virtual properties.
 */
function props(properties, h) {
    var result = {};
    var attributes = {};
    var hasAttributes;
    var hasProperties;
    var value;
    var info;
    var key;
    var isVirtual;
    var isHyperscript;
    var property;
    var attribute;
    var name;

    if (!properties) {
        return null;
    }

    isVirtual = typeof h(DEFAULT_TAG_NAME).hasWidgets === 'boolean';
    isHyperscript = 'cleanup' in h;

    for (key in properties) {
        value = properties[key];

        if (
            value === null ||
            value === undefined ||
            /* Boolean `false` for (overloaded) boolean values */
            value === false ||
            /* NaN check for number values */
            value !== value
        ) {
            continue;
        }

        info = information(key);
        hasProperties = true;

        if (typeof value === 'object' && 'length' in value) {
            value = value.join(
                info.commaSeparated ? DELIMITER_COMMA : DELIMITER_SPACE
            );
        }

        property = (info && info.propertyName) || key;
        attribute = (info && info.name) || key;

        /*
         * virtual-hyperscript disambiguates between
         * “properties” and “attributes”.
         *
         * Also: https://github.com/TimBeyer/html-to-vdom/issues/24
         */

        if (isVirtual && (!info || info.mustUseAttribute)) {
            hasAttributes = true;
            attributes[attribute] = value;
        } else {
            name = property;

            /*
             * Hyperscript doesn’t have an interface for
             * boolean attributes; so the attribute name
             * must be given.
             */

            if (isHyperscript && value === true) {
                value = attribute;
            }

            if (isHyperscript && attribute.indexOf('xml:') === 0) {
                name = attribute;
            }

            result[name] = value;
        }
    }

    if (hasAttributes) {
        result.attributes = attributes;
    }

    return hasProperties ? result : undefined;
}

/**
 * Convert children of `node` to virtual nodes.
 *
 * @param {HASTNode} node - Hast node.
 * @param {Function} h - `virtual-hyperscript`.
 * @return {Array.<VNode>} - Virtual nodes.
 */
function all(node, h) {
    var children = node.children;
    var length = children.length;
    var index = -1;
    var results = [];
    var result;

    while (++index < length) {
        result = one(children[index], h);

        if (result) {
            results.push(result);
        }
    }

    return results;
}

/**
 * Convert a HAST `node` to a virtual node.
 *
 * @param {HASTNode} node - Hast node.
 * @param {Function} h - `virtual-hyperscript`.
 * @return {VNode} - Virtual node.
 */
function one(node, h) {
    var children;
    var result;

    if (!node || !node.type) {
        throw new Error(E_INVALID_NODE);
    }

    /*
     * Wrap the `text` in a `div` so we can get it through
     * `h`. Needed as all but React expose custom objects.
     */

    if (node.type === T_TEXT) {
        result = h(DEFAULT_TAG_NAME, null, [node.value]);

        /* React: */
        if (has.call(result, '$$typeof')) {
            return result.props.children[0];
        }

        /* Hyperscript: */
        if (result.childNodes) {
            result = result.childNodes[0];
            result.parentElement = null;

            return result;
        }

        /* virtual-dom/h */
        return result.children[0];
    }

    if (node.children) {
        children = all(node, h);
    }

    if (node.type === T_ELEMENT) {
        return h(node.tagName, props(node.properties, h), children);
    }

    return children;
}

/**
 * Wrapper to ensure `h` is given.
 *
 * @param {HASTNode} node - Hast node.
 * @param {Function} h - `virtual-hyperscript`.
 * @return {VNode} - Virtual node.
 */
function toHyperscript(node, h) {
    if (typeof h !== 'function') {
        throw new Error(E_INVALID_HYPERSCRIPT);
    }

    return one(node, h);
}

/*
 * Expose.
 */

module.exports = toHyperscript;
