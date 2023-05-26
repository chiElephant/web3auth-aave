import React, { useState, useEffect, useCallback} from "react";
import SocialLogin, { getSocialLoginSDK } from "@biconomy/web3-auth";
import "@biconomy/web3-auth/dist/src/style.css"
import SmartAccount from "@biconomy/smart-account"
import { ethers } from "ethers";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {errorPopup, loadingPopup, successPopup, warningPopup} from './utils/PopUpMessage'
import { ABI } from "./utils/ABIs";
import { CONTRACT } from "./utils/contracts";
import Web3 from 'web3'

export default function Main() {
    const chainIds = {
        ARBITRUM_hex: '0xA4B1',
        ARBITRUM: 42161,
    }

    const activeChainId = chainIds.ARBITRUM

    const initialState = {
        provider: null,
        web3Provider: null,
        ethersProvider: null,
        address: "",
        chainId: activeChainId,
    };

    const heroku_URL = 'https://web3auth-aave.herokuapp.com/'
    const vercel_URL = 'https://web3auth-aave-two.vercel.app'
    const providerUrl = 'https://rpc.ankr.com/arbitrum'
    // const network = 'cyan'

    const [socialLoginSDK, setSocialLoginSDK] = useState(null)
    const [web3State, setWeb3State] = useState(initialState)
    // const [smartAccount, setSmartAccount] = useState(null)
    const [userInfo, setUserInfo] = useState(null)
    const [web3, setWeb3] = useState(null)
    const [wallet, setWallet] = useState(null)
    const [state, setState] = useState(null)
    const [selectedAccount, setSelectedAccount] = useState(null)
    const [smartAccountsArray, setSmartAccountsArray] = useState([])
    const [balance, setBalance] = useState({
        totalBalanceInUsd: 0,
        alltokenBalances: [],
    });
    const [isFetchingBalance, setIsFetchingBalance] = useState(false)

    const { address, provider } = web3State

    const coinsData = [
        { Asset: 'DAI', APY: '1%' },
        { Asset: 'USDC', APY: '1%' },
        { Asset: 'ETH', APY: '1%' }
    ];

    // if wallet is already connected, close widget
    useEffect(() => {
        console.log('hide waller');
        if (socialLoginSDK && socialLoginSDK.provider) {
            socialLoginSDK.hideWallet()
        }
    }, [address, socialLoginSDK])

    const getSmartAccountBalance = useCallback(async () => {
        if (!provider || !address) return "Wallet not connected";
        if (!state || !wallet) return "Init Smart Account First";

        try {
        setIsFetchingBalance(true);
        // ethAdapter could be used like this
        // const bal = await wallet.ethersAdapter().getBalance(state.address);
        // console.log(bal);
        const balanceParams = {
            chainId: activeChainId,
            eoaAddress: state.address,
            tokenAddresses: [],
        };
        const balFromSdk = await wallet.getAlltokenBalances(balanceParams);
        console.info("getAlltokenBalances", balFromSdk);

        const usdBalFromSdk = await wallet.getTotalBalanceInUsd(balanceParams);
        console.info("getTotalBalanceInUsd", usdBalFromSdk);
        setBalance({
            totalBalanceInUsd: usdBalFromSdk.data.totalBalance,
            alltokenBalances: balFromSdk.data,
        });
        setIsFetchingBalance(false);
        return "";
        } catch (error) {
        setIsFetchingBalance(false);
        console.error({ getSmartAccountBalance: error });
        return error.message;
        }
    }, [activeChainId, address, provider, state, wallet])

    const getSmartAccount = useCallback(async () => {
        if (!provider || !address) return 'Wallet not connected';

        try {
            const walletProvider = new ethers.providers.Web3Provider(provider);
            console.log('walletProvider', walletProvider);

            //New instance, all config params are optional
            const wallet = new SmartAccount(walletProvider, {
                activeNetworkId: activeChainId,
                supportedNetworksIds: [activeChainId],
                networkConfig: [
                    {
                        chainId: activeChainId,
                        // dappAPIKey: todo
                        providerUrl: providerUrl
                    }

                ]
            });
            console.log('wallet', wallet);

            // Wallet initialization to fetch wallet info
            const smartAccount = await wallet.init();
            setWallet(wallet);
            console.log('smartAccount:', smartAccount);

            smartAccount.on('txHashGenerated', (response) => {
                console.log(
                    'txHashGenerated event received in AddLP via emitter', response
                );
            });

            smartAccount.on("txHashChanged", (response: any) => {
                console.log(
                "txHashChanged event received in AddLP via emitter",
                response
                );
            });

            smartAccount.on("txMined", (response: any) => {
                console.log("txMined event received in AddLP via emitter", response);
            });

            smartAccount.on("error", (response: any) => {
                console.log("error event received in AddLP via emitter", response);
            });

            // Get all smart account versions available and update in state
            const { data } = await smartAccount.getSmartAccountsByOwner({
                chainId: activeChainId,
                owner: address,
            })

            console.log('getSmartAccountsByOwner', data);
            const accountData = [];
            for (let i = 0; i < data.length; i++) {
                accountData.push(data[i])
            }
            setSmartAccountsArray(accountData);

            // Set the first wallet version as default

            if (accountData.length) {
                wallet.setSmartAccountVersion(accountData[0].version);
                setSelectedAccount(accountData[0])
                getSmartAccountBalance()
            }
            // get address, is Deployed and other data
            const state = await smartAccount.getSmartAccountState();
            setState(state)
            console.log('getSmartAccountState', state);
            return '';

        } catch (error) {
            console.error({ getSmartAccount: error});
            return error.message;
        }

    }, [provider, address, activeChainId, getSmartAccountBalance])

    useEffect(() => {
        if (wallet && selectedAccount) {
        console.log("setSmartAccountVersion", selectedAccount);
        wallet.setSmartAccountVersion(selectedAccount.version);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAccount])

    useEffect(() => {
        getSmartAccount();
    }, [getSmartAccount])

    const loadWeb3 = async () => {
        //Initiate the web3 library
        if (window.ethereum) {

            window.ethereum.request({method: 'eth_requestAccounts'});
            const getWeb3 = new Web3(window.ethereum);
            setWeb3(getWeb3)
        } else if (window.web3) {
            window.web3 = new Web3(window.web3.currentProvider)
            warningPopup("Wallet balance not updated")
        } else {
        window.alert('Non-ethereum browser detected.')
        }
        //Load user wallet info
        /*const netid = await web3.eth.net.getId(); //get current network connected
        setNetworkID(netid)
        console.log('Network ID: ',networkID)

        const accounts = (await web3.eth.getAccounts())[0]; //get wallet public address
        setAccount(accounts)
        console.log('Wallet Address: ',account)

        const weiWalletBalance = await web3.eth.getBalance(account);
        const ethWalletBalance = web3.utils.fromWei(weiWalletBalance,'ether');
        setNativeWalletBalance(+(ethWalletBalance))
        console.log('Native tokens balance: ',nativeWalletBalance)

        //Get USDC balance
        const USDCABI = CONTRACT.USDCABI;
        const USDCAddress = MUMBAICONTRACT.USDCTestnet;
        const USDCContract = new web3.eth.Contract(USDCABI, USDCAddress);
        var USDCBalance = await USDCContract.methods.balanceOf(account).call();
        setUsdcWalletBalance(+(USDCBalance))
        console.log('USDC tokens balance: ',usdcWalletBalance)

        //Get USDT balance
        const USDTABI = CONTRACT.USDTABI;
        const USDTAddress = MUMBAICONTRACT.USDTTestnet;
        const USDTContract = new web3.eth.Contract(USDTABI, USDTAddress);
        var USDTBalance = await USDTContract.methods.balanceOf(account).call();
        setUsdtWalletBalance(+(USDTBalance))
        console.log('USDT tokens balance: ',usdtWalletBalance)

        //Get DAI balance
        const DaiABI = CONTRACT.DAIABI;
        const DaiAddress = MUMBAICONTRACT.DAITestnet;
        const DaiContract = new web3.eth.Contract(DaiABI, DaiAddress);
        var DaiBalance = await DaiContract.methods.balanceOf(account).call();
        setDaiWalletBalance(+(DaiBalance))
        console.log('DAI tokens balance: ',daiWalletBalance)

        //Get WBTC balance
        const WBTCABI = CONTRACT.WBTCABI;
        const WBTCAddress = MUMBAICONTRACT.WBTCTestnet;
        const WBTCContract = new web3.eth.Contract(WBTCABI, WBTCAddress);
        var WBTCBalance = await WBTCContract.methods.balanceOf(account).call();
        setWBTCWalletBalance(+(WBTCBalance))
        console.log('WBTC tokens balance: ',wbtcWalletBalance)

        //Get WETH balance
        const WETHABI = CONTRACT.WETHABI;
        const WETHAddress = MUMBAICONTRACT.WETHTestnet;
        const WETHContract = new web3.eth.Contract(WETHABI, WETHAddress);
        var WETHBalance = await WETHContract.methods.balanceOf(account).call();
        setWethWalletBalance(+(WETHBalance))
        console.log('WETH tokens balance: ',wethWalletBalance)
        successPopup("Wallet balance updated")*/
    }

    const connect = useCallback(async () => {
        if (address) return;

        if (socialLoginSDK?.provider) {
            console.info("socialLoginSDK.provder: ", socialLoginSDK.provider);

            const web3Provider = new ethers.providers.Web3Provider(socialLoginSDK.provider)

            const signer = web3Provider.getSigner();
            const gotAccount = await signer.getAddress();
            const network = await web3Provider.getNetwork();

            setWeb3State({
                provider: socialLoginSDK.provider,
                web3Provider: web3Provider,
                ethersProvider: web3Provider,
                address: gotAccount,
                chainId: Number(network.chainId)
            })
            return;
        }

        if (socialLoginSDK) {
            socialLoginSDK.showWallet();
            return socialLoginSDK;
        }

        const sdk = new SocialLogin();
        const signiture1 = await sdk.whitelistUrl(heroku_URL)
        const signiture2 = await sdk.whitelistUrl(vercel_URL)

        await sdk.init({
            // chainId: chainIds.ARBITRUM_hex,
            whitelistUrls: {
                [heroku_URL]: signiture1,
                [vercel_URL]: signiture2,
            },
            // network: network,
            // rpcTarget: rpcTarget
        })

        sdk.showWallet();
        setSocialLoginSDK(sdk);
        return socialLoginSDK;

    }, [address, socialLoginSDK])

    const getUserInfo = useCallback(async () => {
        if (socialLoginSDK) {
            const userInfo = await socialLoginSDK.getUserInfo();
            console.log("userInfo: ", userInfo);
            setUserInfo(userInfo);
        }
    }, [socialLoginSDK])

    // after metamask login -> get provider event
    useEffect(() => {
        const interval = setInterval(async () => {
            if (address) {
                clearInterval(interval);
            }
            if (socialLoginSDK?.provider && !address) {
                connect();
            }
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    }, [address, connect, socialLoginSDK])

    const disconnect = useCallback(async () => {
        if (!socialLoginSDK || !socialLoginSDK.web3auth) {
            console.error("Web3Modal not initialized.");
            return
        }
        await socialLoginSDK.logout();
        setWeb3State({
            provider: null,
            web3Provider: null,
            etherProvider: null,
            address: '',
            chainId: activeChainId,
        })
        setUserInfo(null);
        window.getSocialLoginSDK = null;
        socialLoginSDK.hideWallet();
        setSocialLoginSDK(null);
    }, [socialLoginSDK, activeChainId]);

    /*''''''''''''''''''''''''''*/
    /* LOGIN, LOGOUT, and USER INFO BUTTONS */
    /*''''''''''''''''''''''''''*/
    function LoginButton() {
        return(
            <div className="mb-4 mt-4">
                    <p className="text-center"><i>
                        Login with your wallet provider or create a new wallet using your Gmail.
                    </i></p>
                <button type="button" id="btn-login" className="btn btn-orange shadow-sm" onClick={connect}>
                    Connect web3auth
                </button>
            </div>
        )
    }

    function LogoutButton() {
        return (
            <>
                {selectedAccount && address && (
                    <div>
                        <h2>EOA Address</h2>
                        <p>{selectedAccount.eoaAddress}</p>
                    </div>
                )}
                {selectedAccount && address && (
                    <div>
                        <h2>Smart Account Address</h2>
                        <p>{selectedAccount.smartAccountAddress}</p>
                        <h2>Balance (usd)</h2>
                        <p>{balance.totalBalanceInUsd}</p>
                    </div>
                )}
                <div>
                    <button type="button" id="btn-login" className="btn btn-grey shadow-sm" onClick={() => {
                        setSelectedAccount(null);
                        disconnect();
                        }}>
                            Logout
                    </button>
                </div>
            </>
        )
    }

    function UserDataButton() {
        return(
            <div className="mb-4 mt-4">
                <button type="button" id="btn-login" className="btn btn-orange shadow-sm" onClick={getUserInfo}>
                    Show User Info
                </button>
            </div>
        )
    }

    /*''''''''''''''''''''''*/
    /* AAVE V3 approve */
    /*''''''''''''''''''''''*/
    async function approve(e, token, depositValue) {

        if (depositValue <= 0) {
            errorPopup('Cannot be 0 or negative')
            return
        }
        // verify the wallet has enough funds:

        try {
            console.log(web3)
            const weiValue = web3.utils.toWei(depositValue.toString(), 'ether');
            const assetAddress = CONTRACT[token]

            //approve tokens
            const contract = new web3.eth.Contract(
                ABI.ERC20,
                assetAddress
            );

            const output = await contract.methods.approve(CONTRACT.Pool, weiValue).send({from: selectedAccount})
            .on('transactionHash', function(){
                loadingPopup("Transaction pending...")
            })
            .on('receipt', function(){
                successPopup("Transaction succeeded")
            });

        console.log(output)

            } catch (e) {
            console.log(e);
            }

    }

    // Config of buttons to deposit/withdraw into Aave protocol (to be finalized with web3.js and relevant contracts)
    const ApproveTemplate = (rowData) => {
        let assetRow = rowData.Asset

        switch (assetRow)

        {
            case "DAI":
                return (
                    <button type="button" className="btn rounded-pill btn-white shadow-sm" style={{fontSize: "15px" }} onClick={(e) => { approve(e, 'DAI', 1) }} >
                        Approve DAI
                    </button>
                )

            case "USDC":
                return (
                    <button type="button" className="btn rounded-pill btn-white shadow-sm" data-toggle="modal" data-target="#depositTableModal" style={{fontSize: "15px" }} >
                        Approve USDC
                    </button>
                )

            case "ETH":
                return (
                    <button type="button" className="btn rounded-pill btn-white shadow-sm" data-toggle="modal" data-target="#depositTableModal" style={{fontSize: "15px" }} >
                        Approve ETH
                    </button>
                )

            default:
                console.log(assetRow);
        }
    }

    const DepositTemplate = (rowData) => {
        let assetRow = rowData.Asset

        switch (assetRow)

        {
            case "DAI":
                return (
                    <button type="button" className="btn rounded-pill btn-white shadow-sm" data-toggle="modal" data-target="#depositTableModal" style={{fontSize: "15px" }} >
                        Deposit DAI
                    </button>
                )

            case "USDC":
                return (
                    <button type="button" className="btn rounded-pill btn-white shadow-sm" data-toggle="modal" data-target="#depositTableModal" style={{fontSize: "15px" }} >
                        Deposit USDC
                    </button>
                )

            case "ETH":
                return (
                    <button type="button" className="btn rounded-pill btn-white shadow-sm" data-toggle="modal" data-target="#depositTableModal" style={{fontSize: "15px" }} >
                        Deposit ETH
                    </button>
                )

            default:
                console.log(assetRow);
        }
    }

    const WithdrawTemplate = (rowData) => {
        let assetRow = rowData.Asset

        switch (assetRow)

        {
            case "DAI":
                return (
                    <button type="button" className="btn rounded-pill btn-white shadow-sm" data-toggle="modal" data-target="#depositTableModal" style={{fontSize: "15px" }} >
                        Withdraw DAI
                    </button>
                )

            case "USDC":
                return (
                    <button type="button" className="btn rounded-pill btn-white shadow-sm" data-toggle="modal" data-target="#depositTableModal" style={{fontSize: "15px" }} >
                        Withdraw USDC
                    </button>
                )

            case "ETH":
                return (
                    <button type="button" className="btn rounded-pill btn-white shadow-sm" data-toggle="modal" data-target="#depositTableModal" style={{fontSize: "15px" }} >
                        Withdraw ETH
                    </button>
                )

            default:
                console.log(assetRow);
        }
    }

    return (
        <>
        <div className="background">
            {/*Login*/}
            <section className="section">
                <div className="center">
                    {!address ? LoginButton() : 'Welcome'}
                </div>
                <div className="mb-4 mt-4">
                    <div className="text-center">
                        {address ? LogoutButton() : "Wallet not connected"}
                    </div>
                </div>
                <div className="mb-4 mt-4">
                    <div className="text-center">
                        {!userInfo && address ? UserDataButton() : "Connect to see info"}
                    </div>
                </div>
                {userInfo && (
                    <div style={{ maxWidth: 800, wordBreak: "break-all" }}>
                        <h2>User Info</h2>
                        <pre style={{ whiteSpace: "pre-wrap" }}>
                            {JSON.stringify(userInfo, null, 2)}
                        </pre>
                    </div>
                )}
            </section>

            <hr />

            {/*Aave*/}
            <section className="section">
                <div className="center">
                    <div className="white">
                    <DataTable value={coinsData} showGridlines responsiveLayout="scroll">
                        <Column field="Asset" header="Asset" bodyClassName="text-center" style={{ width: '200px' }} alignHeader={'center'} ></Column>
                        <Column field="Approve" header="Approve" body={ApproveTemplate} bodyClassName="text-center" style={{ width: '200px' }} alignHeader={'center'} ></Column>
                        <Column field="Deposit" header="Deposit" body={DepositTemplate} bodyClassName="text-center" style={{ width: '200px' }} alignHeader={'center'} ></Column>
                        <Column field="Withdraw" header="Withdraw" body={WithdrawTemplate} bodyClassName="text-center" style={{ width: '200px' }} alignHeader={'center'} ></Column>
                    </DataTable>
                    </div>
                </div>
            </section>
        </div>
        </>
    )
}