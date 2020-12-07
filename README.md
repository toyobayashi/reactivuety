# reactivuety

在 React 中使用 Vue composition API。

[API 文档](https://github.com/toyobayashi/reactivuety/blob/main/docs/api/index.md)

## 与 Vue 的写法对比

Markdown 例子：

```vue
<template>
  <div id="editor">
    <textarea :value="input" @input="update"></textarea>
    <div v-html="compiledMarkdown"></div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import * as marked from 'marked'
import * as debounce from 'lodash/debounce'

export default {
  setup () {
    const input = ref('# hello')
    const compiledMarkdown = computed(() => marked(input.value))

    const update = debounce(function(e) {
      input.value = e.target.value;
    }, 300)

    return { input, compiledMarkdown, update }
  }
}
</script>
```

在 React 中用 `useSetup` hook：

```jsx
import * as React from 'react'
import * as marked from 'marked'
import { effect, computed } from '@vue/reactivity'
import { useSetup, onMounted, ref, shallowRef } from '@tybys/reactivuety'
import * as debounce from 'lodash/debounce'

const MarkdownView = (props) => {
  const data = useSetup(() => {
    const input = ref('# hello')
    const inputRef = shallowRef(null)
    const compiledMarkdown = computed(() => marked(input.value))

    const update = debounce((e) => {
      input.value = e.target.value
    }, 300)

    // https://github.com/facebook/react/issues/6563
    onMounted(() => {
      effect(() => {
        inputRef.current!.value = input.value
      })
    })

    return { input, inputRef, compiledMarkdown, update }
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
```

## 注意

由于 react 和 vue 的渲染机制不太一样，本库采用和 vue 类似的异步渲染机制，更新引用值或响应式对象的属性后会在 JavaScript 的下一个事件循环中重新渲染 react 组件，导致异步更新 `<input>` 和 `<textarea>` 的值时会出现 [光标自动移到末尾的问题](https://github.com/facebook/react/issues/6563)，所以要用 `ref` 手动同步输入的值，不能给它们绑定 `value` 属性。如果想要这样做，也可以使用 `useForceUpdate()` hook 在更改 `ref.value` 后立即调用 `forceUpdate()`。

从本库导入的 `ref()` 和 `shallowRef()` 返回的引用与 react 的 `useRef()` 具有相同的用法，其它组合式 API 请直接从 [`@vue/reactivity`](https://github.com/vuejs/vue-next/tree/master/packages/reactivity) 中导入。
