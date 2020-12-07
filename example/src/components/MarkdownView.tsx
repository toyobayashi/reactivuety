import './MarkdownView.css'

import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'
import * as marked from 'marked'
import { useSetup, onMounted, ref, shallowRef, watchEffect, computed } from '../../..'

const debounce: typeof import('lodash/debounce') = require('lodash/debounce')

const MarkdownView: React.FunctionComponent<RouteComponentProps> = (props) => {
  console.log('[render] MarkdownView')

  const data = useSetup(() => {
    const input = ref<string>('# hello')

    const inputRef = shallowRef<HTMLTextAreaElement | null>(null)

    const compiledMarkdown = computed(() => marked(input.value))

    const update = debounce((e): void => {
      input.value = e.target.value
    }, 300)

    // https://github.com/facebook/react/issues/6563
    onMounted(() => {
      watchEffect(() => {
        console.log('set text' + input.value)
        inputRef.current!.value = input.value
      })
    })

    return {
      input,
      inputRef,
      compiledMarkdown,
      update
    }
  }, props)

  const html = React.useMemo(() => ({
    __html: data.compiledMarkdown.value
  }), [data.compiledMarkdown.value])

  return (
    <div id="editor">
      <textarea ref={data.inputRef} onInput={data.update}></textarea>
      <div dangerouslySetInnerHTML={html}></div>
    </div>
  )
}

export default MarkdownView
