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

import { FRY_VAULT, ALGO_VAULT} from './Constants'
import query from '../assets/query.png'
import TooltipWrapper from './TooltipWrapper'

const algodClient = new algosdk.Algodv2(
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_PORT
)

const TokenInfos = () => {

  const { activeAddress, signTransactions, sendTransactions, getAssets, getAccountInfo } = useWallet()
  const [accountFryAmount, setAccountFryAmount] = useState(0)
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

  const [fryAssetId, setFryAssetId] = useState('');
  const [feePrice, setFeePrice] = useState(0);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // `https://4c34-198-23-148-18.ngrok-free.app/getPrice`,
        const response = await axios.post(
          `https://depin.frynetworks.com/getPrice`,
          JSON.stringify({ project_name: 'Fry World' }),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
  
        if (!response.data.success) {
          toast({
            title: 'Invalid Value',
            description: `Can't fetch Price data`,
            status: 'info',
            duration: 3000,
            isClosable: true,
          })
          return
        }
        setFryAssetId(response.data.data.asset_id === '11111111111' ? '0' : response.data.data.asset_id);
        setFeePrice(response.data.data.price);
  
        console.log('API getPrice : ', response);
        
      } catch (error) {
        console.error(`Error fetching price for ${fryAssetId}:`, error);
        return
      }
    }

    fetchData();
  }, [activeAddress])

  const getFRYPrice = async () => {
    try {
      const fryURL = `https://api.vestigelabs.org/assets/price?asset_ids=${fryAssetId}`;
      const response = await axios.get(fryURL);
      const price = parseFloat(response.data[0].price) * 2 / 10;
      return price.toFixed(6);
    } catch (error) {
      console.error(`Error fetching price for ${fryAssetId}:`, error);
      return [];
    }
  }

  const getFRYAmount = async () => {
    const USDPrice = await getFRYPrice()
    const amount = parseInt(feePrice / USDPrice)
    return amount
  }

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

    if (feePrice === 0) {
      toast({
        title: 'Invalid Value',
        description: 'The payment for Fee is disabled.',
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
      return info['asset-id'] == fryAssetId && parseInt(info.amount / 10**6) < fryAmount;
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
      assetIndex: fryAssetId,
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
      
      console.log("Successfully sent transaction. Transaction ID: ", id);

      try {
        // 'https://4c34-198-23-148-18.ngrok-free.app/setTokenLogs',
        const response = await axios.post(
          'https://depin.frynetworks.com/setTokenLogs',
          JSON.stringify({ address: activeAddress, asset_id: fryAssetId, price: feePrice, txId: id, createdAt: new Date() }),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
  
        console.log(response.status);
        if (response.status) {
          toast({
            title: 'Creating Token Event',
            description: 'Saved created token history.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })  
        } else {
          toast({
            title: 'Creating Token Event',
            description: 'Failed to Save created token history.',
            status: 'info',
            duration: 3000,
            isClosable: true,
          })
        }
      } catch (e) {
        toast({
          title: 'Failed To Request API Call!',
          description: e.message,
          status: 'info',
          duration: 3000,
          isClosable: true,
        })
      }
    }
    setPending(false)
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
        <Heading as='h5' size='sm' textColor='primary'>Token Details</Heading>
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
            <Input type='text' border='1px solid #ff0000' color='black' backgroundColor='white' placeholder='Enter your token asset name' value={assetName} onChange={handleAssetName} />
          </FormControl>
          <FormControl isRequired>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Unit Name</FormLabel>
              <TooltipWrapper label="The name of a unit of this asset. Max size is 8 bytes. Example: USDT" />
            </HStack>
            <Input type='text' border='1px solid #ff0000' color='black' backgroundColor='white' placeholder='Enter your token unit name' value={unitName} onChange={handleUnitName} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Manager Address</FormLabel>
              <TooltipWrapper label="The address of the account that can manage the configuration of the asset and destroy it." />
            </HStack>
            <Input type='text' border='1px solid #ff0000' color='black' backgroundColor='white' placeholder='Enter your token manager address' value={managerAddr} onChange={handleManagerAddr} />
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Reserve Address</FormLabel>
              <TooltipWrapper label="The address of the account that holds the reserve (non-minted) units of the asset. This address has no specific authority in the protocol itself." />
            </HStack>
            <Input type='text' border='1px solid #ff0000' color='black' backgroundColor='white' placeholder='Enter your token reserve address' value={reserveAddr} onChange={handleReserveAddr} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Freeze Address</FormLabel>
              <TooltipWrapper label="The address of the account used to freeze holdings of this asset. If empty, freezing is not permitted." />
            </HStack>
            <Input type='text' border='1px solid #ff0000' color='black' backgroundColor='white' placeholder='Enter your token freeze address' value={freezeAddr} onChange={handleFreezeAddr} />
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>ClawBack Address</FormLabel>
              <TooltipWrapper label="The address of the account that can clawback holdings of this asset. If empty, clawback is not permitted." />
            </HStack>
            <Input type='text' border='1px solid #ff0000' color='black' backgroundColor='white' placeholder='Enter your token clawback address' value={clawBackAddr} onChange={handleClawBackAddr} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl isRequired>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Total Supply</FormLabel>
              <TooltipWrapper label="The total number of base units of the asset to create. This number cannot be changed." />
            </HStack>
            <Input type='number' border='1px solid #ff0000' color='black' backgroundColor='white' placeholder='Enter your token total supply' value={totalSupply} onChange={handleTotalSupply} />
          </FormControl>
          <FormControl isRequired>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Token Decimal</FormLabel>
              <TooltipWrapper label="The number of digits to use after the decimal point when displaying the asset. If 3, the base unit of the asset is in thousandths, and so on up to 19 decimal places" />
            </HStack>
            <Input type='number' border='1px solid #ff0000' color='black' backgroundColor='white' placeholder='Enter your token decimal' value={tokenDecimal} onChange={handleTokenDecimal} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Asset URL</FormLabel>
              <TooltipWrapper label="Specifies a URL where more information about the asset can be retrieved. Max size is 96 bytes." />
            </HStack>
            <Input type='text' border='1px solid #ff0000' color='black' backgroundColor='white' placeholder='Enter your token asset url' value={assetUrl} onChange={handleAssetUrl} />
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Default Frozen</FormLabel>
              <TooltipWrapper label="True to freeze holdings for this asset by default." />
            </HStack>
            <Switch
              id='isChecked' 
              size='lg' 
              onChange={handleDefaultFrozen}
            />
          </FormControl>
        </div>
      </div>
      <Stack spacing={4} direction='column' align='center' justify='center' py='3rem'>
        <Text fontSize="sm">(Cost: ${feePrice} USD in $FRY)</Text>
        <Button 
          backgroundColor='primary' 
          size='md' 
          disabled={pending} 
          _hover={{
            borderColor: '#ff0000',
            bg: 'transparent',
            color: '#ff0000'
          }}
          onClick={() => sendTransaction()}
        >
          Create Token
        </Button>
      </Stack>
      <Divider />
    </div>
  )
}

export default TokenInfos;