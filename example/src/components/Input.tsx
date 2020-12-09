import * as React from 'react'
import { useVModelRadio, useVModelText, VModelRadioProps, VModelTextProps } from './useVModel'

const InputText = React.forwardRef<HTMLInputElement, React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & VModelTextProps>((props, ref) => {
  console.log('[InputText] render')
  const { vModelName, getRefCallback, onInput, onChange, onInputCallback, restProps } = useVModelText(props, ref)

  const type = (restProps as React.InputHTMLAttributes<HTMLInputElement>).type
  if (type === 'radio' || type === 'checkbox') {
    throw new Error('input type error')
  }

  return vModelName === 'vModel_lazy'
    ? (<input ref={getRefCallback} onInput={onInput} onChange={onInputCallback} {...restProps} />)
    : (<input ref={getRefCallback} onInput={onInputCallback} onChange={onChange} {...restProps} />)
})

const InputRadio = React.forwardRef<HTMLInputElement, React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & VModelRadioProps>((props, ref) => {
  console.log('[InputRadio] render')
  const { getRefCallback, onInputCallback, restProps } = useVModelRadio(props, ref)

  const type = (restProps as React.InputHTMLAttributes<HTMLInputElement>).type
  if (type !== 'radio' && type !== 'checkbox') {
    throw new Error('input type error')
  }

  return (<input ref={getRefCallback} onChange={onInputCallback} {...restProps} />)
})

export { InputText, InputRadio }
