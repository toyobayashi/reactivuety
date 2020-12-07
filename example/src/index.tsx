import './styles/index.css'

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import App from './App'

ReactDOM.render(<App />, document.getElementById('app'))

if ((module as any).hot) {
  (module as any).hot.accept()
}
