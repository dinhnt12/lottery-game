import './App.css';
import Web3 from "web3";
import {useState, useEffect} from "react"
import detectEthereumProvider from '@metamask/detect-provider'
import { FaucetAddr, FaucetABI, LotteryAddr, LotteryABI, TokenPayAddr, ERC20ABI} from './config';

export const ApproveAmount = '115792089237316195423570985008687907853269984665640564039457584007913129639935';

function App() {

  //web3
  const [web3Api, setWeb3Api] = useState({
    provider: null,
    web3: null
  })
  const [web3Obj, setWeb3Obj] = useState({
    faucet: null,
    lottery: null
  })
  const [faucetInfo, setAddFaucet] = useState({
    addressFaucet: '',
    balance: 0
  });
  const [myInfo, setMyInfo] = useState({
    isApproval: false,
    imAdmin: false
  })

  //account
  const [account, setAccount] = useState(null)
  //balance
  const [lotteryInfo, setLotteryInfo] = useState(
    {
      totalDeposit: 0,
      players: 0,
      ticketWin: null,
      myTicket: null
    }
  )

  const realtimeAccChange = (provider) => {
    provider.on("accountChanged", accounts => setAccount(accounts[0]))
  }

  useEffect(() => {
    const loadProvider = async() => {
      const provider = await detectEthereumProvider()
      if (provider){
        realtimeAccChange(provider)
        const web3 = new Web3(provider);
        setWeb3Api({
          web3: web3,
          provider: provider
        })
        setWeb3Obj({
          faucet: new web3.eth.Contract(FaucetABI, FaucetAddr),
          lottery: new web3.eth.Contract(LotteryABI, LotteryAddr),
        })
      } else {
        console.log('Please install Metamask')
      }
    }
    loadProvider()
  }, [])

  useEffect(() => {
    const getAccount = async () => {
      const ac = await web3Api.web3.eth.getAccounts()
      setAccount(ac[0])
    }
    web3Api.web3 && getAccount()
  }, [web3Api.web3])

  useEffect(() => {
    if (! web3Obj.faucet || ! web3Obj.lottery || ! web3Api.web3 || ! account) return
    const getFaucetInfo = async () => {
      const bl = await web3Obj.faucet.methods.getContractBalance().call();
      setAddFaucet({...faucetInfo, balance: Number(bl)})
    }
    const getLotteryInfo = async () => {
      const players = await web3Obj.lottery.methods.counter().call();
      let contract = new web3Api.web3.eth.Contract(ERC20ABI, TokenPayAddr);
      let bl = await contract.methods.balanceOf(LotteryAddr).call();
      const totalBal = Number(bl) / 10 ** 18;
      let ticketWin, myTicket;
      try {
        myTicket =  await web3Obj.lottery.methods.fetchMyTicket().call({from: account});
      } catch(e) {
        console.log('myTicket', e)
      }
      try {
        ticketWin =  await web3Obj.lottery.methods.fetchTicketWinner().call();
      } catch(e) {
        console.log('ticketWin', e)
      }
      setLotteryInfo((lotteryInfo) => ({...lotteryInfo, 
        players: players,
        totalDeposit: totalBal,
        myTicket: myTicket,
        ticketWin: ticketWin
      }))
    }

    const updateMyInfo = async () => {
      // check enable
      let contract = new web3Api.web3.eth.Contract(ERC20ABI, TokenPayAddr);
      let allow = await contract.methods.allowance(account, LotteryAddr).call();
      console.log(allow)
      if ((Number(allow) / 10 ** 18) >= 10) {
        setMyInfo((myInfo) => ({...myInfo, isApproval: true}))
      }
      let owner = await web3Obj.lottery.methods.owner().call();
      if (owner && owner.toLowerCase() === account.toLowerCase()){
        setMyInfo((myInfo) => ({...myInfo,
          imAdmin: true}))
      }
    }

    web3Obj.faucet && getFaucetInfo() && getLotteryInfo() && updateMyInfo()
  }, [web3Api, web3Obj, account])

  //
  const changeFaucet = (e) => {
    console.log(e)
    setAddFaucet((faucetInfo) => ({...faucetInfo,
      addressFaucet: e.target.value
    }))
  }

  const WalletLabel = (account > 0)
    ? `${account.slice(0, 6)}...${account.slice(account.length - 4)}`
    : 'CONNECT';

  const getClaimForUser = async (e) => {
    console.log('getClaimForUser')
    if (web3Obj && account) {
      await web3Obj.faucet.methods.claimTokens().send({from: account})
      window.location.reload();
    }
  }

  const buyTicket = async (e) => {
    console.log('buyTicket')
    if (web3Obj && account) {
      // check enable
      if (!myInfo.isApproval) {
        let contract = new web3Api.web3.eth.Contract(ERC20ABI, TokenPayAddr);
        let rs = await contract.methods.approve(
          LotteryAddr,
          ApproveAmount.toLocaleString().replace(/,/g, '')).send({ from: account }
        );
        window.location.reload();
        return rs
      }
      await web3Obj.lottery.methods.buyTicket().send({from: account})
      window.location.reload();
    }
  }

  const closeGame = async (e) => {
    console.log('admin close')
    if (web3Obj && account) {
      // let owner = await web3Obj.lottery.methods.owner().call();
      if (!myInfo.imAdmin) return
      await web3Obj.lottery.methods.closeGame().send({from: account})
      window.location.reload();
    }
  }

  return (
  <div class="container is-fullhd">
    {/* line1 */}
    <div class="columns is-desktop is-vcentered" style={{margin: '25px 50px'}}>
      <div class="column is-four-fifths cl-center"><h2>HELLO KITTY</h2></div>
      <div class="column">
        <button class="button is-warning"
          onClick={() => web3Api.provider.request({ method: "eth_requestAccounts" })}>
          {WalletLabel}
        </button>
      </div>
    </div>
    {/* line 2 */}
    <div class="columns is-centered" style={{margin: '25px 50px'}}>
      <nav class="level is-desktop">
        <div class="level-item has-text-centered" style={{margin: '25px 70px', paddingRight: '50px'}}>
          <div>
            <p class="heading" style={{fontSize: '15px'}} >TOTAL DEPOSIT</p>
            <p class="title" style={{fontSize: '50px'}}>{lotteryInfo.totalDeposit}</p>
          </div>
        </div>
        <div class="level-item has-text-centered">
          <div>
            <p class="heading" style={{fontSize: '15px'}} >PLAYERS</p>
            <p class="title" style={{fontSize: '50px'}} >{lotteryInfo.players}</p>
          </div>
        </div>
      </nav>
    </div>
    {/* line 3 */}
    <div class="columns is-centered">
      <div class="column is-half">
        <div class="content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <div style={{ textAlign: 'left'}}>
            <h2>Your ticket: 
              { lotteryInfo.myTicket && <span class="tag is-info is-light is-rounded is-large" style={{fontSize: '40px'}}>  {lotteryInfo.myTicket}</span> }
            </h2>
            {
              <button class="button is-info is-active is-medium" onClick={buyTicket} disabled= {lotteryInfo.myTicket ? true : false} >{myInfo.isApproval ? "Betting": "Approve"}</button>
            }
            {
              myInfo.imAdmin && <p>(*) You are admin, you cannot play the game</p>
            }
          </div>
        </div>
      </div>
      <div class="column is-half">
        <div class="content">
          <h2>Faucet: {faucetInfo.balance} BUSD</h2>
          <p>You can claim: <strong>{100} BUSD</strong> from faucet, each account only 1 time.</p>
        </div>
        <div class="field has-addons">
          <div class="control is-expanded">
            <input class="input is-normal" type="text" placeholder="Input your BSC address..." value={faucetInfo.addressFaucet} onChange={changeFaucet}></input>
          </div>
          <div class="control">
            <button class="button is-info" onClick={getClaimForUser}>
              Claim BUSD
            </button>
          </div>
        </div>
      </div>
    </div>
    {/* line 4 */}
    <div class="columns is-centered">
      <div class="content" style={{margin: '50px 0'}}>
        <h2 style={{textAlign: 'center'}}> 
        { myInfo.imAdmin &&
          <button class="button is-danger" onClick={closeGame}> Stop Game </button>
        }
        &nbsp;&nbsp;&nbsp; Ticket Winning &nbsp; { lotteryInfo.ticketWin ? <span class="tag is-danger">Closed</span> : <span class="tag is-success">Openning</span>}
        </h2> { lotteryInfo.ticketWin &&
        <div style={{textAlign: 'center'}}>
          <span class="tag is-warning is-light is-rounded is-large is-centered" style={{fontSize: '40px'}}>{lotteryInfo.ticketWin}</span>
        </div>
        }
        {/* <h3 style={{textAlign: 'center'}}>List Winner</h3>
        <div>
          <table class="table is-centered">
            <thead>
              <tr>
                <th>Address</th>
                <th>Reward(BUSD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>{"0xw13123131"}</th>
                <th>{10}</th>
              </tr>
            </tbody>
          </table>
        </div> */}
      </div>
    </div>
  </div>
  
  );
}

export default App;
