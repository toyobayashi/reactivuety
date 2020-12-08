import './GithubCommitView.css'

import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'

import { useSetup, ref, watch, shallowRef, onBeforeUpdate, onMounted } from '../../..'

const apiURL = 'https://api.github.com/repos/vuejs/vue/commits?per_page=3&sha='

const GithubCommitView: React.FunctionComponent<RouteComponentProps> = (props) => {
  console.log('[render] GithubCommitView')

  const data = useSetup(() => {
    const branches = ref(['master', 'dev'])
    const currentBranch = ref('master')
    const commits = ref<any[] | null>(null)

    const inputRefs = shallowRef<HTMLInputElement[]>([])

    onBeforeUpdate(() => {
      console.log('onBeforeUpdate')
      inputRefs.value = []
    })

    onMounted(() => {
      watch(currentBranch, (val) => {
        inputRefs.value.forEach(i => {
          if (i.value === val) {
            i.checked = true
          } else {
            i.checked = false
          }
        })
      }, { immediate: true })
    })

    const truncate = (v: string): string => {
      return v.replace(/T|Z/g, ' ')
    }

    const formatDate = (v: string): string => {
      return v.replace(/T|Z/g, ' ')
    }

    const fetchData = (): void => {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', apiURL + currentBranch.value)
      xhr.onload = function () {
        commits.value = JSON.parse(xhr.responseText)
        console.log(commits.value![0].html_url)
      }
      xhr.send()
    }

    watch(currentBranch, fetchData)

    fetchData()
    return {
      branches,
      currentBranch,
      commits,
      truncate,
      formatDate,
      inputRefs
    }
  }, props)

  return (
    <div id="demo">
      <h1>Latest Vue.js Commits</h1>
      {data.branches.value.map((branch, i) => {
        // v-model="currentBranch"
        return (
          <span key={branch}>
            <input
              ref={el => { if (el) { data.inputRefs.value[i] = el } }}
              type="radio"
              id={branch}
              value={branch}
              name="branch"
              onInput={(e) => {
                data.inputRefs.value.forEach(i => { i.checked = false })
                data.inputRefs.value[i].checked = true
                data.currentBranch.value = (e.target as HTMLInputElement).value
              }}
            />
            <label htmlFor={branch}>{branch}</label>
          </span>
        )
      })}
      <p>vuejs/vue@{data.currentBranch.value}</p>
      <ul>
        {
          data.commits.value
            ? data.commits.value.map(record => {
              return (
                <li key={record.html_url}>
                  <a href={record.html_url} target="_blank" className="commit"
                  >{record.sha.slice(0, 7)}</a> - <span className="message">{ data.truncate(record.commit.message) }</span><br /> by <span className="author"><a href={record.author.html_url} target="_blank">{ record.commit.author.name }</a></span> at <span className="date">{ data.formatDate(record.commit.author.date) }</span>
                </li>
              )
            }) : null
        }
      </ul>
    </div>
  )
}

export default GithubCommitView
