import { useEffect, useState } from "react"
import { Link, useNavigate } from 'react-router-dom'
import { useWallet } from '@txnlab/use-wallet'
import { Box, Image, Stack, HStack, Button, ModalHeader, useDisclosure, Modal, ModalBody, 
  ModalContent, ModalCloseButton, ModalFooter, ModalOverlay, Text, IconButton,
  Grid, GridItem, Divider, Menu, MenuButton, MenuList, MenuItem, MenuDivider,
} from '@chakra-ui/react'
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline"

import viteLogo from '../assets/Logo.png'
import fry from '../assets/fry.png'
import algo from '../assets/algo.png'
import eth from '../assets/ethereum.png'
import sol from '../assets/solana.png'

const Header = () => {

  const Overlay = () => (
    <ModalOverlay
      bg='blackAlpha.300'
      backdropFilter='blur(5px)'
    />
  )

  const navigate = useNavigate();
  const { providers, activeAccount, getAssets, getAccountInfo } = useWallet()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [overlay, setOverlay] = useState(<Overlay />)
  const [address, setAddress] = useState('')
  const [algoBalance, setAlgoBalance] = useState('0.00')
  const [fryBalance, setFryBalance] = useState('0.00')
  const [chainStatus, setChainStatus] = useState(0)
  const [activeLink, setActiveLink] = useState('Algorand');
  const chainList = [
    { chainId: 0, chainName: 'ALGORAND', chainIcon: `${algo}` },
    { chainId: 1, chainName: 'SOLANA', chainIcon: `${sol}` },
    { chainId: 2, chainName: 'ETHEREUM', chainIcon: `${eth}`},
  ]
  const Links = ['Algorand', 'Solana', 'Ethereum']

  const handleLinkClick = (link) => {
    setActiveLink(link);
  };

  const NavLink = ({ children, isActive, onClick}) => {
      
    return (
      <Link 
        to={`/${children == 'Algorand' ? '' : children}`}
        onClick={onClick}
      >
        <Box
          px={2}
          py={1}
          rounded={'md'}
          color={isActive ? 'primary' : 'white'}
          _hover={{
            textDecoration: 'none',
            bg: 'primary',
            color: 'white'
          }}
        >
          {children}
        </Box>
      </Link>
    )
  }

  const handleDisconnect = () => {
    if (activeAccount) {
      providers?.map((provider) => {
        if(provider.isActive) {
          provider.disconnect()
        }
      })
    }
  }

  useEffect( () => {
    if (activeAccount) {
      const assets = async () => {
        const infos = await getAssets()
        const accountInfo = await getAccountInfo()

        if (!accountInfo.amount)
          setAlgoBalance('0.00')
        else {
          setAlgoBalance((accountInfo.amount / 10**6).toFixed(3).toString())
        }
          

        if (infos.length == 0) {
          setFryBalance('0.00')
        } else {
          infos.map((info) => {
            if (info["asset-id"] == 924268058) {
              setFryBalance((info.amount / 10**6).toFixed(2).toString())
            }
          })
        }
        return infos
      }
      assets()
      setAddress(activeAccount.address.substring(0, 4) + '...' + activeAccount.address.slice(-4))
    } else {
      setAddress('')
    }
  }, [activeAccount])

  useEffect(() => {
    navigate('/');
  }, []);

  return(
    <div className="flex justify-between w-full h-max px-16 border-b border-white/10 max-sm:px-0">
      <div className="flex">
        <Link to='https://frynetworks.com' target='_blank'>
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </Link>
      </div>
      <div className="font-sans flex justify-between items-center lg:px-7 px-4 z-[50] gap-6">
          <div className="flex">
            <nav>
              <HStack spacing={8} alignItems={'center'}>
                <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
                  {Links.map((link) => (
                    <NavLink 
                      key={link} 
                      isActive={activeLink === link}
                      onClick={() => handleLinkClick(link)}
                    >
                      {link}
                    </NavLink>
                  ))}
                </HStack>
              </HStack>
              <Menu>
                <MenuButton
                  as={Button}
                  display={{ base: 'flex', md: 'none' }}
                  color='white'
                  borderColor='primary'
                  pr={{ base: '0.5rem', sm: '2.4rem' }}
                  variant='outline'
                  leftIcon ={
                    <Image
                      boxSize='1.5rem'
                      borderRadius='full'
                      src={chainList[chainStatus].chainIcon}
                      alt='Chain Icon'
                    />
                  }
                >
                  <Box display={{ base: 'none', md: 'flex' }}>
                    {chainList[chainStatus].chainName}
                  </Box>
                </MenuButton>
                <MenuList bg='#0d2139'>
                  <Link to='/'>
                    <MenuItem bg='#0d2139' onClick={() => setChainStatus(0)}>
                    <Image
                      boxSize='2rem'
                      borderRadius='full'
                      src={algo}
                      alt='Algorand Chain'
                      mr='12px'
                    />
                    <span>ALGORAND CHAIN</span>
                    </MenuItem>
                  </Link>
                  <MenuDivider />
                  <Link to='/solana'>
                    <MenuItem bg='#0d2139' onClick={() => setChainStatus(1)}>
                      <Image
                        boxSize='2rem'
                        borderRadius='full'
                        src={sol}
                        alt='Solana Chain'
                        mr='12px'
                      />
                        <span>SOLANA CHAIN</span>
                    </MenuItem>
                  </Link>
                  <MenuDivider />
                  <Link to='/ethereum'>
                    <MenuItem bg='#0d2139' onClick={() => setChainStatus(2)}>
                      <Image
                        boxSize='2rem'
                        borderRadius='full'
                        src={eth}
                        alt='Ethereum Chain'
                        mr='12px'
                      />
                        <span>ETHEREUM CHAIN</span>
                    </MenuItem>
                  </Link>
                </MenuList>
              </Menu>
            </nav>
          </div>
          <div className="flex items-center justify-between w-full gap-2">
            <Stack spacing={4} direction='row' align='center' justify='center'>
              {!activeAccount ? (
                <Button color='primary' _hover={{ bg: 'primary', color: 'white', borderColor: 'primary'}} borderColor='primary' size='md' variant='outline' onClick={() => {
                  setOverlay(<Overlay />)
                  onOpen()
                }}>Connect Wallet</Button>
              ) : (
                <>
                  <Box color='primary' border='1px solid' borderColor='primary' borderRadius='0.3rem' size='sm' py='0.2rem' px='0.5rem' gap='0.6rem' alignItems='center' display={{ base: 'none', sm: 'flex' }}>
                    <Box display='flex' gap='0.6rem' alignItems='center'>
                      <Image borderRadius='full' boxSize='1.2rem' src={algo} alt="algo logo"/>
                      <Text>{algoBalance}</Text>
                    </Box>
                    <Divider orientation='vertical' height='1.3rem' display='flex'/>
                    <Box display='flex' gap='0.6rem' alignItems='center'>
                      <Image borderRadius='full' boxSize='1.2rem' src={fry} alt="fry logo"/>
                      <Text>{fryBalance}</Text>
                    </Box>
                  </Box>
                  <Button color='primary' borderColor='primary' size='md' variant='outline' onClick={() => {
                    setOverlay(<Overlay />)
                    onOpen()
                  }}>{address}</Button>
                </>
              )}
            </Stack>
            <Modal isCentered isOpen={isOpen} onClose={onClose} returnFocusOnClose={false} blockScrollOnMount={false} closeOnOverlayClick={false} >
              {overlay}
              {!activeAccount ? (
                <ModalContent p='0.5rem'>
                  <ModalHeader>Connect to a wallet</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <Grid templateColumns='repeat(1, 5fr)' gap={6}>
                      {providers?.map((provider) => (
                        <GridItem w='100%' h='12' bg='#0d2139' border='1px solid #1F262F' borderRadius='0.3rem' key={'provider-' + provider.metadata.id}>
                          <HStack >
                            <Box as='button' display='flex' width='100%' alignItems='center' justifyContent='space-between' p='0.6rem' onClick={() => { provider.connect(); onClose() }} disabled={provider.isConnected}>
                              <Box display='flex' alignItems='center' gap='0.6rem'>
                                <Image borderRadius='full' boxSize='1.8rem' src={provider.metadata.icon} alt="Pera logo"/>
                                <Text>{provider.metadata.name} Wallet</Text>
                              </Box>
                                {provider.isConnected ? (
                                  <Box display='flex' gap='0.6rem' alignItems='center'>
                                    <Text>Connected</Text>
                                    <Box as='button'><ArrowRightStartOnRectangleIcon className="h-6 w-6 text-gray-500" /></Box>
                                  </Box>
                                ) : (
                                  <Box display='flex' gap='0.6rem' alignItems='center'>
                                    <Text>Disconnected</Text>
                                    {/* <Box as='button'><ArrowRightStartOnRectangleIcon className="h-6 w-6 text-gray-500" /></Box> */}
                                  </Box>
                                )}
                            </Box>
                          </HStack>
                        </GridItem>
                      ))
                      }
                    </Grid>
                  </ModalBody>
                  <ModalFooter justifyContent='center'>
                    <Text color='gray.400'>By connecting a wallet, you can proceed from here</Text>
                  </ModalFooter>
                </ModalContent>
              ) : (
                <ModalContent p='0.5rem'>
                  <ModalHeader>Wallet Connection</ModalHeader>
                  <ModalCloseButton />
                  <ModalBody>
                    <HStack justifyContent='space-between'>
                      <Box display='flex' gap='0.6rem' alignItems='center'>
                        {providers?.map((provider) => (
                            provider.isConnected && provider.isActive && (
                              <Image borderRadius='full' boxSize='1.8rem' src={provider.metadata.icon} alt="Wallet logo"/>
                            )
                          ))
                        }
                        <Text>{address}</Text>
                      </Box>
                      <Button onClick={() => handleDisconnect()}>Disconnect</Button>
                    </HStack>
                  </ModalBody>
                </ModalContent>
              )}
            </Modal>
          </div>
      </div>
    </div>
  )
}

export default Header;