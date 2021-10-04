import logo from './logo.svg';
import './App.css';
import * as waxjs from "@waxio/waxjs/dist"; 
import * as axios from 'axios';

import react from 'react';

let wax = null;

function App() {

  const [tools, setTools] = react.useState([]);
  const [account, setAccount] = react.useState(null);
  const [pubkey, setPubkey] = react.useState(null);
  const [nextSlot, setNextSlot] = react.useState(9999999999);
  const [needLogin, setNeedLogin] = react.useState(true);

  react.useEffect( async () => {

    wax = new waxjs.WaxJS({
      rpcEndpoint: 'https://wax.greymass.com',
      tryAutoLogin: false
    });

    setInterval(async () => {
      const timenow = Math.floor((new Date()).getTime() / 1000);

      var isAutoLoginAvailable = await wax.isAutoLoginAvailable();
      if(isAutoLoginAvailable) {
        setNeedLogin(false);
      } else {
        setNeedLogin(true);
      }

      let res = await axios.default.post("https://chain.wax.io/v1/chain/get_table_rows", 
      {
        "code": "farmersworld",
        "json": "true",
        "table": "tools",
        "scope": "farmersworld",
        "index_position": 2,
        "key_type": "i64",
        "encode_type": "string",
        "lower_bound": wax.userAccount,
        "upper_bound": wax.userAccount,
        "limit": 10,
        "reverse": false,
        "show_payer": false
      });

      console.log(res.data.rows);
      console.log(res.data.rows[0].next_availability);
      console.log(timenow);

      if(wax && wax.userAccount && timenow > res.data.rows[0].next_availability) {

        console.log('claiming tool: ' + res.data.rows[0].asset_id);

        try {
          const result = await wax.api.transact({
            actions: [{
              account: 'farmersworld',
              name: 'claim',
              authorization: [{
                actor: wax.userAccount,
                permission: 'active',
              }],
              data: {
                asset_id: res.data.rows[0].asset_id,
                owner: wax.userAccount
              },
            }]
          }, {
            blocksBehind: 3,
            expireSeconds: 1200,
          });

          console.log(result);
        }
        catch (e) {
          console.log(e);
        }
      }
    }, 60000);
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Welcome to farmersworld
        </p>
        { needLogin &&
         <button onClick={ async () => {
          await wax.login();

          setAccount(wax.userAccount);
          setPubkey(wax.pubKeys);

          let res = await axios.default.post("https://chain.wax.io/v1/chain/get_table_rows", {
            "code": "farmersworld",
            "json": "true",
            "table": "tools",
            "scope": "farmersworld",
            "index_position": 2,
            "key_type": "i64",
            "encode_type": "string",
            "lower_bound": wax.userAccount,
            "upper_bound": wax.userAccount,
            "limit": 10,
            "reverse": false,
            "show_payer": false
            })
            
          setTools(res.data.rows);
          setNeedLogin(false);
          
        }}>
          login
        </button> 
        }
      </header>
    </div>
  );
}

export default App;
