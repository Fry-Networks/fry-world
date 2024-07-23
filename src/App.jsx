import { useState } from 'react'
import { 
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom'
import { WalletProvider, useInitializeProviders, PROVIDER_ID } from '@txnlab/use-wallet'
import { DeflyWalletConnect } from '@blockshake/defly-connect'
import { PeraWalletConnect } from '@perawallet/connect'
import { DaffiWalletConnect } from '@daffiwallet/connect'

import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import Header from './components/Header'
import { Hero, SolanaHero, EthereumHero } from './components/Hero'
import TokenInfos from './components/TokenInfos'
import SolanaTokenInfos from './components/SolanaTokenInfos'
import EthereumTokenInfos from './components/EthereumTokenInfos'
import Footer from './components/Footer'

function App() {
  const [count, setCount] = useState(0)
  const providers = useInitializeProviders({
    providers: [
      { id: PROVIDER_ID.DEFLY, clientStatic: DeflyWalletConnect },
      { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
      { id: PROVIDER_ID.DAFFI, clientStatic: DaffiWalletConnect },
    ]
  })

  return (    
    <WalletProvider value={providers}>
      <Router>
        <div className='flex flex-col'>
          <Header />
          <main>
            
            <Routes>
              <Route exact path='/' element={<><Hero /><TokenInfos /></>} />
              <Route path='/solana' element={<><SolanaHero /><SolanaTokenInfos /></>} />
              <Route path='/ethereum' element={<><EthereumHero /><EthereumTokenInfos /></>} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </WalletProvider>
  )
}

export default App
