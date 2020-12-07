import { useCallback, useState } from 'react'

/** @public */
export function useForceUpdate (): () => void {
  const setState = useState<{}>(Object.create(null))[1]
  return useCallback((): void => { setState(Object.create(null)) }, [setState])
}
