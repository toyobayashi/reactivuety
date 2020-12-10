import './GridComponent.css'

import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'

import { useSetup, ref, Input } from '../../..'

import { reactive, shallowReactive } from '@vue/reactivity'

import DemoGrid from './DemoGrid'

const GridComponent: React.FunctionComponent<RouteComponentProps> = (props) => {
  console.log('[GridComponent] render')

  const data = useSetup(() => {
    const searchQuery = ref('')
    const gridColumns = reactive(['name', 'power'])
    const gridData = shallowReactive([
      { name: 'Chuck Norris', power: Infinity },
      { name: 'Bruce Lee', power: 9000 },
      { name: 'Jackie Chan', power: 7000 },
      { name: 'Jet Li', power: 8000 }
    ])
    return {
      searchQuery,
      gridColumns,
      gridData
    }
  }, props)

  return (
    <div id="demo">
      <form id="search">
        Search <Input name="query" vModel={data.searchQuery} />
      </form>
      <DemoGrid
        heroes={data.gridData}
        columns={data.gridColumns}
        filterKey={data.searchQuery.value}
      />
    </div>
  )
}

export default GridComponent
