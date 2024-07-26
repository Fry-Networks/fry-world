import bgImg from '../assets/background.png'

export const Hero = () => {
  return (
    <>
      <div className='relative flex'>
        <img className='w-full h-[50vh] object-cover' src={bgImg} alt="Hero Image" />
        <div className='absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center text-center px-60 max-sm:px-14 max-sm:text-sm'>
          <h1>Create Your <span className='text-[#ff0000]'>Algorand-based</span> Token</h1>
          <div className='flex mt-8 w-2/3 text-center max-sm:hidden'>
            <h4>Easily deploy an Algorand-based Token on the Algorand Blockchain. Choose between several features like Freeze, ClawBack and others to give your token its own unique identity. No setup. No coding required.</h4>
          </div>
        </div>
      </div>
    </>
  )
}

export const SolanaHero = () => {
  return (
    <>
      <div className='relative flex'>
        <img className='w-full h-[50vh] object-cover' src={bgImg} alt="Hero Image" />
        <div className='absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center text-center px-60 max-sm:px-14 max-sm:text-sm'>
          <h1>Create Your <span className='text-[#ff0000]'>Solana-SPL</span> Token</h1>
          <div className='flex mt-8 w-2/3 text-center max-sm:hidden'>
            <h4>Easily deploy an SPL Token on the Solana Blockchain. Choose between several features like Mint, Freeze and others to give your token its own unique identity. No setup. No coding required.</h4>
          </div>
        </div>
      </div>
    </>
  )
}

export const EthereumHero = () => {
  return (
    <>
      <div className='relative flex'>
        <img className='w-full h-[50vh] object-cover' src={bgImg} alt="Hero Image" />
        <div className='absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center text-center px-60 max-sm:px-14 max-sm:text-sm'>
          <h1>Create Your <span className='text-[#ff0000]'>Ethereum ERC20</span> Token</h1>
          <div className='flex mt-8 w-2/3 text-center max-sm:hidden'>
            <h4>Easily deploy an ERC20 Token on the Ethereum Blockchain. Choose between several features like Freeze, ClawBack and others to give your token its own unique identity. No setup. No coding required.</h4>
          </div>
        </div>
      </div>
    </>
  )
}