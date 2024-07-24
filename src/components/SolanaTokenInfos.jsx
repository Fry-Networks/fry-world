import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useToast } from "@chakra-ui/react";
import {
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Button,
  Stack,
  Divider,
  HStack,
  Textarea,
} from "@chakra-ui/react";
import TooltipWrapper from "./TooltipWrapper";
import Loader from "./Loader";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";

import {
  useWallet,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_PORT,
} from "@txnlab/use-wallet";
import algosdk from "algosdk";
import { FRY_ASSETID, FRY_VAULT, ALGO_VAULT, FEE_FAIL, FEE_SUCCESS } from "./Constants";

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  revoke,
  AuthorityType,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  getMinimumBalanceForRentExemptMint,
  getAssociatedTokenAddress,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
} from "@solana/spl-token";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";

const algodClient = new algosdk.Algodv2(
  DEFAULT_NODE_TOKEN,
  DEFAULT_NODE_BASEURL,
  DEFAULT_NODE_PORT
);

const VITE_GATEWAY_URL = "https://sapphire-absent-partridge-46.mypinata.cloud";
const VITE_GATEWAY_KEY =
  "?pinataGatewayToken=REDACTED_ROTATE_ME";
const VITE_PINATA_JWT =
  "REDACTED_ROTATE_ME";
const BASIC_URL = VITE_GATEWAY_URL + "/ipfs/";

const SolanaTokenInfos = () => {
  const {
    activeAddress,
    signTransactions,
    sendTransactions,
    getAssets,
    getAccountInfo,
  } = useWallet();
  const solWallet = useSolanaWallet();
  const [accountFryAmount, setAccountFryAmount] = useState(0);
  const [pending, setPending] = useState(false);
  const [loader, setLoader] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState("");
  const [uploadFile, setUploadFile] = useState("");
  const [metadataUrl, setMetadataUrl] = useState("");
  const hiddenFileInput = useRef(null);

  const [tokenName, setTokenName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState();
  const [tokenDecimal, setTokenDecimal] = useState(6);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [telegramUrl, setTelegramUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [description, setDescription] = useState("");
  const [mintAuthority, setMintAuthority] = useState(false);
  const [updateAuthority, setUpdateAuthority] = useState(false);
  const [freezeAuthority, setFreezeAuthority] = useState(false);
  const toast = useToast();

  const handleTokenName = (e) => {
    setTokenName(e.target.value);
  };

  const handleSymbol = (e) => {
    setSymbol(e.target.value);
  };

  const handleTotalSupply = (e) => {
    setTotalSupply(e.target.value);
  };

  const handleTokenDecimal = (e) => {
    setTokenDecimal(e.target.value);
  };

  const handleWebsiteUrl = (e) => {
    setWebsiteUrl(e.target.value);
  };

  const handleTwitterUrl = (e) => {
    setTwitterUrl(e.target.value);
  };

  const handleTelegramUrl = (e) => {
    setTelegramUrl(e.target.value);
  };

  const handleDiscordUrl = (e) => {
    setDiscordUrl(e.target.value);
  };

  const handleDescription = (e) => {
    setDescription(e.target.value);
  };

  const handleMintAuthority = (e) => {
    setMintAuthority(e.target.checked);
  };

  const handleUpdateAuthority = (e) => {
    setUpdateAuthority(e.target.checked);
  };

  const handleFreezeAuthority = (e) => {
    setFreezeAuthority(e.target.checked);
  };

  const getFRYPrice = async () => {
    try {
      const response = await axios.get(
        `https://free-api.vestige.fi/asset/${FRY_ASSETID}/price`
      );

      // Filter out words with spaces or dashes
      return parseFloat(response.data.USD).toFixed(5);
    } catch (error) {
      console.error(`Error fetching price for ${FRY_ASSETID}:`, error);
      return [];
    }
  };

  const getFRYAmount = async () => {
    const USDPrice = await getFRYPrice();
    const amount = parseInt(20 / USDPrice);
    return amount;
  };

  const sendTransaction = async () => {
    if (!activeAddress) {
      toast({
        title: "Connect Your Algorand Wallet",
        description: "Connect an account first.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return FEE_FAIL;
    }

    if (
      tokenName.length == 0 ||
      symbol.length == 0 ||
      totalSupply == undefined
    ) {
      toast({
        title: "Invalid Value",
        description: "You must enter AssetName, UnitName, TotalSupply values.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return FEE_FAIL;
    }

    setPending(true);

    const assetInfos = await getAssets();
    const accountInfo = await getAccountInfo();
    const fryAmount = await getFRYAmount();

    const filteredInfos = assetInfos.filter((info) => {
      return (
        info["asset-id"] == FRY_ASSETID &&
        parseInt(info.amount / 10 ** 6) < fryAmount
      );
    });

    if (filteredInfos.length) {
      toast({
        title: "Insufficient Balance!",
        description: `Your FRY Asset balance is not enough. You must hold over ${fryAmount} FRY amounts`,
        status: "info",
        duration: 5000,
        isClosable: true,
      });
      setPending(false);
      return FEE_FAIL;
    }

    if (accountInfo.amount == 0) {
      toast({
        title: "Insufficient Balance!",
        description: "Your ALGO balance for gas fee is not enough.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      setPending(false);
      return FEE_FAIL;
    }

    const params = await algodClient.getTransactionParams().do();

    const Txn1 = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: activeAddress,
      to: FRY_VAULT.toString(),
      amount: BigInt(fryAmount * 10 ** 6),
      note: new Uint8Array(Buffer.from("fry.world payment")),
      assetIndex: FRY_ASSETID,
      suggestedParams: params,
    });

    const fryTxn = algosdk.encodeUnsignedTransaction(Txn1);

    const signedTransactions = await signTransactions([fryTxn]);
    const waitRoundsToConfirm = 4;

    const { id } = await sendTransactions(
      signedTransactions,
      waitRoundsToConfirm
    );

    if (id) {
      toast({
        title: "Transaction Comfirmed Successfully!",
        description: `Successfully sent transaction. Transaction ID: ${id} The ${assetName} token created successfully. ${totalSupply} amounts is in your wallet.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
    setPending(false);
    console.log("Successfully sent transaction. Transaction ID: ", id);
    return FEE_SUCCESS;
  };

  //Solana Modules

  useEffect(() => {
    if (userAvatarUrl) setShowLinks(true);
    else setShowLinks(false);
  }, [userAvatarUrl]);
  const handleFile = async (uploadfile) => {
    try {
      setLoader(true);
      const formData = new FormData();
      formData.append("file", uploadfile);
      const metadata = JSON.stringify({
        name: uploadfile.name,
      });

      formData.append("pinataMetadata", metadata);
      const options = JSON.stringify({
        cidVersion: 0,
      });
      formData.append("pinataOptions", options);
      const res = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${VITE_PINATA_JWT}`,
          },
          body: formData,
        }
      );
      const resData = await res.json();
      const imageUrl = BASIC_URL + resData.IpfsHash + VITE_GATEWAY_KEY;

      // After uploading the image, create and upload the metadata JSON
      const metadataJson = {
        totalSupply,
        tokenDecimal,
        image: imageUrl, // URL of the uploaded image
        symbol,
        tokenName,
        description,
        extensions: {
          websiteUrl,
          twitterUrl,
          telegramUrl,
          discordUrl,
        },
      };

      const metadataFormData = new FormData();
      const blob = new Blob([JSON.stringify(metadataJson)], {
        type: "application/json",
      });
      metadataFormData.append("file", blob, "metadata.json");
      const metadataRes = await fetch(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${VITE_PINATA_JWT}`,
          },
          body: metadataFormData,
        }
      );
      const metadataResData = await metadataRes.json();
      const metadataUrl =
        BASIC_URL + metadataResData.IpfsHash + VITE_GATEWAY_KEY;

      setUploadFile(uploadfile.name);
      setUserAvatarUrl(imageUrl); // Keep the image URL
      setMetadataUrl(metadataUrl); // Set the metadata URL to be used as token URI
    } catch (error) {
      console.error(error);
    } finally {
      setLoader(false);
    }
  };

  const captureFile = (event) => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];

    handleFile(file);

    // let reader = new window.FileReader();
    // reader.readAsArrayBuffer(file);
    // reader.onloadend = () => convertToBuffer(reader);
  };

  // const convertToBuffer = async (reader) => {
  //   //file is converted to a buffer to prepare for uploading to IPFS
  //   const buffer = await Buffer.from(reader.result);
  //   setBuf(buffer);
  // };

  const onUpload = (event) => {
    event.preventDefault();
    hiddenFileInput.current.click();
  };

  const createToken = async (
    tokenInfo,
    revokeMintBool,
    revokeUpdateBool,
    revokeFreezeBool
  ) => {
    const connection = new Connection(
      "https://fluent-side-isle.solana-mainnet.quiknode.pro/19a27fc1fa07c0a0aff254ef753b1ba030360b39/"
    );
    const lamports = await getMinimumBalanceForRentExemptMint(connection);
    const mintKeypair = Keypair.generate();
    const myPublicKey = solWallet.publicKey;
    const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
      {
        metadata: PublicKey.findProgramAddressSync(
          [
            Buffer.from("metadata"),
            PROGRAM_ID.toBuffer(),
            mintKeypair.publicKey.toBuffer(),
          ],
          PROGRAM_ID
        )[0],
        mint: mintKeypair.publicKey,
        mintAuthority: myPublicKey,
        payer: myPublicKey,
        updateAuthority: myPublicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: tokenInfo.tokenName,
            symbol: tokenInfo.symbol,
            uri: metadataUrl,
            creators: null,
            sellerFeeBasisPoints: 0,
            uses: null,
            collection: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      }
    );

    const tokenATA = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      myPublicKey
    );

    const createNewTokenTransaction = new Transaction();
    createNewTokenTransaction.add(
      SystemProgram.createAccount({
        fromPubkey: myPublicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MINT_SIZE,
        lamports: lamports,
        programId: TOKEN_PROGRAM_ID,
      }),
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        tokenInfo.decimals,
        myPublicKey,
        myPublicKey,
        TOKEN_PROGRAM_ID
      ),
      createAssociatedTokenAccountInstruction(
        myPublicKey,
        tokenATA,
        myPublicKey,
        mintKeypair.publicKey
      ),
      createMintToInstruction(
        mintKeypair.publicKey,
        tokenATA,
        myPublicKey,
        tokenInfo.amount * Math.pow(10, tokenInfo.decimals)
      ),
      createMetadataInstruction
    );
    // createNewTokenTransaction.feePayer = myKeyPair.publicKey;
    createNewTokenTransaction.feePayer = solWallet.publicKey;

    if (revokeMintBool) {
      let revokeMint = createSetAuthorityInstruction(
        mintKeypair.publicKey, // mint acocunt || token account
        myPublicKey, // current auth
        AuthorityType.MintTokens, // authority type
        null
      );
      createNewTokenTransaction.add(revokeMint);
    }

    if (revokeUpdateBool) {
      let revokeUpdate = createSetAuthorityInstruction(
        mintKeypair.publicKey, // mint acocunt || token account
        myPublicKey, // current auth
        AuthorityType.MintTokens, // authority type
        myPublicKey
      );
      createNewTokenTransaction.add(revokeUpdate);
    }

    if (revokeFreezeBool) {
      let revokeFreeze = createSetAuthorityInstruction(
        mintKeypair.publicKey, // mint acocunt || token account
        myPublicKey, // current auth
        AuthorityType.FreezeAccount, // authority type
        null
      );

      createNewTokenTransaction.add(revokeFreeze);
    }

    // send sol to admin
    // const sendSolInstruction = SystemProgram.transfer({
    //   fromPubkey: myPublicKey,
    //   toPubkey: ADMINWALLET,
    //   lamports: 0.5 * LAMPORTS_PER_SOL,
    // });

    // createNewTokenTransaction.add(sendSolInstruction);

    let blockhash = (await connection.getLatestBlockhash("finalized"))
      .blockhash;
    createNewTokenTransaction.recentBlockhash = blockhash;

    const txHash = await sendCreator(
      connection,
      solWallet,
      createNewTokenTransaction,
      mintKeypair
    );

    return mintKeypair.publicKey;
  };

  const sendCreator = async (connection, wallet, transaction, mintKey) => {
    const txHash = await sendTransactionCreator(
      connection,
      wallet,
      transaction,
      mintKey
    );
    if (txHash != null) {
      toast({
        title: "Confirming Transaction ...",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      let res = await connection.confirmTransaction(txHash);

      if (res.value.err) {
        toast({
          title: "Transaction Failed",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Transaction Confirmed",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
    } else {
      toast({
        title: "Transaction Failed",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
    return txHash;
  };

  const sendTransactionCreator = async (
    connection,
    wallet,
    transaction,
    mintKeypair
  ) => {
    if (wallet.publicKey === null || wallet.signTransaction === undefined) {
      return null;
    }
    try {
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      transaction.feePayer = wallet.publicKey;
      const signedTransaction = await wallet.signTransaction(transaction);
      signedTransaction.partialSign(mintKeypair);
      const rawTransaction = signedTransaction.serialize();
      toast({
        title: "Sending Transaction ...",
        status: "info",
        duration: 1000,
        isClosable: true,
      });

      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        preflightCommitment: "processed",
      });
      return txid;
    } catch (e) {
      return null;
    }
  };

  const handleCreateToken = async () => {
    if (solWallet.publicKey === null || solWallet.publicKey === undefined) {
      toast({
        title: "Connect Your Solana Wallet",
        description: "Connect an account first.",
        status: "info",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const result = await sendTransaction()
      if (result) {
        const tokenInfo = {
          amount: totalSupply,
          decimals: tokenDecimal,
          metadata: metadataUrl,
          symbol: symbol,
          tokenName: tokenName,
        }

        await createToken(
          tokenInfo,
          mintAuthority,
          updateAuthority,
          freezeAuthority
        )
      } else {
        console.log('Could not transfer the fee.')  
      }
    } catch (err) {
      console.log(`Could not create the token: ${err}`)
    }
  };

  return (
    <div className="flex flex-col w-full px-72 py-16 gap-10 max-sm:px-12 max-sm:pt-24">
      <Divider />
      <div className="sm:hidden flex flex-col justify-center items-end space-y-2">
        <WalletMultiButton
          style={{
            fontWeight: 600,
            background: "#030B15",
            borderRadius: "6px",
            border: "1px solid #00C1F0",
            height: "2.5rem",
            color: "#00C1F0",
          }}
        />
      </div>
      <div className="flex justify-between">
        <div className="flex flex-col justify-center items-start space-y-2">
          <Heading as="h5" size="sm" textColor="#00C1F0">
            Token Details
          </Heading>
          <Text color="gray">Enter token details and choose a network</Text>
        </div>
        <div className="max-sm:hidden flex flex-col justify-center items-end space-y-2">
          <WalletMultiButton
            style={{
              fontWeight: 600,
              background: "#030B15",
              borderRadius: "6px",
              border: "1px solid #00C1F0",
              height: "2.5rem",
              color: "#00C1F0",
            }}
          />
        </div>
      </div>
      <div className="flex flex-col gap-8 max-sm:gap-16">
        <div className="flex gap-16 max-sm:flex-col">
          <FormControl isRequired>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Token Name</FormLabel>
              <TooltipWrapper label="The name of the token. Example: Tether" />
            </HStack>
            <Input
              type="text"
              backgroundColor="#0B1D33"
              placeholder="Enter your token name"
              value={tokenName}
              onChange={handleTokenName}
            />
          </FormControl>
          <FormControl isRequired>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Symbol</FormLabel>
              <TooltipWrapper label="The name of a unit of this token. Max size is 10 bytes. Example: USDT" />
            </HStack>
            <Input
              type="text"
              backgroundColor="#0B1D33"
              placeholder="Enter your token symbol"
              value={symbol}
              onChange={handleSymbol}
            />
          </FormControl>
        </div>
        <div className="flex gap-16 max-sm:flex-col">
          <FormControl>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Decimals</FormLabel>
              <TooltipWrapper label="Token decimals refer to the smallest unit to which a cryptocurrency token can be divided." />
            </HStack>
            <Input
              type="text"
              disabled
              backgroundColor="#0B1D33"
              placeholder="Enter your token decimals"
              value={tokenDecimal}
              onChange={handleTokenDecimal}
            />
          </FormControl>
          <FormControl isRequired>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Total Supply</FormLabel>
              <TooltipWrapper label="The total number of base units of the token to create. This number cannot be changed." />
            </HStack>
            <Input
              type="number"
              backgroundColor="#0B1D33"
              placeholder="Enter your token total supply"
              value={totalSupply}
              onChange={handleTotalSupply}
            />
          </FormControl>
        </div>
        <div className="flex gap-16 max-sm:flex-col">
          <FormControl>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Website URL</FormLabel>
              <TooltipWrapper label="The website URL for this token" />
            </HStack>
            <Input
              type="text"
              backgroundColor="#0B1D33"
              placeholder="Enter your token website URL"
              value={websiteUrl}
              onChange={handleWebsiteUrl}
            />
          </FormControl>
          <FormControl>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Twitter URL</FormLabel>
              <TooltipWrapper label="The twitter URL for this token" />
            </HStack>
            <Input
              type="text"
              backgroundColor="#0B1D33"
              placeholder="Enter your token Twitter URL"
              value={twitterUrl}
              onChange={handleTwitterUrl}
            />
          </FormControl>
        </div>
        <div className="flex gap-16 max-sm:flex-col">
          <FormControl>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Telegram Group URL</FormLabel>
              <TooltipWrapper label="The telegram URL for this token" />
            </HStack>
            <Input
              type="text"
              backgroundColor="#0B1D33"
              placeholder="Enter your token telegram group URL"
              value={telegramUrl}
              onChange={handleTelegramUrl}
            />
          </FormControl>
          <FormControl>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Discord URL</FormLabel>
              <TooltipWrapper label="The discord URL for this token" />
            </HStack>
            <Input
              type="text"
              backgroundColor="#0B1D33"
              placeholder="Enter your token discord URL"
              value={discordUrl}
              onChange={handleDiscordUrl}
            />
          </FormControl>
        </div>
        <div className="flex gap-16 max-sm:flex-col">
          <FormControl>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Description</FormLabel>
              <TooltipWrapper label="The description for this token" />
            </HStack>
            <Textarea
              type="text"
              backgroundColor="#0B1D33"
              placeholder="Enter your token description"
              value={description}
              onChange={handleDescription}
            />
          </FormControl>
          <FormControl>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Mint Authority</FormLabel>
              <TooltipWrapper label="This refers to the power held by the creator to mint (create) new tokens." />
            </HStack>
            <Switch id="isChecked" size="lg" onChange={handleMintAuthority} />
          </FormControl>
        </div>
        <div className="flex gap-16 max-sm:flex-col">
          <FormControl>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Update Authority</FormLabel>
              <TooltipWrapper label="True to update authority for this token." />
            </HStack>
            <Switch id="isChecked" size="lg" onChange={handleUpdateAuthority} />
          </FormControl>
          <FormControl>
            <HStack align="center" pb="0.5rem">
              <FormLabel margin="unset">Freeze Authority</FormLabel>
              <TooltipWrapper label="Freeze authority means the creator of a specific coin has the power to freeze any token at any time. True to freeze holdings for this token. " />
            </HStack>
            <Switch id="isChecked" size="lg" onChange={handleFreezeAuthority} />
          </FormControl>
        </div>
        <div className="flex flex-col justify-center items-center w-full gap-2">
          <div className="flex items-start w-4/5">
            <Text color="gray">Symbol Image (ex. Square size 128x128 or larger is recommended.)</Text>
          </div>
          <div className="flex flex-col justify-center w-4/5 gap-6 py-6 border-2 border-dotted rounded-lg">
            <div className="flex justify-center items-center gap-3">
              {loader ? (
                <Loader />
              ) : (
                <>
                  <h5 className="text-[1.3rem]">Upload Token Image: </h5>
                  <button
                    className="flex justify-center px-6 py-6 bg-[#0B1D33]"
                    onClick={onUpload}
                  >
                    <ArrowUpTrayIcon className="h-9 w-9" />
                  </button>
                  <input
                    type="file"
                    className="file-input file-input-bordered w-full max-w-xs hidden"
                    onChange={captureFile}
                    ref={hiddenFileInput}
                  />
                </>
              )}
              {showLinks ? (
                loader ? (
                  <div className="flex justify-center items-center">
                    <span class="loading loading-ring loading-lg"></span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center border-dashed rounded-md border-[1px] border-gray-400 pt-2 px-8">
                    <img
                      src={userAvatarUrl}
                      alt="preview"
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <h6 className="text-[0.9rem]">{uploadFile}</h6>
                  </div>
                )
              ) : (
                <p></p>
              )}
            </div>
            {showLinks ? (
              loader ? (
                <div className="flex justify-center items-center">
                  <span class="loading loading-ring loading-lg"></span>
                </div>
              ) : (
                <label className="text-center">{userAvatarUrl}</label>
              )
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
      <Stack
        spacing={4}
        direction="column"
        align="center"
        justify="center"
        py="3rem"
      >
        <Text fontSize="sm">(Cost: $20 USD in $FRY)</Text>
        <Button
          backgroundColor="#00C1F0"
          size="md"
          disabled={pending}
          onClick={() => handleCreateToken()}
        >
          Create Token
        </Button>
      </Stack>
      <Divider />
    </div>
  );
};

export default SolanaTokenInfos;
