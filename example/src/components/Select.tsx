import * as React from 'react'
import { useDomRef, useVModelSelect, VModelProps } from './useVModel'

const Select = React.forwardRef<HTMLSelectElement, React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> & VModelProps<any> & { value?: any }>((props, ref) => {
  console.log('[Select] render')
  const { getRefCallback, onInputCallback, restProps } = useVModelSelect(props, ref)

  return (<select {...restProps} ref={getRefCallback} onChange={onInputCallback}>{props.children}</select>)
})

const Option = React.forwardRef<HTMLOptionElement, React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement> & { value?: any }>((props, ref) => {
  console.log('[Option] render')

  const { value, ...restProps } = props
  const [domRef, getRefCallback] = useDomRef(ref)

  React.useEffect(() => {
    if (domRef.current) {
      const el: HTMLOptionElement = domRef.current

      if (typeof value !== 'string') {
        if ('value' in props) { (el as any)._value = value }
        el.value = ''
      } else {
        delete (el as any)._value
        el.value = value
      }
    }
  }, [value, domRef.current])

  return (<option {...restProps} ref={getRefCallback}>{props.children}</option>)
})

export { Select, Option }
