import * as React from 'react'
import { HashRouter, Switch, Route, Link } from 'react-router-dom'
import { createAsyncComponent } from './utils/async-component'

const MarkdownView = createAsyncComponent(import('./components/MarkdownView'))

const Home: React.FunctionComponent = () => {
  return (
    <>
      <Link to="/markdown">markdown</Link>
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
        </Switch>
      </HashRouter>
    </>
  )
}

export default App
