import './GridComponent.css'

import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'

import { defineComponent, ref, Input } from '../../..'

import { reactive, shallowReactive } from '@vue/reactivity'

import DemoGrid from './DemoGrid'

const GridComponent = defineComponent<RouteComponentProps>(() => {
  const searchQuery = ref('')
  const gridColumns = reactive(['name', 'power'])
  const gridData = shallowReactive([
    { name: 'Chuck Norris', power: Infinity },
    { name: 'Bruce Lee', power: 9000 },
    { name: 'Jackie Chan', power: 7000 },
    { name: 'Jet Li', power: 8000 }
  ])
  return () => {
    console.log('[GridComponent] render')
    return (
      <div id="demo">
        <form id="search">
          Search <Input name="query" vModel={searchQuery} />
        </form>
        <DemoGrid
          heroes={gridData}
          columns={gridColumns}
          filterKey={searchQuery.value}
        />
      </div>
    )
  }
})

export default GridComponent
