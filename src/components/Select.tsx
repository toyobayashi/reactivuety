import * as React from 'react'
import { useDomRef, useVModelSelect, VModelProps } from '../dom/useVModel'

/** @public */
const Select = React.forwardRef<HTMLSelectElement, React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement> & VModelProps<any> & { value?: any }>((props, ref) => {
  const { getRefCallback, onInputCallback, restProps } = useVModelSelect(props, ref)

  return (<select {...restProps} ref={getRefCallback} onChange={onInputCallback}>{props.children}</select>)
})

/** @public */
const Option = React.forwardRef<HTMLOptionElement, React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement> & { value?: any }>((props, ref) => {
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
