import './MarkdownView.css'

import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import * as marked from 'marked'
import { ref, computed, Textarea, defineComponent } from '../../..'

const debounce: typeof import('lodash/debounce') = require('lodash/debounce')

export default defineComponent({
  setup: (_props: RouteComponentProps) => {
    const input = ref<string>('# hello')

    const compiledMarkdown = computed(() => ({ __html: marked(input.value) }))

    const update = debounce((e): void => {
      input.value = e.target.value
    }, 300)

    // return { input, update, compiledMarkdown }

    return () => {
      console.log('[MarkdownView] render')
      return (
        <div id="editor">
          <Textarea value={input.value} onInput={update} />
          <div dangerouslySetInnerHTML={compiledMarkdown.value}></div>
        </div>
      )
    }
  }/* ,
  render: (state) => {
    console.log('[MarkdownView] render')
    return (
      <div id="editor">
        <Textarea value={state.input} onInput={state.update} />
        <div dangerouslySetInnerHTML={state.compiledMarkdown}></div>
      </div>
    )
  } */
})
