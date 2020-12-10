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
import { useSetup, ref, computed, Textarea } from '@tybys/reactivuety'
import * as debounce from 'lodash/debounce'

const MarkdownView = (props) => {
  const data = useSetup(() => {
    const input = ref('# hello')
    const compiledMarkdown = computed(() => ({ __html: marked(input.value) }))

    const update = debounce((e) => {
      input.value = e.target.value
    }, 300)

    return { input, compiledMarkdown, update }
  }, props)

  return (
    <div id="editor">
      <Textarea value={data.input.value} onInput={data.update} />
      <div dangerouslySetInnerHTML={data.compiledMarkdown.value}></div>
    </div>
  )
}

export default MarkdownView
```

## 注意

* 只有在 `useSetup` 中 **返回** 的响应式对象才能被组件收集观测到。

* 由于 React 的 `<input>` `<select>` `<textarea>` 等 **受控组件** 的状态更新机制和 vue 不太一样，所以不能直接在这些组件上绑定响应值，应使用本库提供的 `<Input>` `<Select>` `<Option>` `<Textarea>` 组件，它们都是使用 **非受控组件** 实现的，可以和异步响应机制配合的很好，而且支持和 vue 一样用 `vModel` 双向绑定，传入 `vModel` 的应该是一个 `Ref`，该对象必须在 setup 中返回，不可在外部创建。

  ```jsx
  import { useSetup, ref, Input } from '@tybys/reactivuety'

  export default function (props) {
    const data = useSetup(
      () => ({ inputValue: ref('') }),
      props
    )

    return (<Input vModel={data.inputValue} />) // <-- 传的是 ref
    /*
      return (<Input
        value={data.inputValue.value} // <-- 要取值
        onInput={(e) => { data.inputValue.value = e.target.value }}
      />)
    */
  }
  ```

* `<Input>` 和 `<Textarea>` 的 `onChange` 事件是原生的，而不是 React 的合成事件。

* 除了 `vModel`，**不应该** 在任何属性传入响应性的数据。

* 从本库导入的 `ref()` 和 `shallowRef()` 返回的引用与 react 的 `useRef()` 具有相同的用法，可以直接传给 JSX 里的 `ref` 属性。

* `ref` 不会自动取值，传到 JSX 里要写 `.value`。

* 优先从本库导入响应性 API，本库未提供的再从 `@vue/reactivity` 中导入使用。

* 生命周期钩子必须在 `useSetup` 中使用。
