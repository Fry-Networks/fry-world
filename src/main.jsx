import './polyfills'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'
import { ChakraProvider } from '@chakra-ui/react'
import theme from './theme'
import App from './App.jsx'
import './index.css'

import WalletContextProvider from "./components/WalletContextProvider"

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ChakraProvider theme={theme}>
        <WalletContextProvider>
          <Router>
            <App />
          </Router>
        </WalletContextProvider>
      </ChakraProvider>
    </React.StrictMode>
)
