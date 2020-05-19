import * as hastToHyperScript from 'hast-to-hyperscript'
import {createElement as reactCreateElement} from 'react'
import {h as virtualDomCreateElement} from 'virtual-dom'
import * as hyperscriptCreateElement from 'hyperscript'
import Vue from 'vue'

const element = {
  type: 'element',
  tagName: 'a',
  properties: {
    href: 'https://alpha.com',
    className: ['bravo'],
    download: true
  },
  children: []
}

// Different options
hastToHyperScript(hyperscriptCreateElement, element, 'h')
hastToHyperScript(hyperscriptCreateElement, element, false)
hastToHyperScript(hyperscriptCreateElement, element, {})
hastToHyperScript(hyperscriptCreateElement, element, {
  prefix: false
})
hastToHyperScript(hyperscriptCreateElement, element, {
  space: 'svg'
})
hastToHyperScript(hyperscriptCreateElement, element, {
  prefix: false,
  space: 'svg'
})
hastToHyperScript(hyperscriptCreateElement, element, {
  // $ExpectError
  unknown: 'does not exist'
})

// Try different types of renderers
hastToHyperScript(hyperscriptCreateElement, element) // $ExpectType Element
hastToHyperScript(reactCreateElement, element) // $ExpectType ReactElement<{}, string | ((props: any) => ReactElement<any, string | any | (new (props: any) => Component<any, any, any>)> | null) | (new (props: any) => Component<any, any, any>)>
hastToHyperScript(virtualDomCreateElement, element) // $ExpectType VNode
hastToHyperScript(new Vue().$createElement, element) // $ExpectType VNode
hastToHyperScript((name: number) => name, element) // $ExpectError
