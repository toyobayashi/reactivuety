import * as React from 'react'
// import { /* HashRouter, Switch, Route, Link */ } from 'react-router-dom'
import { defineAsyncComponent, createRouter, createWebHashHistory, RouterView, RouterLink } from '../..'

const MarkdownView = defineAsyncComponent(() => import('./components/MarkdownView'))
const GithubCommitView = defineAsyncComponent(() => import('./components/GithubCommitView'))
const GridComponent = defineAsyncComponent(() => import('./components/GridComponent'))

const Home: React.FunctionComponent = () => {
  return (
    <div>
      <div><RouterLink to={{ name: 'markdown' }}>markdown</RouterLink></div>
      <div><RouterLink to={{ name: 'github' }}>github</RouterLink></div>
      <div><RouterLink to={{ name: 'grid' }}>grid</RouterLink></div>
      <RouterView />
    </div>
  )
}
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
          component: () => Promise.resolve(MarkdownView)
        },
        {
          path: 'github',
          name: 'github',
          component: () => Promise.resolve(GithubCommitView)
        },
        {
          path: 'grid',
          name: 'grid',
          component: () => Promise.resolve(GridComponent)
        }
      ]
    }
  ]
})
router.install()

const App: React.FunctionComponent = () => {
  return (
    <>
      <RouterView />
      
    </>
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
