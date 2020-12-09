import * as React from 'react'
import { useVModelSelect, VModelProps } from './useVModel'

const Select = React.forwardRef<HTMLSelectElement, React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> & VModelProps<any>>((props, ref) => {
  console.log('[Select] render')
  const { getRefCallback, onInputCallback, restProps } = useVModelSelect(props, ref)

  return (<select {...restProps} ref={getRefCallback} onChange={onInputCallback}>{props.children}</select>)
})

const Option = React.forwardRef<HTMLOptionElement, React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>>((props, ref) => {
  console.log('[Option] render')

  const { value, ...restProps } = props
  const domRef = React.useRef<any>(null)

  const getRefCallback = React.useCallback((el) => {
    domRef.current = el
    if (ref) {
      if (typeof ref === 'function') {
        ref(el)
      } else if (typeof ref === 'object' && ref !== null) {
        ref.current = el
      }
    }
  }, [ref])

  React.useEffect(() => {
    if (domRef.current) {
      const el: HTMLSelectElement = domRef.current

      el.value = value as any
      if (typeof value !== 'string') {
        (el as any)._value = value
      }
    }
  }, [value])

  return (<option {...restProps} ref={getRefCallback}>{props.children}</option>)
})

export { Select, Option }
