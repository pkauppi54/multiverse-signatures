import { Button, Input, Badge } from "antd";
import { CameraOutlined, QrcodeOutlined } from "@ant-design/icons";
import WalletConnect from "@walletconnect/client";
import QrReader from "react-qr-reader";
import { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks";
import { parseExternalContractTransaction } from "../helpers";
import ButtonGroup from "antd/lib/button/button-group";

import { TransactionDetailsModal } from "./Multiverse";

const WalletConnectInput = ({ chainId, address, loadWalletConnectData, mainnetProvider, price }) => {
  const [walletConnectConnector, setWalletConnectConnector] = useLocalStorage("walletConnectConnector");
  // const [walletConnectConnectorSession, setWalletConnectConnectorSession] = useLocalStorage(
  //     "WalletConnectConnectorSession",
  // );
  const [walletConnectUri, setWalletConnectUri] = useLocalStorage("walletConnectUri", "");
  const [isConnected, setIsConnected] = useLocalStorage("isConnected", false);
  const [peerMeta, setPeerMeta] = useLocalStorage("peerMeta"); // Client metadata, including description, url, icons, name
  const [data, setData] = useState();
  const [to, setTo] = useState();
  const [value, setValue] = useState();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [parsedTransactionData, setParsedTransactionData] = useState();
  const [scan, setScan] = useState(false);

  useEffect(() => {
    if (walletConnectUri) {
      setupAndSubscribe();
    }
  }, [walletConnectUri]);

  useEffect(
    () => {
      if (address && !isConnected) {
        resetConnection();
      }
    },
    [address],
    isConnected,
  );

  const setupAndSubscribe = () => {
    const connector = setupConnector();
    if (connector) {
      subscribeToEvents(connector);
      setWalletConnectConnector(connector);
    }
  };

  const setupConnector = () => {
    let connector;
    try {
      connector = new WalletConnect({ uri: walletConnectUri });
      return connector;
    } catch (e) {
      console.log("setupConnector error: ", e);
      setWalletConnectUri("");
      return connector;
    }
  };

  const subscribeToEvents = connector => {
    connector.on("session_request", (error, payload) => {
      if (error) {
        throw error;
      }

      console.log("Event: session_request ", payload);
      setPeerMeta(payload.params[0].peerMeta);

      connector.approveSession({
        accounts: [address],
        chainId,
      });

      if (connector.connected) {
        setIsConnected(true);
        console.log("Session successfully connected.");
      }
    });

    connector.on("call_request", (error, payload) => {
      if (error) {
        throw error;
      }

      console.log("Event: call_request: ", payload);
      parseCallRequest(payload);
    });

    connector.on("disconnect", (error, payload) => {
      localStorage.removeitem("walletconnect");
      resetConnection();
      if (error) {
        throw error;
      }

      console.log("Event: disconnect: ", payload);
    });
  };

  // Handling connections:
  useEffect(() => {
    if (!isConnected) {
      let nextSession = localStorage.getItem("walletConnectNextSession");
      if (nextSession) {
        localStorage.removeItem("walletConnectNextSession");
        console.log("Next session found from cache: ", nextSession);
        setWalletConnectUri(nextSession);
      } else if (walletConnectConnector) {
        console.log("No connection but found a connector: ", walletConnectConnector);
        setupConnector(walletConnectConnector);
        setIsConnected(true);
      } else if (walletConnectUri) {
        // Not sure why we need this line since if there is a walletConnectUri, isn't it already setting it up via useEfect on line 29?
        console.log("Not connected but uri found: ", walletConnectUri);
        localStorage.removeItem("walletconnect");
        setupConnector(
          {
            uri: walletConnectUri,
          } /*{
                    // This would be for the push server (for push notifications for the actual user)
                    
                    url: "<YOUR_PUSH_SERVER_URL>",
                    type: "fcm",
                    token: token,
                    peerMeta: true,
                    language: language,
                }*/,
        );
      }
    }
  }, [walletConnectUri]);

  // I assume our payload consists of the "normal" transaction details such as value, to, data, since these are pulled from the request below.
  // I should find the place where these metadata values are defined so that it would be easier to come up with this code myself...
  const parseCallRequest = payload => {
    const callData = payload.params[0];
    setValue(callData.value);
    setTo(callData.to);
    setData(callData.data);
  };

  // Now that we have the data, we need to decode it:

  const decodeFunctionData = async () => {
    try {
      const parsedTransactionData = parseExternalContractTransaction(to, data);
      setParsedTransactionData(parsedTransactionData);
      setIsModalVisible(true);
    } catch (err) {
      console.log(err);
      setParsedTransactionData(null);
    }
  };

  useEffect(() => {
    if (data && to) {
      decodeFunctionData();
    }
  }, [data]);

  // Session ends:
  const killSession = () => {
    setIsConnected(false);
    console.log("Action ", killSession);
    if (isConnected) {
      walletConnectConnector.killSession();
    }
    resetConnection();
    localStorage.removeItem("walletconnect");
    localStorage.removeItem("walletConnectUri");
    localStorage.removeItem("walletConnectConnector");
    localStorage.setItem("walletConnectNextSession", walletConnectUri);
    console.log("The connection was reset");
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const handleOk = () => {
    loadWalletConnectData({
      data,
      to,
      value,
    });
  };

  const resetConnection = () => {
    setWalletConnectUri("");
    setIsConnected(false);
    setWalletConnectConnector(null);
    setTo();
    setData();
    setValue();
  };

  return (
    <>
      {scan ? (
        <div
          style={{ zIndex: 256, position: "abslute", left: 0, top: 0, width: "100%" }}
          onClick={() => {
            setScan(false);
          }}
        >
          <QrReader
            delay={250}
            resolution={1200}
            onError={e => {
              console.log("SCAN ERROR ", e);
              setScan(false);
            }}
            onScan={newValue => {
              if (newValue) {
                console.log("SCAN VALUE ", newValue);
                setScan(false);
                setWalletConnectUri(newValue);
              }
            }}
            style={{ width: "100%" }}
          />
        </div>
      ) : (
        ""
      )}

      <Input.Group compact>
        <Input
          style={{ width: "calc(100% - 31px)", marginBottom: 20 }}
          placeholder="Paste WalletConnect URI"
          disabled={isConnected}
          value={walletConnectUri}
          onChange={e => setWalletConnectUri(e.target.value)}
        />
        <Button
          disabled={isConnected}
          onClick={() => setScan(!scan)}
          icon={
            <Badge count={<CameraOutlined style={{ fontSize: 9 }} />}>
              <QrcodeOutlined style={{ fontSize: 18 }} />
            </Badge>
          }
        />
      </Input.Group>

      {isConnected && (
        <>
          <div style={{ marginTop: 19 }}>
            <img src={peerMeta.icons[0]} style={{ width: 25, height: 25 }} />
            <p>
              <a href={peerMeta.url} target="_blank" rel="noreferrer">
                {peerMeta.url}
              </a>
            </p>
          </div>
          <Button onClick={killSession} type="primary">
            Disconnect
          </Button>
        </>
      )}

      {!isConnected && (
        <div
          style={{ cursor: "pointer" }}
          onClick={() => {
            localStorage.removeItem("walletconnect");
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }}
        >
          Delete from storage
        </div>
      )}

      {isModalVisible && (
        <TransactionDetailsModal
          visible={isModalVisible}
          txnInfo={parsedTransactionData}
          handleOk={handleOk}
          handleCancel={hideModal}
          showFooter={true}
          mainnetProvider={mainnetProvider}
          price={price}
        />
      )}
    </>
  );
};

export default WalletConnectInput;
