import './MarkdownView.css'

import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import * as marked from 'marked'
import { ref, computed, Textarea, defineComponent } from '../../..'

const debounce: typeof import('lodash/debounce') = require('lodash/debounce')

export default defineComponent<RouteComponentProps & {
  style?: React.CSSProperties
  className?: string
}>((props) => {
  const input = ref<string>('# hello')

  const compiledMarkdown = computed(() => ({ __html: marked(input.value) }))

  const update = debounce((e): void => {
    input.value = e.target.value
  }, 300)

  return () => {
    console.log('[MarkdownView] render')
    return (
      <div id="editor" style={props.style} className={props.className}>
        <Textarea value={input.value} onInput={update} />
        <div dangerouslySetInnerHTML={compiledMarkdown.value}></div>
      </div>
    )
  }
})
