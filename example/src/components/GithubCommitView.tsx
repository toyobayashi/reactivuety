import './GithubCommitView.css'

import * as React from 'react'
import { RouteComponentProps } from 'react-router-dom'

import { ref, watch, Input, defineComponent } from '../../..'

const apiURL = 'https://api.github.com/repos/vuejs/vue/commits?per_page=3&sha='

export default defineComponent<RouteComponentProps>(() => {
  const branches = ref(['master', 'dev'])
  const currentBranch = ref('master')
  const commits = ref<any[] | null>(null)

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

  return () => {
    console.log('[GithubCommitView] render')
    return (
      <div id="demo">
        <h1>Latest Vue.js Commits</h1>
        {branches.value.map((branch) => {
          return (
            <span key={branch}>
              <Input
                type='radio'
                id={branch}
                value={branch}
                name="branch"
                vModel={currentBranch}
              />
              <label htmlFor={branch}>{branch}</label>
            </span>
          )
        })}
        <p>vuejs/vue@{currentBranch.value}</p>
        <ul>
          {
            commits.value
              ? commits.value.map(record => {
                return (
                  <li key={record.html_url}>
                    <a href={record.html_url} target="_blank" className="commit"
                    >{record.sha.slice(0, 7)}</a> - <span className="message">{ truncate(record.commit.message) }</span><br /> by <span className="author"><a href={record.author.html_url} target="_blank">{ record.commit.author.name }</a></span> at <span className="date">{ formatDate(record.commit.author.date) }</span>
                  </li>
                )
              }) : null
          }
        </ul>
      </div>
    )
  }
})
