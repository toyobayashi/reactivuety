import * as React from 'react'
import { useVModelRadio, useVModelText, VModelProps, VModelPropsWithLazy } from './useVModel'

const InputText = React.forwardRef<HTMLInputElement, React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & VModelPropsWithLazy>((props, ref) => {
  console.log('[InputText] render')
  const { vModelName, getRefCallback, onInput, onChange, onInputCallback, restProps } = useVModelText(props, ref)

  const type = restProps.type
  if (type === 'radio' || type === 'checkbox') {
    throw new Error('input type error')
  }

  return vModelName === 'vModel_lazy'
    ? (<input {...restProps} ref={getRefCallback} onInput={onInput} onChange={onInputCallback} />)
    : (<input {...restProps} ref={getRefCallback} onInput={onInputCallback} onChange={onChange} />)
})

const InputRadio = React.forwardRef<HTMLInputElement, Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'type'> & VModelProps>((props, ref) => {
  console.log('[InputRadio] render')
  const { getRefCallback, onInputCallback, restProps } = useVModelRadio(props, ref)

  return (<input {...restProps} type='radio' ref={getRefCallback} onChange={onInputCallback} />)
})

export { InputText, InputRadio }
