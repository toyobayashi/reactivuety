import * as React from 'react'
import { useVModelRadio, useVModelText, VModelProps, VModelPropsWithLazy, CheckboxProps, useVModelCheckbox } from './useVModel'

const InputText = React.forwardRef<HTMLInputElement, React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & VModelPropsWithLazy<string | number> & { value?: string | number }>((props, ref) => {
  console.log('[InputText] render')
  const { vModelName, getRefCallback, onInput, onInputCallback, onCompositionStartCallback, onCompositionEndCallback, restProps } = useVModelText(props, ref)

  const type = restProps.type
  if (type === 'radio' || type === 'checkbox') {
    throw new Error('input type error')
  }

  return vModelName === 'vModel_lazy'
    ? (<input {...restProps} ref={getRefCallback} onInput={onInput} onCompositionStart={onCompositionStartCallback} onCompositionEnd={onCompositionEndCallback} />)
    : (<input {...restProps} ref={getRefCallback} onInput={onInputCallback} onCompositionStart={onCompositionStartCallback} onCompositionEnd={onCompositionEndCallback} />)
})

const InputRadio = React.forwardRef<HTMLInputElement, Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'type'> & VModelProps<any> & { value?: any }>((props, ref) => {
  console.log('[InputRadio] render')
  const { getRefCallback, onInputCallback, restProps } = useVModelRadio(props, ref)

  return (<input {...restProps} type='radio' ref={getRefCallback} onChange={onInputCallback} />)
})

const InputCheckbox = React.forwardRef<HTMLInputElement, Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'type'> & VModelProps<any> & CheckboxProps>((props, ref) => {
  console.log('[InputCheckbox] render')
  const { getRefCallback, onInputCallback, restProps } = useVModelCheckbox(props, ref)

  return (<input {...restProps} type='checkbox' ref={getRefCallback} onChange={onInputCallback} />)
})

const Input = React.forwardRef<HTMLInputElement, React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & VModelProps<any> & CheckboxProps>((props, ref) => {
  console.log('[Input] render')

  const { type, ...restProps } = props
  if (type === 'checkbox') {
    return <InputCheckbox {...restProps} ref={ref} />
  } else if (type === 'radio') {
    return <InputRadio {...restProps} ref={ref} />
  } else {
    return <InputText {...restProps} type={type} ref={ref} />
  }
})

export { InputText, InputRadio, InputCheckbox, Input }
