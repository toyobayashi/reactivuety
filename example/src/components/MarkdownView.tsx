import './MarkdownView.css'

import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import * as marked from 'marked'
import { useSetup, ref, computed } from '../../..'

import { Textarea } from './Textarea'

const debounce: typeof import('lodash/debounce') = require('lodash/debounce')

const MarkdownView: React.FunctionComponent<RouteComponentProps> = (props) => {
  console.log('[MarkdownView] render')

  const data = useSetup(() => {
    const input = ref<string>('# hello')

    const compiledMarkdown = computed(() => ({ __html: marked(input.value) }))

    const update = debounce((e): void => {
      input.value = e.target.value
    }, 300)

    return {
      input,
      compiledMarkdown,
      update
    }
  }, props)

  return (
    <div id="editor">
      <Textarea value={data.input.value} onInput={data.update} />
      <div dangerouslySetInnerHTML={data.compiledMarkdown.value}></div>
    </div>
  )
}

export default MarkdownView
