import * as React from 'react'
import { useVModelRadio, useVModelText, VModelProps, VModelPropsWithLazy, CheckboxProps, useVModelCheckbox } from './useVModel'

const InputText = React.forwardRef<HTMLInputElement, React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & VModelPropsWithLazy<string>>((props, ref) => {
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

const InputRadio = React.forwardRef<HTMLInputElement, Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'type'> & VModelProps<any>>((props, ref) => {
  console.log('[InputRadio] render')
  const { getRefCallback, onInputCallback, restProps } = useVModelRadio(props, ref)

  return (<input {...restProps} type='radio' ref={getRefCallback} onChange={onInputCallback} />)
})

const InputCheckbox = React.forwardRef<HTMLInputElement, Omit<React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'type'> & VModelProps<boolean | string | any[]> & CheckboxProps>((props, ref) => {
  console.log('[InputCheckbox] render')
  const { getRefCallback, onInputCallback, restProps } = useVModelCheckbox(props, ref)

  return (<input {...restProps} type='checkbox' ref={getRefCallback} onChange={onInputCallback} />)
})

export { InputText, InputRadio, InputCheckbox }
