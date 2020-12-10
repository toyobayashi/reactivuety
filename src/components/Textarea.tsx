import * as React from 'react'
import { useVModelText, VModelPropsWithLazy } from '../dom/useVModel'

/** @public */
const Textarea = React.forwardRef<HTMLTextAreaElement, React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement> & VModelPropsWithLazy<string | number> & { value?: string | number }>((props, ref) => {
  const { vModelName, getRefCallback, onInput, onInputCallback, onCompositionStartCallback, onCompositionEndCallback, restProps } = useVModelText(props, ref)

  return vModelName === 'vModel_lazy'
    ? (<textarea {...restProps} ref={getRefCallback} onInput={onInput} onCompositionStart={onCompositionStartCallback} onCompositionEnd={onCompositionEndCallback} />)
    : (<textarea {...restProps} ref={getRefCallback} onInput={onInputCallback} onCompositionStart={onCompositionStartCallback} onCompositionEnd={onCompositionEndCallback} />)
})

export { Textarea }
