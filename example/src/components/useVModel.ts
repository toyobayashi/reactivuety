/* eslint-disable @typescript-eslint/naming-convention */
import { Ref } from '@vue/reactivity'
import { looseIndexOf, looseEqual, toNumber, isSet } from '@vue/shared'
import * as React from 'react'

function tryTrim (o: any): any {
  return typeof o === 'string' ? o.trim() : o
}

export interface VModelProps<T> {
  vModel?: Ref<T>
  vModel_trim?: Ref<T>
  vModel_number?: Ref<T>
}

export interface VModelPropsWithLazy<T> extends VModelProps<T> {
  vModel_lazy?: Ref<T>
}

export interface CheckboxProps { trueValue?: string; falseValue?: string }

function useVModelPropName<P extends VModelProps<T>, T> (props: P, allows: Array<(keyof VModelProps<T>)>): keyof VModelProps<T>
function useVModelPropName<P extends VModelProps<T>, T> (props: P, allows: Array<(keyof VModelPropsWithLazy<T>)>): keyof VModelPropsWithLazy<T>
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
  P extends React.DetailedHTMLProps<React.InputHTMLAttributes<E>, E> & VModelPropsWithLazy<string>
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
  P extends React.DetailedHTMLProps<React.InputHTMLAttributes<E>, E> & VModelProps<any>
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
  }, [checked, usingVModel, vModelValue, props.value])

  const onInputCallback = React.useCallback((e) => {
    if (usingVModel) {
      if (vModelName === 'vModel_number') {
        const v = parseFloat(props.value as any)
        usingVModel.value = Number.isNaN(v) ? props.value : v
      } else if (vModelName === 'vModel_trim') {
        usingVModel.value = typeof props.value === 'string' ? props.value.trim() : props.value
      } else {
        usingVModel.value = props.value
      }
    }
    if (typeof onChange === 'function') onChange(e)
  }, [onChange, usingVModel, vModelName, props.value])

  return { getRefCallback, onInputCallback, restProps }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useVModelCheckbox<
  E extends HTMLInputElement,
  P extends React.DetailedHTMLProps<React.InputHTMLAttributes<E>, E> & VModelProps<boolean | string | any[]> & CheckboxProps
> (props: P, ref: React.ForwardedRef<E>) {
  const vModelName = useVModelPropName(props, ['vModel', 'vModel_trim', 'vModel_number'])
  const { checked, onChange, vModel, vModel_trim, vModel_number, defaultChecked, trueValue, falseValue, ...restProps } = props
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

  // 有 trueValue | falseValue 类型为 string
  // 有 value 类型为 array | boolean
  // 没有 类型为 boolean

  React.useEffect(() => {
    if (domRef.current) {
      if (usingVModel?.value != null) {
        if (Array.isArray(usingVModel.value)) {
          // eslint-disable-next-line @typescript-eslint/prefer-includes
          domRef.current.checked = usingVModel.value.indexOf(props.value) !== -1
        } else if (typeof usingVModel.value === 'string') {
          domRef.current.checked = usingVModel.value === (trueValue)
        } else {
          domRef.current.checked = !!usingVModel.value
        }
      } else if (checked != null) {
        domRef.current.checked = checked
      } else if (defaultChecked != null) {
        domRef.current.checked = defaultChecked
      } else {
        domRef.current.checked = false
      }
    }
  }, [checked, usingVModel, vModelValue, trueValue, props.value])

  const onInputCallback = React.useCallback((e) => {
    if (usingVModel) {
      if (vModelName === 'vModel_number') {
        if (Array.isArray(usingVModel.value)) {
          const v = parseFloat(e.target.value)
          const val = Number.isNaN(v) ? e.target.value : v
          if (e.target.checked) {
            usingVModel.value.push(val ?? 'on')
          } else {
            const index = usingVModel.value.indexOf(val ?? 'on')
            if (index !== -1) usingVModel.value.splice(index, 1)
          }
        } else {
          if (e.target.checked) {
            const v = typeof trueValue === 'string' ? parseFloat(trueValue) : NaN
            const val = Number.isNaN(v) ? e.target.checked : v
            usingVModel.value = val
          } else {
            const v = typeof falseValue === 'string' ? parseFloat(falseValue) : NaN
            const val = Number.isNaN(v) ? e.target.checked : v
            usingVModel.value = val
          }
        }
      } else if (vModelName === 'vModel_trim') {
        if (Array.isArray(usingVModel.value)) {
          if (e.target.checked) {
            usingVModel.value.push(e.target.value ? e.target.value.trim() : 'on')
          } else {
            const index = usingVModel.value.indexOf(e.target.value ? e.target.value.trim() : 'on')
            if (index !== -1) usingVModel.value.splice(index, 1)
          }
        } else {
          if (e.target.checked) {
            usingVModel.value = typeof trueValue === 'string' ? trueValue.trim() : e.target.checked
          } else {
            usingVModel.value = typeof falseValue === 'string' ? falseValue.trim() : e.target.checked
          }
        }
      } else {
        if (Array.isArray(usingVModel.value)) {
          if (e.target.checked) {
            usingVModel.value.push(e.target.value ? e.target.value : 'on')
          } else {
            const index = usingVModel.value.indexOf(e.target.value ? e.target.value : 'on')
            if (index !== -1) usingVModel.value.splice(index, 1)
          }
        } else {
          if (e.target.checked) {
            usingVModel.value = typeof trueValue === 'string' ? trueValue : e.target.checked
          } else {
            usingVModel.value = typeof falseValue === 'string' ? falseValue : e.target.checked
          }
        }
      }
    }
    if (typeof onChange === 'function') onChange(e)
  }, [onChange, usingVModel, vModelName, trueValue, falseValue])

  return { getRefCallback, onInputCallback, restProps }
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function useVModelSelect<
  E extends HTMLSelectElement,
  P extends React.DetailedHTMLProps<React.SelectHTMLAttributes<E>, E> & VModelProps<boolean | string | any[]> & CheckboxProps
> (props: P, ref: React.ForwardedRef<E>) {
  const vModelName = useVModelPropName(props, ['vModel', 'vModel_trim', 'vModel_number'])
  const { value, onChange, vModel, vModel_trim, vModel_number, defaultValue, ...restProps } = props
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
      const el: HTMLSelectElement = domRef.current
      const isMultiple = props.multiple
      const val = usingVModel?.value ?? value ?? defaultValue ?? ''

      for (let i = 0, l = el.options.length; i < l; i++) {
        const option = el.options[i]
        const optionValue = getValue(option)
        if (isMultiple) {
          if (Array.isArray(val)) {
            option.selected = looseIndexOf(val, optionValue) > -1
          } else {
            option.selected = (val as unknown as Set<any>).has(optionValue)
          }
        } else {
          if (looseEqual(getValue(option), val)) {
            el.selectedIndex = i
            return
          }
        }
      }
      if (!isMultiple) {
        el.selectedIndex = -1
      }
    }
  }, [value, usingVModel, vModelValue, defaultValue, props.multiple])

  const onInputCallback = React.useCallback((e) => {
    if (usingVModel) {
      const isSetModel = isSet(usingVModel.value)
      const el = e.target
      const selectedVal = Array.prototype.filter
        .call(el.options, (o: HTMLOptionElement) => o.selected)
        .map(
          (o: HTMLOptionElement) =>
            (vModelName === 'vModel_number') ? toNumber(getValue(o)) : ((vModelName === 'vModel_trim') ? tryTrim(getValue(o)) : getValue(o))
        )
      usingVModel.value = (
        el.multiple
          ? isSetModel
            ? new Set(selectedVal)
            : selectedVal
          : selectedVal[0]
      )
    }
    if (typeof onChange === 'function') onChange(e)
  }, [onChange, usingVModel, vModelName])

  return { getRefCallback, onInputCallback, restProps }
}

function getValue (el: HTMLOptionElement | HTMLInputElement): any {
  return '_value' in el ? (el as any)._value : el.value
}

export { useVModelText, useVModelRadio, useVModelCheckbox, useVModelSelect }
