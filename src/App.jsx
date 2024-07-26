import { useEffect } from 'react'
import {
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

  const providers = useInitializeProviders({
    providers: [
      { id: PROVIDER_ID.DEFLY, clientStatic: DeflyWalletConnect },
      { id: PROVIDER_ID.PERA, clientStatic: PeraWalletConnect },
      { id: PROVIDER_ID.DAFFI, clientStatic: DaffiWalletConnect },
    ]
  })

  return (    
    <WalletProvider value={providers}>
      <div className='flex flex-col w-full'>
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
    </WalletProvider>
  )
}

export default App
