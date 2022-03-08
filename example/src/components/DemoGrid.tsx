// import './GithubCommitView.css'

import * as React from 'react'

import { defineComponent, ref, computed, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted, onRenderTriggered } from '../../..'

// import { reactive } from '@vue/reactivity'

const DemoGrid = defineComponent((props: {
  columns: string[]
  heroes: Array<{ name: string; power: number }>
  filterKey: string
}) => {
  onBeforeMount(() => console.log('onBeforeMount'))
  onMounted(() => console.log('onMounted'))
  onBeforeUpdate(() => console.log('onBeforeUpdate'))
  onUpdated(() => console.log('onUpdated'))
  onBeforeUnmount(() => console.log('onBeforeUnmount'))
  onUnmounted(() => console.log('onUnmounted'))
  onRenderTriggered((e: any) => console.log(e))
  const sortKey = ref('')
  const sortOrders = computed(() => {
    const columnSortOrders: any = {}

    props.columns.forEach(function (key) {
      columnSortOrders[key] = 1
    })

    return columnSortOrders
  })

  const filteredHeroes = computed(() => {
    const _sortKey = sortKey.value
    const filterKey = props.filterKey?.toLowerCase()
    const order = sortOrders.value[_sortKey] || 1
    let heroes = props.heroes
    if (filterKey) {
      heroes = heroes.filter(function (row) {
        return Object.keys(row).some(function (key) {
          return (
            // eslint-disable-next-line @typescript-eslint/prefer-includes
            String((row as any)[key])
              .toLowerCase()
              .indexOf(filterKey) > -1
          )
        })
      })
    }
    if (_sortKey) {
      heroes = heroes.slice().sort(function (a, b) {
        a = (a as any)[_sortKey]
        b = (b as any)[_sortKey]
        return (a === b ? 0 : a > b ? 1 : -1) * order
      })
    }
    return heroes
  })

  const sortBy = (key: string): void => {
    sortKey.value = key
    sortOrders.value[key] = sortOrders.value[key] * -1
  }

  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  return () => {
    console.log('[DemoGrid] render')
    return (
      <table>
        <thead>
          <tr>
            {props.columns.map(key => {
              // eslint-disable-next-line eqeqeq
              const className = sortKey.value == key ? 'active' : ''
              const className2 = sortOrders.value[key] > 0 ? 'arrow asc' : 'arrow dsc'
              return (
                <th
                  key={key}
                  onClick={() => { sortBy(key) }}
                  className={className}>
                  { capitalize(key) }
                  <span className={className2}>
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {filteredHeroes.value.map(entry => {
            return (
              <tr key={entry.name}>
                {props.columns.map(key => {
                  return <td key={key}>{(entry as any)[key]}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }
})

export default DemoGrid
