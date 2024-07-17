import bgImg from '../assets/background.png'

const Hero = () => {
  return (
    <>
      <div className='relative flex'>
        <img className='w-full h-full object-cover' src={bgImg} alt="Hero Image" />
        <div className='absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center text-center px-60 max-sm:px-16 max-sm:text-sm max-sm:pt-32'>
          <h1>Create Your <span className='text-[#00C1F0]'>ASAs</span> Token</h1>
          <div className='flex mt-8 w-2/3 text-center max-sm:hidden'>
            <h4>Easily deploy an ASAs Token on Algorand Blockchain. Between several features like Freeze, ClawBack and others, giving your token its unique identity. No setup. No coding required.</h4>
          </div>
        </div>
      </div>
    </>
  )
}

export default Hero;