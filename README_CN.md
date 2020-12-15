# reactivuety

在 React 中使用 Vue composition API。

[API 文档](https://github.com/toyobayashi/reactivuety/blob/main/docs/api/index.md)

## 与 Vue 的写法对比

Markdown 例子：

Vue:

```vue
<template>
  <div id="editor">
    <textarea :value="input" @input="update"></textarea>
    <div v-html="compiledMarkdown"></div>
  </div>
</template>

<script>
import { ref, computed, defineComponent } from 'vue'
import * as marked from 'marked'
import * as debounce from 'lodash/debounce'

export default defineComponent({
  setup () {
    const input = ref('# hello')
    const compiledMarkdown = computed(() => marked(input.value))

    const update = debounce(function(e) {
      input.value = e.target.value;
    }, 300)

    return { input, compiledMarkdown, update }
  }
})
</script>
```

写法一：React 中用 `defineComponent`，第一个参数是 `setup` 函数，返回无 props 参数的 render 函数

```jsx
// import ...
import { defineComponent, ref, computed, Textarea } from '@tybys/reactivuety'
import * as debounce from 'lodash/debounce'

export default defineComponent((props) => {
  const input = ref('# hello')
  const compiledMarkdown = computed(() => ({ __html: marked(input.value) }))

  const update = debounce((e) => {
    input.value = e.target.value
  }, 300)

  return () => ( // <-- 返回无 props 参数的 render 函数
    <div id="editor">
      <Textarea value={input.value} onInput={update} />
      <div dangerouslySetInnerHTML={compiledMarkdown.value}></div>
    </div>
  )
})
```

写法二：React 中用 `defineComponent`，第一个参数是 `setup` 函数，返回包含响应式对象的 Object，第二个参数是带响应式对象的 react render 函数

```jsx
// import ...
export default defineComponent((props) => {
  const input = ref('# hello')
  const compiledMarkdown = computed(() => ({ __html: marked(input.value) }))

  const update = debounce((e) => {
    input.value = e.target.value
  }, 300)

  return { input, compiledMarkdown, update }
}, ({ input, compiledMarkdown, update }, props, context) => (
  <div id="editor">
    <Textarea value={input.value} onInput={update} />
    <div dangerouslySetInnerHTML={compiledMarkdown.value}></div>
  </div>
))
```

写法三：React 函数组件中用 `useSetup` hook，第一个参数是 setup 函数，返回包含响应式对象的 Object，第二个参数是 react 组件的 props

```jsx
// import ...
import * as React from 'react'
import { useSetup, ref, computed, Textarea } from '@tybys/reactivuety'

export default (props) => {
  const { input, compiledMarkdown, update } = useSetup(
    (propsProxy) => {
      const input = ref('# hello')
      const compiledMarkdown = computed(() => ({ __html: marked(input.value) }))

      const update = debounce((e) => {
        input.value = e.target.value
      }, 300)

      return { input, compiledMarkdown, update }
    },
    props // <-- 要传入 react render 进来的 props
  )

  return (
    <div id="editor">
      <Textarea value={input.value} onInput={update} />
      <div dangerouslySetInnerHTML={compiledMarkdown.value}></div>
    </div>
  )
}
```

写法四：React 函数组件中用 `useSetup` hook，第一个参数是 setup 函数，返回 render 函数，第二个参数是 react 组件的 props

```jsx
// import ...
export default (props) => {
  return useSetup(
    (propsProxy) => {
      const input = ref('# hello')
      const compiledMarkdown = computed(() => ({ __html: marked(input.value) }))

      const update = debounce((e) => {
        input.value = e.target.value
      }, 300)

      return () => (
        <div id="editor">
          <Textarea value={input.value} onInput={update} />
          <div dangerouslySetInnerHTML={compiledMarkdown.value}></div>
        </div>
      )
    },
    props
  )()
}
```

## 其它用法

### nextTick

与 vue 3 类似。

``` jsx
import { nextTick, ref } from '@tybys/reactivuety'
export default defineComponent(() => {
  const a = ref('a')
  const onClick = () => {
    a.value = 'b'
    console.log(document.getElementById('a').innerHTML) // a
    nextTick(() => {
      console.log(document.getElementById('a').innerHTML) // b
    })
  }

  return () => (<div id="a" onClick={onClick}>{a.value}</div>)
}) 
```

### 生命周期

与 vue 3 类似。

``` jsx
import {
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onErrorCaptured,
  onMounted,
  onRenderTracked,
  onRenderTriggered,
  onUnmounted,
  onUpdated
} from '@tybys/reactivuety'

export default defineComponent(() => {
  onBeforeMount(() => {})
  onBeforeUnmount(() => {})
  onBeforeUpdate(() => {})
  onErrorCaptured((err, type) => {}) // <-- 没有 instance 参数
  onMounted(() => {})
  onRenderTracked((e) => {})
  onRenderTriggered((e) => {})
  onUnmounted(() => {})
  onUpdated(() => {})
  // ...
}) 
```

### 异步组件

与 vue 3 类似，但没有 `suspensible` 选项。

```jsx
import { defineAsyncComponent } from '@tybys/reactivuety'

const MyComponent = defineAsyncComponent(() => import('./MyComponent'))

const MyComponent2 = defineAsyncComponent({
  loader: () => import('./MyComponent'),
  delay: 200,
  loadingComponent: () => (<MyLoading />),
  errorComponent: ({ error }) => (<div>{error?.message}</div>),
  timeout: Infinity
  onError: (error, retry, fail) => {}
})
```

### Provide / Inject

与 vue 3 类似。

父组件：

```jsx
import { provide, ref } from '@tybys/reactivuety'
export default defineComponent(() => {
  const a = ref('')
  provide('a', a)
  // ...
})
```

子组件（可以是非父子）：

```jsx
import { inject } from '@tybys/reactivuety'
export default defineComponent(() => {
  const a = inject('a')
  // ...
})
```

### vModel

与 vue 3 类似。

支持 `<Input>` / `<Select>` / `<Option>` / `<Textarea>`

```jsx
import { defineComponent, ref, Input } from '@tybys/reactivuety'

export default defineComponent(() => {
  const inputValue = ref('')

  return () => (<Input vModel={inputValue} />) // <-- 传的是 Ref
  /*
    be equivalent to
    return () => (<Input
      value={inputValue.value} // <-- 要取值
      onInput={(e) => { inputValue.value = e.target.value }}
    />)
  */
})
```

修饰符也支持 `vModel_lazy` / `vModel_number` / `vModel_trim`

```jsx
import { defineComponent, ref, Input } from '@tybys/reactivuety'

export default defineComponent(() => {
  const inputValue = ref('')

  return () => (<Input vModel_lazy={inputValue} />)
  /* return () => (
    <Input
      value={inputValue.value}
      onChange={(e) => { inputValue.value = e.target.value }}
    />
  )
})
```

### 兼容 react 的 ref

```jsx
import { ref, onMounted } from '@tybys/reactivuety'
export default defineComponent(() => {
  const a = ref(null)
  onMounted(() => {
    console.log(a.current) // <div>reactivuety</div>
  })

  return () => (<div ref={a}>reactivuety</div>)
})
```

## 注意

* setup 函数仅被调用一次，第一个参数 props 是**只读**的响应式对象。

* setup 函数的返回值可以是：
  
  * 包含响应式对象的 Object，所有响应式对象会被观测。
  
  * 无 props 的渲染函数，内部读取过值的响应式对象会被观测。

* 生命周期钩子必须在 setup 函数中使用。

* `inject()`必须在 setup 函数中使用。

* 如果在 setup 函数外部调用 `provide()`，则会向全局提供变量。

* 如果在 computed 中读取了 setup 函数第一个参数 props 中的属性值，那么从变更响应式对象的值到触发相关 props 值更新后 react 组件的渲染函数会执行两次，因为 react 的 props 是不可变对象，每次 render 函数调用了才能拿到新的 props 告诉响应式的 props 有哪些值变了，响应式 props 一变导致 computed 返回的 ref 跟着变，所以会再触发一次更新。

* 由于 React 的 `<input>` `<select>` `<textarea>` 等 **受控组件** 的状态更新机制和 vue 不太一样，所以不能直接在这些组件上绑定响应值，应使用本库提供的 `<Input>` `<Select>` `<Option>` `<Textarea>` 组件，它们都是使用 **非受控组件** 实现的，可以和异步响应机制配合的很好，而且支持和 vue 一样用 `vModel` 双向绑定，传入 `vModel` 的应该是一个 `Ref`。

* `<Input>` 和 `<Textarea>` 的 `onChange` 事件是原生的，而不是 React 的合成事件。

* 除了 `vModel` 和 `ref`，**不应该** 给任何属性传入响应式对象。

* `ref` 不会自动取值，传到 JSX 里要写 `.value`。

* 优先从本库导入 `@vue/reactivity` 的 API，本库未提供的再从 `@vue/reactivity` 中导入使用。
