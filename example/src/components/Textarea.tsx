import * as React from 'react'
import { useVModelText, VModelTextProps } from './useVModel'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> & VModelTextProps>((props, ref) => {
  console.log('[Textarea] render')
  const { vModelName, getRefCallback, onInput, onChange, onInputCallback, restProps } = useVModelText(props, ref)

  return vModelName === 'vModel_lazy'
    ? (<textarea ref={getRefCallback} onInput={onInput} onChange={onInputCallback} {...restProps} />)
    : (<textarea ref={getRefCallback} onInput={onInputCallback} onChange={onChange} {...restProps} />)
})

export { Textarea }
