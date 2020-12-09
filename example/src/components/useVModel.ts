/* eslint-disable @typescript-eslint/naming-convention */
import { Ref } from '@vue/reactivity'
import * as React from 'react'

export interface VModelProps {
  vModel?: Ref
  vModel_trim?: Ref
  vModel_number?: Ref
}

export interface VModelPropsWithLazy extends VModelProps {
  vModel_lazy?: Ref
}

function useVModelPropName<P extends VModelProps> (props: P, allows: Array<(keyof VModelProps)>): keyof VModelProps
function useVModelPropName<P extends VModelProps> (props: P, allows: Array<(keyof VModelPropsWithLazy)>): keyof VModelPropsWithLazy
function useVModelPropName (props: any, allows: any[]): string {
  const vModelNames = React.useMemo(
    () => allows.filter(n => (n in props)),
    allows.map(p => props[p])
  )
  if (vModelNames.length > 1) {
    throw new Error('Duplicated vModels')
  }
  return vModelNames[0]
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useVModelText<
  E extends HTMLInputElement | HTMLTextAreaElement,
  P extends React.DetailedHTMLProps<React.InputHTMLAttributes<E>, E> & VModelPropsWithLazy
> (props: P, ref: React.ForwardedRef<E>) {
  const vModelName = useVModelPropName(props, ['vModel', 'vModel_lazy', 'vModel_trim', 'vModel_number'])
  const { value, onInput, onChange, vModel, vModel_lazy, vModel_trim, vModel_number, defaultValue, ...restProps } = props
  const usingVModel = props[vModelName]
  const vModelValue = usingVModel?.value
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
      domRef.current.value = usingVModel?.value ?? value ?? defaultValue ?? ''
    }
  }, [value, usingVModel, vModelValue])

  const onInputCallback = React.useCallback((e) => {
    if (usingVModel) {
      if (vModelName === 'vModel_number') {
        const v = parseFloat(e.target.value)
        usingVModel.value = Number.isNaN(v) ? e.target.value : v
      } else if (vModelName === 'vModel_trim') {
        usingVModel.value = e.target.value.trim()
      } else {
        usingVModel.value = e.target.value
      }
    }
    if (vModelName === 'vModel_lazy') {
      if (typeof onChange === 'function') onChange(e)
    } else {
      if (typeof onInput === 'function') onInput(e)
    }
  }, [onInput, onChange, usingVModel, vModelName])

  return { vModelName, getRefCallback, onInput, onChange, onInputCallback, restProps }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useVModelRadio<
  E extends HTMLInputElement,
  P extends React.DetailedHTMLProps<React.InputHTMLAttributes<E>, E> & VModelProps
> (props: P, ref: React.ForwardedRef<E>) {
  const vModelName = useVModelPropName(props, ['vModel', 'vModel_trim', 'vModel_number'])
  const { checked, onChange, vModel, vModel_trim, vModel_number, defaultChecked, ...restProps } = props
  const usingVModel = props[vModelName]
  const vModelValue = usingVModel?.value
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
      if (usingVModel?.value != null) {
        domRef.current.checked = usingVModel.value === props.value
      } else if (checked != null) {
        domRef.current.checked = checked
      } else if (defaultChecked != null) {
        domRef.current.checked = defaultChecked
      } else {
        domRef.current.checked = false
      }
    }
  }, [checked, usingVModel, vModelValue])

  const onInputCallback = React.useCallback((e) => {
    if (usingVModel) {
      if (vModelName === 'vModel_number') {
        const v = parseFloat(e.target.value)
        usingVModel.value = Number.isNaN(v) ? e.target.value : v
      } else if (vModelName === 'vModel_trim') {
        usingVModel.value = e.target.value.trim()
      } else {
        usingVModel.value = e.target.value
      }
    }
    if (typeof onChange === 'function') onChange(e)
  }, [onChange, usingVModel, vModelName])

  return { getRefCallback, onInputCallback, restProps }
}

export { useVModelText, useVModelRadio }
