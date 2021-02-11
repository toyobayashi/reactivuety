import * as React from 'react'
// import { /* HashRouter, Switch, Route, Link */ } from 'react-router-dom'
import { defineAsyncComponent, createRouter, createWebHashHistory, RouterView, RouterLink } from '../..'

const MarkdownView = defineAsyncComponent(() => import('./components/MarkdownView'))
const GithubCommitView = defineAsyncComponent(() => import('./components/GithubCommitView'))
const GridComponent = defineAsyncComponent(() => import('./components/GridComponent'))

const Home = React.forwardRef(() => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'stretch',
      height: '100%'
    }}>
      <div style={{ width: '150px', backgroundColor: '#ddd' }}>
        <div><RouterLink to={{ name: 'markdown' }}>markdown</RouterLink></div>
        <div><RouterLink to={{ name: 'github' }}>github</RouterLink></div>
        <div><RouterLink to={{ name: 'grid' }}>grid</RouterLink></div>
      </div>
      <RouterView style={{ flex: '1' }} />
    </div>
  )
})
Home.displayName = 'Home'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      children: [
        {
          path: 'markdown',
          name: 'markdown',
          component: MarkdownView
        },
        {
          path: 'github',
          name: 'github',
          component: GithubCommitView
        },
        {
          path: 'grid',
          name: 'grid',
          component: GridComponent
        }
      ]
    }
  ]
})
router.install()

const App: React.FunctionComponent = () => {
  return (
    <RouterView />
    // <>
    //   <HashRouter>
    //     <Switch>
    //       <Route path="/" exact component={Home} />
    //       <Route path="/markdown" exact component={MarkdownView} />
    //       <Route path="/github" exact component={GithubCommitView} />
    //       <Route path="/grid" exact component={GridComponent} />
    //     </Switch>
    //   </HashRouter>
    // </>
  )
}

export default App
