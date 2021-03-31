# reactivuety

Write react in vue way.

[API Documentation](https://github.com/toyobayashi/reactivuety/blob/main/docs/api/index.md)

[中文](https://github.com/toyobayashi/reactivuety/blob/main/README_CN.md)

## Install

```
npm install @tybys/reactivuety
```

or

```html
<script src="https://cdn.jsdelivr.net/npm/react/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@vue/reactivity@3.0.10/dist/reactivity.global.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@tybys/reactivuety/dist/reactivuety.min.js"></script>
```

## Compare with Vue

Markdown example:

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

Use `defineComponent`, the first argument is setup function, which returns a renden function without props.

```jsx
// import ...
import * as React from 'react'
import { defineComponent, ref, computed, Textarea } from '@tybys/reactivuety'

export default defineComponent((props) => {
  const input = ref('# hello')
  const compiledMarkdown = computed(() => ({ __html: marked(input.value) }))

  const update = debounce((e) => {
    input.value = e.target.value
  }, 300)

  return () => ( // <-- No props
    <div id="editor">
      <Textarea value={input.value} onInput={update} />
      <div dangerouslySetInnerHTML={compiledMarkdown.value}></div>
    </div>
  )
})
```

No bundler:

```html
<script src="https://cdn.jsdelivr.net/npm/react/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom/umd/react-dom.production.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/lodash/lodash.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/marked/lib/marked.min.js"></script>

<script src="https://cdn.jsdelivr.net/npm/@vue/reactivity@3.0.10/dist/reactivity.global.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@tybys/reactivuety/dist/reactivuety.min.js"></script>
<script>
  (function () {
    var defineComponent = reactivuety.defineComponent;
    var ref = reactivuety.ref;
    var computed = reactivuety.computed;
    var Textarea = reactivuety.Textarea;
    var h = React.createElement;
    var debounce = _.debounce;

    var MarkdownView = defineComponent(function () {
      var input = ref('# hello');

      var compiledMarkdown = computed(function () {
        return { __html: marked(input.value) };
      });

      var update = debounce(function (e) {
        input.value = e.target.value;
      }, 300);

      return function () {
        return h('div', { id: 'editor' },
          h(Textarea, { value: input.value, onInput: update }),
          h('div', { dangerouslySetInnerHTML: compiledMarkdown.value })
        );
      };
    });
    ReactDOM.render(h(MarkdownView), document.body);
  })();
</script>
```

Use `defineComponent`, the first argument is setup function, which returns an object contains vue reactive objects, the second argument is a react function component render function whose with first argument is the object returned by the setup function.

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

Use `useSetup` hook, the first argument is setup function, which returns an object contains vue reactive objects, the second argument is react props.

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
    props
  )

  return (
    <div id="editor">
      <Textarea value={input.value} onInput={update} />
      <div dangerouslySetInnerHTML={compiledMarkdown.value}></div>
    </div>
  )
}
```

Use `useSetup` hook, the first argument is setup function, which returns a render function, the second argument is react props.

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

## Other usage

### nextTick

Similar to vue 3.

``` jsx
import { nextTick, ref, defineComponent } from '@tybys/reactivuety'
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

### Lifecycles

Similar to vue 3.

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
  onUpdated,
  defineComponent
} from '@tybys/reactivuety'

export default defineComponent(() => {
  onBeforeMount(() => {})
  onBeforeUnmount(() => {})
  onBeforeUpdate(() => {})
  onErrorCaptured((err, type) => {}) // <-- No instance
  onMounted(() => {})
  onRenderTracked((e) => {})
  onRenderTriggered((e) => {})
  onUnmounted(() => {})
  onUpdated(() => {})
  // ...
}) 
```

### Async component

Similar to vue 3. But no `suspensible` option.

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

Similar to vue 3.

In parent:

```jsx
import { provide, ref, defineComponent } from '@tybys/reactivuety'
export default defineComponent(() => {
  const a = ref('')
  provide('a', a)
  // ...
})
```

In children (can be deep):

```jsx
import { inject, defineComponent } from '@tybys/reactivuety'
export default defineComponent(() => {
  const a = inject('a')
  // ...
})
```

### vModel

Similar to vue 3.

Support `<Input>` / `<Select>` / `<Option>` / `<Textarea>`

```jsx
import { defineComponent, ref, Input } from '@tybys/reactivuety'

export default defineComponent(() => {
  const inputValue = ref('')

  return () => (<Input vModel={inputValue} />) // <-- pass ref
  /*
    be equivalent to
    return () => (<Input
      value={inputValue.value} // <-- pass value
      onInput={(e) => { inputValue.value = e.target.value }}
    />)
  */
})
```

Also support modifiers: `vModel_lazy` / `vModel_number` / `vModel_trim`

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

### react compatible ref

```jsx
import { ref, onMounted, defineComponent } from '@tybys/reactivuety'
export default defineComponent(() => {
  const a = ref(null)
  onMounted(() => {
    console.log(a.current) // <div>reactivuety</div>
  })

  return () => (<div ref={a}>reactivuety</div>)
})
```

## Note

* setup function is only called once, the first argument is readonly props `Proxy`

* setup function can return:
  
  * object contains vue reactive object, all of them will be observed if accessed.
  
  * render function without props, all accessed reactive objects in the render function will be observed.

* lifecycle hooks should be called in setup function.

* `inject()` should be called in setup function.

* if `provide()` is called outside of setup function, it will provide your variable to root.

* the `onChange` event of `<Input>` and `<Textarea>` is native, not react's.

* Import `ref` `shallowRef` `computed` from this package, and other reactive API from `@vue/reactivity`.
