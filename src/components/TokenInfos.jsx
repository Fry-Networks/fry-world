import { useState, useEffect } from 'react'
import axios from 'axios'
import { useToast } from '@chakra-ui/react'
import { 
  Heading, Text, FormControl, 
  FormLabel, Input, Switch, 
  Button, Stack, Divider, 
  Tooltip, Image, HStack } from '@chakra-ui/react'
import { 
  useWallet,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_PORT,
 } from '@txnlab/use-wallet'
import algosdk from 'algosdk'

import { FRY_ASSETID, FRY_VAULT, ALGO_VAULT} from './Constants'
import query from '../assets/query.png'
import TooltipWrapper from './TooltipWrapper'

const algodClient = new algosdk.Algodv2(
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_PORT
)

const TokenInfos = () => {

  const { activeAddress, signTransactions, sendTransactions, getAssets, getAccountInfo } = useWallet()
  // const [feeAmount, setFeeAmount] = useState(null);
  // const [prevFeeAmount, setPrevFeeAmount] = useState(null);
  const [pending, setPending] = useState(false)
  const [assetName, setAssetName] = useState('')
  const [unitName, setUnitName] = useState('')
  const [managerAddr, setManagerAddr] = useState('')
  const [reserveAddr, setReserveAddr] = useState('')
  const [freezeAddr, setFreezeAddr] = useState('')
  const [clawBackAddr, setClawBackAddr] = useState('')
  const [totalSupply, setTotalSupply] = useState()
  const [tokenDecimal, setTokenDecimal] = useState(0)
  const [assetUrl, setAssetUrl] = useState('')
  const [defaultFrozen, setDefaultFrozen] = useState(false)
  const toast = useToast()

  const handleAssetName = (e) => {
    setAssetName(e.target.value)
  }

  const handleUnitName = (e) => {
    setUnitName(e.target.value)
  }

  const handleManagerAddr = (e) => {
    setManagerAddr(e.target.value)
  }

  const handleReserveAddr = (e) => {
    setReserveAddr(e.target.value)
  }

  const handleFreezeAddr = (e) => {
    setFreezeAddr(e.target.value)
  }

  const handleClawBackAddr = (e) => {
    setClawBackAddr(e.target.value)
  }

  const handleTotalSupply = (e) => {
    setTotalSupply(e.target.value)
  }

  const handleTokenDecimal = (e) => {
    setTokenDecimal(e.target.value)
  }

  const handleAssetUrl = (e) => {
    setAssetUrl(e.target.value)
  }

  const handleDefaultFrozen = (e) => {
    setDefaultFrozen(e.target.checked)
  }

  const getFRYPrice = async () => {
    try {
      const response = await axios.get(`https://free-api.vestige.fi/asset/${FRY_ASSETID}/price`);

      // Filter out words with spaces or dashes
      return parseFloat(response.data.USD).toFixed(5)
    } catch (error) {
      console.error(`Error fetching price for ${FRY_ASSETID}:`, error);
      return [];
    }
  }
  
  const getFRYAmount = async () => {
    const USDPrice = await getFRYPrice()
    const amount = parseInt(20 / USDPrice)
    return amount
  }

  // useEffect(() => {
    
  //   const getFRYAmount = async () => {
  //     const USDPrice = await getFRYPrice()
  //     const newAmount = parseInt(20 / USDPrice)

  //     if (newAmount !== prevFeeAmount) {
  //       setFeeAmount(newAmount)
  //       setPrevFeeAmount(newAmount)
  //     }
  //   }

  //   getFRYAmount()

  //   const interval = setInterval(getFRYAmount, 60000)

  //   return () => clearInterval(interval)
  // }, [prevFeeAmount])

  const sendTransaction = async (
  ) => {

    if (!activeAddress) {
      toast({
        title: 'Connect Your Wallet',
        description: 'Connect an account first.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (assetName.length == 0 || unitName.length == 0 || totalSupply == undefined)
    {
      toast({
        title: 'Invalid Value',
        description: 'You must enter AssetName, UnitName, TotalSupply values.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setPending(true)

    const assetInfos = await getAssets()
    const accountInfo = await getAccountInfo()
    const fryAmount = await getFRYAmount()

    const filteredInfos = assetInfos.filter((info) => {
      return info['asset-id'] == FRY_ASSETID && parseInt(info.amount / 10**6) < fryAmount;
    });

    if (filteredInfos.length) {
      toast({
        title: 'Insufficient Balance!',
        description: `Your FRY Asset balance is not enough. You must hold over ${fryAmount} FRY amounts`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      })
      setPending(false)
      return
    }

    if (accountInfo.amount == 0) {
      toast({
        title: 'Insufficient Balance!',
        description: 'Your ALGO balance for gas fee is not enough.',
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
      setPending(false)
      return
    }
      
    const params = await algodClient.getTransactionParams().do();

    const Txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: activeAddress,
      to: FRY_VAULT.toString(),
      amount: BigInt(fryAmount * 10**6),
      note: new Uint8Array(Buffer.from('fry.world payment')),
      assetIndex: FRY_ASSETID,
      suggestedParams: params,
    });

    // const Txn2 = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    //   from: activeAddress,
    //   to: ALGO_VAULT.toString(),
    //   amount: 1000000,
    //   suggestedParams: params,
    // })

    const transaction = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: activeAddress,
      note: new Uint8Array(Buffer.from('fry.world payment')),
      total: BigInt(totalSupply * 10**parseInt(tokenDecimal)),
      decimals: parseInt(tokenDecimal),
      defaultFrozen: defaultFrozen,
      manager: managerAddr.length == 0 ? undefined : managerAddr,
      reserve: reserveAddr.length == 0 ? undefined : reserveAddr,
      freeze: freezeAddr.length == 0 ? undefined : freezeAddr,
      clawback: clawBackAddr.length == 0 ? undefined : clawBackAddr,
      unitName: unitName,
      assetName: assetName,
      assetURL: assetUrl,
      suggestedParams: params,
    });

    // const txs = [Txn1, Txn2, transaction]
    const txs = [Txn1, transaction]
    algosdk.assignGroupID(txs)

    const fryTxn = algosdk.encodeUnsignedTransaction(Txn1);
    // const algoTxn = algosdk.encodeUnsignedTransaction(Txn2);
    const encodedTransaction = algosdk.encodeUnsignedTransaction(transaction);

    // const signedTransactions = await signTransactions([fryTxn, algoTxn, encodedTransaction]);
    const signedTransactions = await signTransactions([fryTxn, encodedTransaction]);
    const waitRoundsToConfirm = 4;

    const { id } = await sendTransactions(
      signedTransactions,
      waitRoundsToConfirm
    );

    if (id) {
      toast({
        title: 'Transaction Comfirmed Successfully!',
        description: `Successfully sent transaction. Transaction ID: ${id} The ${assetName} token created successfully. ${totalSupply} amounts is in your wallet.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    }
    setPending(false)
    console.log("Successfully sent transaction. Transaction ID: ", id);
  };

  // const createToken = () => {

  //   toast.promise(sendTransaction, {
  //     success: { title: 'Success', description: 'Created Asset Successfully.' },
  //     error: { title: 'Error', description: 'Failed Asset Creation.' },
  //     loading: { title: 'Pending Transaction', description: 'Creating the Asset...' },
  //   })
  // }

  return (
    <div className='flex flex-col w-full px-72 py-16 gap-10 max-sm:px-12 max-sm:pt-24'>
      <Divider />
      <div className='flex flex-col justify-center items-start space-y-2' >
        <Heading as='h5' size='sm' textColor='#00C1F0'>Token Details</Heading>
        <Text color='gray'>Enter token details and choose a network</Text>
      </div>
      <div className='flex flex-col gap-8 max-sm:gap-16'>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl isRequired>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>
                Asset Name
              </FormLabel>
              <TooltipWrapper label="The name of the asset. Max size is 32 bytes. Example: Tether" />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token asset name' value={assetName} onChange={handleAssetName} />
          </FormControl>
          <FormControl isRequired>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Unit Name</FormLabel>
              <TooltipWrapper label="The name of a unit of this asset. Max size is 8 bytes. Example: USDT" />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token unit name' value={unitName} onChange={handleUnitName} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Manager Address</FormLabel>
              <TooltipWrapper label="The address of the account that can manage the configuration of the asset and destroy it." />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token manager address' value={managerAddr} onChange={handleManagerAddr} />
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Reserve Address</FormLabel>
              <TooltipWrapper label="The address of the account that holds the reserve (non-minted) units of the asset. This address has no specific authority in the protocol itself." />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token reserve address' value={reserveAddr} onChange={handleReserveAddr} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Freeze Address</FormLabel>
              <TooltipWrapper label="The address of the account used to freeze holdings of this asset. If empty, freezing is not permitted." />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token freeze address' value={freezeAddr} onChange={handleFreezeAddr} />
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>ClawBack Address</FormLabel>
              <TooltipWrapper label="The address of the account that can clawback holdings of this asset. If empty, clawback is not permitted." />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token clawback address' value={clawBackAddr} onChange={handleClawBackAddr} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl isRequired>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Total Supply</FormLabel>
              <TooltipWrapper label="The total number of base units of the asset to create. This number cannot be changed." />
            </HStack>
            <Input type='number' backgroundColor='#0B1D33' placeholder='Enter your token total supply' value={totalSupply} onChange={handleTotalSupply} />
          </FormControl>
          <FormControl isRequired>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Token Decimal</FormLabel>
              <TooltipWrapper label="The number of digits to use after the decimal point when displaying the asset. If 3, the base unit of the asset is in thousandths, and so on up to 19 decimal places" />
            </HStack>
            <Input type='number' backgroundColor='#0B1D33' placeholder='Enter your token decimal' value={tokenDecimal} onChange={handleTokenDecimal} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Asset URL</FormLabel>
              <TooltipWrapper label="Specifies a URL where more information about the asset can be retrieved. Max size is 96 bytes." />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token asset url' value={assetUrl} onChange={handleAssetUrl} />
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Default Frozen</FormLabel>
              <TooltipWrapper label="True to freeze holdings for this asset by default." />
            </HStack>
            <Switch id='isChecked' size='lg' onChange={handleDefaultFrozen}/>
          </FormControl>
        </div>
      </div>
      <Stack spacing={4} direction='column' align='center' justify='center' py='3rem'>
        <Text fontSize='sm'>(Cost: $20 USD in $FRY)</Text>
        <Button backgroundColor='#00C1F0' disabled={pending} onClick={() => sendTransaction()}>Create Token</Button>
      </Stack>
      <Divider />
    </div>
  )
}

export default TokenInfos;