import { useState, useEffect } from 'react'
import axios from 'axios'
import { useToast } from '@chakra-ui/react'
import { 
  Heading, Text, FormControl, 
  FormLabel, Input, Switch, 
  Button, Stack, Divider, HStack,
  Textarea } from '@chakra-ui/react'
import TooltipWrapper from './TooltipWrapper'

import { 
  useWallet,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_PORT,
 } from '@txnlab/use-wallet'
import algosdk from 'algosdk'
import { FRY_ASSETID, FRY_VAULT, ALGO_VAULT} from './Constants'

// import { useWallet } from "@solana/wallet-adapter-react";

const algodClient = new algosdk.Algodv2(
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_PORT
)

const SolanaTokenInfos = () => {

  const { activeAddress, signTransactions, sendTransactions, getAssets, getAccountInfo } = useWallet()
  const [accountFryAmount, setAccountFryAmount] = useState(0)
  const [pending, setPending] = useState(false)
  const [tokenName, setTokenName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [totalSupply, setTotalSupply] = useState()
  const [tokenDecimal, setTokenDecimal] = useState(0)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [twitterUrl, setTwitterUrl] = useState('')
  const [telegramUrl, settelegramUrl] = useState('')
  const [discordUrl, setDiscordUrl] = useState('')
  const [description, setDescription] = useState('')
  const [mintAuthority, setMintAuthority] = useState(false)
  const [updateAuthority, setUpdateAuthority] = useState(false)
  const [freezeAuthority, setFreezeAuthority] = useState(false)
  const toast = useToast()

  const handleTokenName = (e) => {
    setTokenName(e.target.value)
  }

  const handleSymbol = (e) => {
    setSymbol(e.target.value)
  }

  const handleTotalSupply = (e) => {
    setTotalSupply(e.target.value)
  }

  const handleTokenDecimal = (e) => {
    setTokenDecimal(e.target.value)
  }

  const handleWebsiteUrl = (e) => {
    setWebsiteUrl(e.target.value)
  }

  const handleTwitterUrl = (e) => {
    setTwitterUrl(e.target.value)
  }

  const handleTelegramUrl = (e) => {
    setTelegramUrl(e.target.value)
  }

  const handleDiscordUrl = (e) => {
    setDiscordUrl(e.target.value)
  }

  const handleDescription = (e) => {
    setDescription(e.target.value)
  }

  const handleMintAuthority = (e) => {
    setMintAuthority(e.target.checked)
  }

  const handleUpdateAuthority = (e) => {
    setUpdateAuthority(e.target.checked)
  }

  const handleFreezeAuthority = (e) => {
    setFreezeAuthority(e.target.checked)
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

    if (tokenName.length == 0 || symbol.length == 0 || totalSupply == undefined)
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
                Token Name
              </FormLabel>
              <TooltipWrapper label="The name of the asset. Max size is 32 bytes. Example: Tether" />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token name' value={tokenName} onChange={handleTokenName} />
          </FormControl>
          <FormControl isRequired>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Symbol</FormLabel>
              <TooltipWrapper label="The name of a unit of this asset. Max size is 8 bytes. Example: USDT" />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token symbol' value={symbol} onChange={handleSymbol} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Decimals</FormLabel>
              <TooltipWrapper label="The address of the account that can manage the configuration of the asset and destroy it." />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token manager address' value={tokenDecimal} onChange={handleTokenDecimal} />
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Total Supply</FormLabel>
              <TooltipWrapper label="The total number of base units of the asset to create. This number cannot be changed." />
            </HStack>
            <Input type='number' backgroundColor='#0B1D33' placeholder='Enter your token total supply' value={totalSupply} onChange={handleTotalSupply} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Website URL</FormLabel>
              <TooltipWrapper label="" />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token website URL' value={websiteUrl} onChange={handleWebsiteUrl} />
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Twitter URL</FormLabel>
              <TooltipWrapper label="" />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token Twitter URL' value={twitterUrl} onChange={handleTwitterUrl} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Telegram Group URL</FormLabel>
              <TooltipWrapper label="" />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token telegram group URL' value={telegramUrl} onChange={handleTelegramUrl} />
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Discord URL</FormLabel>
              <TooltipWrapper label="" />
            </HStack>
            <Input type='text' backgroundColor='#0B1D33' placeholder='Enter your token discord URL' value={discordUrl} onChange={handleDiscordUrl} />
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Description</FormLabel>
              <TooltipWrapper label="" />
            </HStack>
            <Textarea type='text' backgroundColor='#0B1D33' placeholder='Enter your token description' value={description} onChange={handleDescription} />
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Mint Authority</FormLabel>
              <TooltipWrapper label="True to mint this asset by default." />
            </HStack>
            <Switch id='isChecked' size='lg' onChange={handleMintAuthority}/>
          </FormControl>
        </div>
        <div className='flex gap-16 max-sm:flex-col'>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Update Authority</FormLabel>
              <TooltipWrapper label="True to update this asset by default." />
            </HStack>
            <Switch id='isChecked' size='lg' onChange={handleUpdateAuthority}/>
          </FormControl>
          <FormControl>
            <HStack align='center' pb='0.5rem'>
              <FormLabel margin='unset'>Freeze Authority</FormLabel>
              <TooltipWrapper label="True to freeze holdings for this asset by default." />
            </HStack>
            <Switch id='isChecked' size='lg' onChange={handleFreezeAuthority}/>
          </FormControl>
        </div>
      </div>
      <Stack spacing={4} direction='row' align='center' justify='center' py='3rem'>
        <Button backgroundColor='#00C1F0' size='md' disabled={pending} onClick={() => sendTransaction()}>Create Token</Button>
      </Stack>
      <Divider />
    </div>
  )
}

export default SolanaTokenInfos;