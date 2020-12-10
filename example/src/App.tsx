import * as React from 'react'
import { HashRouter, Switch, Route, Link } from 'react-router-dom'
import { createAsyncComponent } from './utils/async-component'

const MarkdownView = createAsyncComponent(import('./components/MarkdownView'))
const GithubCommitView = createAsyncComponent(import('./components/GithubCommitView'))
const GridComponent = createAsyncComponent(import('./components/GridComponent'))

const Home: React.FunctionComponent = () => {
  return (
    <>
      <div><Link to="/markdown">markdown</Link></div>
      <div><Link to="/github">github</Link></div>
      <div><Link to="/grid">grid</Link></div>
    </>
  )
}

const App: React.FunctionComponent = () => {
  return (
    <>
      <HashRouter>
        <Switch>
          <Route path="/" exact component={Home} />
          <Route path="/markdown" exact component={MarkdownView} />
          <Route path="/github" exact component={GithubCommitView} />
          <Route path="/grid" exact component={GridComponent} />
        </Switch>
      </HashRouter>
    </>
  )
}

export default App
