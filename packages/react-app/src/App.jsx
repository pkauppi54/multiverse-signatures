import { Button, Col, Menu, Row, Select } from "antd";
import "antd/dist/antd.css";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserAddress,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
import React, { useCallback, useEffect, useState } from "react";
import { Link, Route, Switch, useLocation } from "react-router-dom";
import "./App.css";
import {
  Account,
  Contract,
  Faucet,
  GasGauge,
  Header,
  Ramp,
  ThemeSwitch,
  NetworkDisplay,
  FaucetHint,
  NetworkSwitch,
} from "./components";
import { CreateMultiverseModal, ImportMultiverseModal } from "./components/Multiverse";
import { NETWORKS, ALCHEMY_KEY } from "./constants";
import externalContracts from "./contracts/external_contracts";
// contracts
import deployedContracts from "./contracts/hardhat_contracts.json";
// multiverse contract abi here:
import { Transactor, Web3ModalSetup } from "./helpers";
import { Home, ExampleUI, Hints, Subgraph, FrontPage, TwistTheMultiverse, Arena } from "./views";
import { useLocalStorage, useStaticJsonRPC } from "./hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import create from "@ant-design/icons/lib/components/IconFont";
import MultiverseSignaturesABI from "./contracts/ABI/MultiverseSignatures.json";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/scaffold-eth/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Alchemy.com & Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const initialNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

let BACKEND_URL = "http://localhost:49899/";
// let BACKEND_URL = "https://multiverse-signatures-sb.herokuapp.com/";

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;
const USE_BURNER_WALLET = true; // toggle burner wallet feature
const USE_NETWORK_SELECTOR = false;

const web3Modal = Web3ModalSetup();

// 🛰 providers
const providers = [
  "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
  `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
  "https://rpc.scaffoldeth.io:48544",
];

function App(props) {
  // specify all the chains your app is available on. Eg: ['localhost', 'mainnet', ...otherNetworks ]
  // reference './constants.js' for other networks
  const networkOptions = [initialNetwork.name, "mainnet", "rinkeby"];

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();
  const [selectedNetwork, setSelectedNetwork] = useState(networkOptions[0]);
  const location = useLocation();

  const targetNetwork = NETWORKS[selectedNetwork];

  // 🔭 block explorer URL
  const blockExplorer = targetNetwork.blockExplorer;

  // load all your providers
  const localProvider = useStaticJsonRPC([
    process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl,
  ]);
  const mainnetProvider = useStaticJsonRPC(providers);

  if (DEBUG) console.log(`Using ${selectedNetwork} network`);

  // 🛰 providers
  if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider, USE_BURNER_WALLET);
  const userSigner = userProviderAndSigner.signer;

  // const userProvider = useUserProvider(injectedProvider, localProvider);
  // setAddress(useUserAddress(userProvider));

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  // const contractConfig = useContractConfig();

  const contractConfig = { deployedContracts: deployedContracts || {}, externalContracts: externalContracts || {} };

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // ---------------NEW CODE--------------------/

  const contractName = "MultiverseSignatures";
  const contractAddress = readContracts?.MultiverseSignatures?.address;
  console.log("MultiverseSignatures address: ", contractAddress);

  // owners events are emitted when a multiverse wallet is created and it includes the array of owner wallets, which is important for filtering.
  const ownersMultiverseEvents = useEventListener(readContracts, "MultiverseCreator", "Owners", localProvider, 1);
  if (DEBUG) console.log("ownersMultiverseEvents: ", ownersMultiverseEvents);

  const [multiverses, setMultiverses] = useState([]);
  const [currentMultiverseAddress, setCurrentMultiverseAddress] = useState();
  console.log("CurrentMultiverseAddress", currentMultiverseAddress);

  const [importedMultiverses] = useLocalStorage("importedMultiverses");

  // Here we define the multiverses that the user has by listening for broadcast events from the smart contract and running all of them
  // though our filter and picking the ones that hold the user address in _owners array.
  // .reduce() reduces the number of values in an array to one -> the event of user in owners[]
  useEffect(() => {
    if (address) {
      let multiversesForUser = ownersMultiverseEvents.reduce((filtered, createEvent) => {
        console.log("CREATEEVENT ARGS: ", createEvent.args);
        if (createEvent.args.owners.includes(address) && !filtered.includes(createEvent.args.multiverseAddress)) {
          filtered.push(createEvent.args.multiverseAddress);
        }
        return filtered;
      }, []);

      if (importedMultiverses && importedMultiverses[targetNetwork.name]) {
        multiversesForUser = [...new Set([...importedMultiverses[targetNetwork.name], ...multiversesForUser])];
      }

      if (multiversesForUser.length > 0) {
        const recentMultiSigAddress = multiversesForUser[multiversesForUser.length - 1];
        if (recentMultiSigAddress != currentMultiverseAddress) setContractNameForEvent(null);
        setCurrentMultiverseAddress(recentMultiSigAddress);
        setMultiverses(multiversesForUser);
      }
    }
  }, [ownersMultiverseEvents, address]);

  const [signaturesRequired, setSignaturesRequired] = useState();
  const [nonce, setNonce] = useState(0);

  // Reading these from the contract:
  const signaturesRequiredContract = useContractReader(readContracts, contractName, "signaturesRequired");
  const nonceContract = useContractReader(readContracts, contractName, "nonce");

  useEffect(() => {
    setSignaturesRequired(signaturesRequiredContract);
    setNonce(nonceContract);
  }, [signaturesRequiredContract, nonceContract]);

  const [contractNameForEvent, setContractNameForEvent] = useState();

  useEffect(() => {
    async function getContractValues() {
      const latestSignaturesRequired = await readContracts.MultiverseSignatures.signaturesRequired();
      setSignaturesRequired(latestSignaturesRequired);

      const nonce = await readContracts.MultiverseSignatures.nonce();
      setNonce(nonce);
    }

    if (currentMultiverseAddress) {
      readContracts.MultiverseSignatures = new ethers.Contract(
        currentMultiverseAddress,
        MultiverseSignaturesABI,
        localProvider,
      );
      writeContracts.MultiverseSignatures = new ethers.Contract(
        currentMultiverseAddress,
        MultiverseSignaturesABI,
        userSigner,
      );

      setContractNameForEvent("MultiverseSignatures");
      getContractValues();
    }
  }, [currentMultiverseAddress, readContracts, writeContracts]);

  console.log("Current Multiverse address LINE 262: ", currentMultiverseAddress);

  const allOwnerEvents = useEventListener(
    currentMultiverseAddress ? readContracts : null,
    contractNameForEvent,
    "OwnerChanged",
    localProvider,
    1,
  );

  const allExecuteTransactionEvents = useEventListener(
    currentMultiverseAddress ? readContracts : null,
    contractNameForEvent,
    "ExecuteTransaction",
    localProvider,
    1,
  );
  if (DEBUG) console.log("allExecuteTransactionEvents length: ", allExecuteTransactionEvents.length);

  const [ownerEvents, setOwnerEvents] = useState();
  const [executeTransactionEvents, setExecuteTransactionEvents] = useState();

  // this gives us the owner event from this current multiverse so we can iterate through them in <DisplayOwners />
  useEffect(() => {
    setOwnerEvents(allOwnerEvents.filter(contractEvent => contractEvent.address === currentMultiverseAddress));
  }, [allOwnerEvents, currentMultiverseAddress]);

  useEffect(() => {
    const filteredEvents = allExecuteTransactionEvents.filter(
      contractEvent => contractEvent.address === currentMultiverseAddress,
    );

    const nonceNum = typeof nonce === "number" ? nonce : nonce?.toNumber();
    console.log("NONCE NUNNA ", nonceNum); // returns 3
    console.log("FILT EVENTS LENGTH: ", filteredEvents.length); // returns 1
    if (nonceNum === filteredEvents.length) {
      setExecuteTransactionEvents(filteredEvents);
    }
  }, [allExecuteTransactionEvents, currentMultiverseAddress, nonce]);

  const userHasMultiverses = currentMultiverseAddress ? true : false;

  const handleMultiverseChange = value => {
    setContractNameForEvent(null);
    setCurrentMultiverseAddress(value);
  };

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const selectNetworkOptions = [];
  for (const id in NETWORKS) {
    selectNetworkOptions.push(
      <Select.Option key={id} value={NETWORKS[id].name}>
        <span style={{ color: NETWORKS[id].color }}>{NETWORKS[id].name}</span>
      </Select.Option>,
    );
  }

  const networkSelect = (
    <Select
      defaultValue={targetNetwork.name}
      style={{ testAlign: "left", witdth: 170 }}
      onChange={value => {
        if (targetNetwork.chainId != NETWORKS[value].chainId) {
          window.localStorage.setItem("network", value);
          setTimeout(() => {
            window.location.reload();
          }, 1);
        }
      }}
    >
      {selectNetworkOptions}
    </Select>
  );

  // ---------------NEW CODE ENDS--------------------/

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  // keep track of a variable from the contract in the local React state:
  const isOwner = useContractReader(readContracts, contractName, "isOwner", [address]);

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */

  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
    localChainId,
    myMainnetDAIBalance,
  ]);

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header>
        {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flex: 1 }}>
            {USE_NETWORK_SELECTOR && (
              <div style={{ marginRight: 20 }}>
                <NetworkSwitch
                  networkOptions={networkOptions}
                  selectedNetwork={selectedNetwork}
                  setSelectedNetwork={setSelectedNetwork}
                />
              </div>
            )}
            <Account
              useBurner={USE_BURNER_WALLET}
              address={address}
              localProvider={localProvider}
              userSigner={userSigner}
              mainnetProvider={mainnetProvider}
              price={price}
              web3Modal={web3Modal}
              loadWeb3Modal={loadWeb3Modal}
              logoutOfWeb3Modal={logoutOfWeb3Modal}
              blockExplorer={blockExplorer}
            />
          </div>
        </div>
      </Header>
      {yourLocalBalance.lte(ethers.BigNumber.from("0")) && (
        <FaucetHint localProvider={localProvider} targetNetwork={targetNetwork} address={address} />
      )}
      <NetworkDisplay
        NETWORKCHECK={NETWORKCHECK}
        localChainId={localChainId}
        selectedChainId={selectedChainId}
        targetNetwork={targetNetwork}
        logoutOfWeb3Modal={logoutOfWeb3Modal}
        USE_NETWORK_SELECTOR={USE_NETWORK_SELECTOR}
      />

      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 20, display: "flex", flexDirection: "column", alignItems: "start" }}>
          <div>
            <CreateMultiverseModal
              selectedAddress={address}
              mainnetProvider={mainnetProvider}
              localProvider={localProvider}
              price={price}
              isCreateModalVisible={isCreateModalVisible}
              setIsCreateModalVisible={setIsCreateModalVisible}
              writeContracts={writeContracts}
              contractName={"MultiverseCreator"}
              selectedChainId={selectedChainId}
              tx={tx}
            />
            <Select
              value={[currentMultiverseAddress]}
              style={{ width: 120, marginRight: 5 }}
              onChange={handleMultiverseChange}
            >
              {multiverses.map((address, index) => (
                <Select.Option key={index} value={address}>
                  {address}
                </Select.Option>
              ))}
            </Select>
            {networkSelect}
          </div>
          <ImportMultiverseModal
            mainnetProvider={mainnetProvider}
            targetNetwork={targetNetwork}
            networkOptions={selectNetworkOptions}
            multiverses={multiverses}
            setMultiverses={setMultiverses}
            setCurrentMultiverseAddress={setCurrentMultiverseAddress}
            MultiverseSignaturesABI={MultiverseSignaturesABI}
            localProvider={localProvider}
          />
        </div>
      </div>

      <Menu
        disabled={!userHasMultiverses}
        style={{ textAlign: "center", marginTop: 20 }}
        selectedKeys={[location.pathname]}
        mode="horizontal"
      >
        <Menu.Item key="/">
          <Link to="/">Your Multiverse</Link>
        </Menu.Item>
        <Menu.Item key="/twist">
          <Link to="/twist">Twist the Multiverse</Link>
        </Menu.Item>
        <Menu.Item key="/arena">
          <Link to="/arena">Arena</Link>
        </Menu.Item>
      </Menu>

      <Switch>
        <Route exact path="/">
          {/* pass in any web3 props to this Home component. For example, yourLocalBalance */}
          {/* <Home yourLocalBalance={yourLocalBalance} readContracts={readContracts} /> */}
          {!userHasMultiverses ? (
            <div style={{ padding: 200 }}>
              <h1>Welcome to the Multiverse Wallet Factory!</h1>
              <h2>Please create a new wallet below:</h2>
              <br />
              <Button
                size="large"
                onClick={() => {
                  setIsCreateModalVisible(true);
                }}
              >
                New Wallet
              </Button>
            </div>
          ) : (
            <FrontPage
              localProvider={localProvider}
              contractName={contractName}
              currentMultiverseAddress={currentMultiverseAddress}
              address={address}
              mainnetProvider={mainnetProvider}
              price={price}
              selectedChainId={selectedChainId}
              writeContracts={writeContracts}
              readContracts={readContracts}
              signaturesRequired={signaturesRequired}
              ownerEvents={ownersMultiverseEvents} // switched from ownerEvents
              executeTransactionEvents={executeTransactionEvents}
              blockExplorer={blockExplorer}
            />
          )}
        </Route>
        <Route exact path="/twist">
          {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally
            */}

          <TwistTheMultiverse
            contractName={contractName}
            contractAddress={contractAddress}
            localProvider={localProvider}
            mainnetProvider={mainnetProvider}
            price={price}
            readContracts={readContracts}
            userSigner={userSigner}
            nonce={nonce}
            signaturesRequired={signaturesRequired}
            poolServerUrl={BACKEND_URL}
          />
        </Route>
        <Route path="/arena">
          <p>Here you can see the pending transactions and sign/execute them</p>
          <Arena
            poolServerUrl={BACKEND_URL}
            contractName={contractName}
            address={address}
            userSigner={userSigner}
            mainnetProvider={mainnetProvider}
            localProvider={localProvider}
            yourLocalBalance={yourLocalBalance}
            price={price}
            tx={tx}
            writeContracts={writeContracts}
            readContracts={readContracts}
            blockExplorer={blockExplorer}
            nonce={nonce}
            signaturesRequired={signaturesRequired}
          />
        </Route>
      </Switch>

      <ThemeSwitch />

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              /*  if the local provider has a signer, let's show the faucet:  */
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default App;
