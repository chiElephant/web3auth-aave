import React, { useState, Fragment } from "react";
// import { approve } from "./Components/functions";
import { useSmartAccountContext } from "./contexts/SmartAccountContext";
import { useWeb3AuthContext } from "./contexts/SocialLoginContext";
import "@biconomy/web3-auth/dist/src/style.css"
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {errorPopup, loadingPopup, successPopup, warningPopup} from './utils/PopUpMessage'
import { ABI } from "./utils/ABIs";
import { CONTRACT } from "./utils/contracts";
import Web3 from 'web3'

export default function Main() {

    const {
        address,
        loading: eoaLoading,
        userInfo,
        connect,
        disconnect,
        getUserInfo,
    } = useWeb3AuthContext();

    const {
        selectedAccount,
        loading: scwLoading,
        setSelectedAccount,
    } = useSmartAccountContext();

    const coinsData = [
        { Asset: 'DAI', APY: '1%' },
        { Asset: 'USDC', APY: '1%' },
        { Asset: 'ETH', APY: '1%' }
      ];
    const [web3, setWeb3] = useState(null)

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

    /*''''''''''''''''''''''''''*/
    /* LOGIN AND LOGOUT BUTTONS */
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

            const output = await contract.methods.approve(CONTRACT.Pool, weiValue).send({from: address})
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
                    {LoginButton()}
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