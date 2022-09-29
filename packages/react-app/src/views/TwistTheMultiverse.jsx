import React, { useEffect, useState, useRef } from "react";
import { Button, Input, Select, InputNumber, Space, Tooltip } from "antd";
import { AddressInput, EtherInput, WalletConnectInput } from "../components";
import { parseExternalContractTransaction } from "../helpers";
import { useLocalStorage } from "../hooks";
import { ethers, utils } from "ethers";
import { parseEther, formatEther } from "ethers/lib/utils";
import { useContractReader } from "eth-hooks";
import { useHistory } from "react-router-dom";
import { CodeOutlined } from "@ant-design/icons";
import { TransactionDetailsModal } from "../components/Multiverse";

const { Option } = Select;

const axios = require("axios");

export default function TwistTheMultiverse({
  mainnetProvider,
  contractName,
  contractAddress,
  localProvider,
  price,
  readContracts,
  userSigner,
  nonce,
  signaturesRequired,
  poolServerUrl,
}) {
  const history = useHistory();

  const [customCallData, setCustomCallData] = useState("");
  // const [selectDisabled, setSelectDisabled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState("0");
  const [to, setTo] = useLocalStorage("to");
  const [newSignaturesRequired, setNewSignaturesRequired] = useState(signaturesRequired);
  const [methodName, setMethodName] = useLocalStorage("methodName", "transferFunds");
  const [parsedCustomCallData, setParsedCustomCallData] = useState(null);

  //const nonce = useContractReader(readContracts, contractName, "nonce");
  const [isWalletConnectTransaction, setIsWalletConnectTransaction] = useState(false);
  const [loading, setLoading] = useState(false);

  const [hasEdited, setHasEdited] = useState();

  useEffect(() => {
    if (!hasEdited) {
      setNewSignaturesRequired(signaturesRequired);
    }
  }, [signaturesRequired]);

  useEffect(() => {
    const getParsedTransaction = async () => {
      const parsedTransaction = await parseExternalContractTransaction(to, customCallData);
      setParsedCustomCallData(parsedTransaction);
    };

    getParsedTransaction();
  }, [customCallData]);

  const seeModal = () => {
    setShowModal(true);
  };

  const loadWalletConnectData = ({ to, value, data }) => {
    setTo(to);
    value ? setAmount(ethers.utils.formatEther(value)) : setAmount("0");
    setCustomCallData(data);
    setIsWalletConnectTransaction(true);
  };

  useEffect(() => {
    isWalletConnectTransaction && createTransaction();
    setIsWalletConnectTransaction(false);
  }, [isWalletConnectTransaction]);

  const createTransaction = async () => {
    try {
      if (newSignaturesRequired < 1) {
        alert("Signatures required cannot be 0");
      } else {
        setLoading(true);

        let callData;
        let executeToAddress;
        if (methodName == "transferFunds" || methodName == "customCallData" || methodName == "wcCallData") {
          callData = methodName == "transferFunds" ? "0x" : customCallData; // data is customCallData if it is from wc or from custom call data
          executeToAddress = to;
        } else {
          // when the method is addSigner or removeSigner
          callData = readContracts[contractName]?.interface?.encodeFunctionData(methodName, [
            to, // Here the "to" is the signer to remove/add
            newSignaturesRequired,
          ]);
          executeToAddress = contractAddress;
        }

        console.log(
          "Execute: " +
            methodName +
            " to " +
            executeToAddress +
            " New Sigs: " +
            newSignaturesRequired +
            " calldata: " +
            callData,
        );

        const newHash = await readContracts[contractName].getTransactionHash(
          nonce.toNumber(),
          executeToAddress,
          parseEther("" + parseFloat(amount).toFixed(12)),
          callData,
        );
        console.log("New Hash (arraifyifyed): ", ethers.utils.arrayify(newHash));

        const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash)); // converts the hash into an uint8 array
        console.log("signature: ", signature);

        const recover = await readContracts[contractName].recover(newHash, signature);
        console.log("recovered address: ", recover);

        const isOwner = await readContracts[contractName].isOwner(recover);
        console.log("Recovered address is an owner: ", isOwner);
        console.log(nonce.toNumber());

        if (isOwner) {
          const res = await axios.post(poolServerUrl, {
            chainId: localProvider._network.chainId,
            address: readContracts[contractName]?.address,
            nonce: nonce.toNumber(),
            to: executeToAddress,
            amount,
            data: callData,
            hash: newHash,
            signatures: [signature],
            signers: [recover],
          });

          console.log("Result of backend post: ", res.data);
          setTimeout(() => {
            history.push("/arena");
            setLoading(false);
          }, 1000);
        } else {
          alert("Error: Not the owner");
        }
      }
    } catch (err) {
      console.log("CreateTransaction error: ", err);
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ border: "1px solid #cccccc", padding: 16, width: 400, margin: "auto", marginTop: 64 }}>
        <div style={{ margin: 8 }}>
          <div style={{ margin: 5, padding: 8 }}>
            <Select value={methodName} onChange={setMethodName} style={{ width: "100%" }}>
              <Option key="transferFunds">Send ETH</Option>
              <Option key="addSigner">Add Owner</Option>
              <Option key="removeSigner">Remove Owner</Option>
              <Option key="customCallData">Custom Call Data</Option>
              <Option key="wcCallData">WalletConnect</Option>
            </Select>
          </div>
          {methodName == "wcCallData" ? (
            <div style={{ padding: 10 }}>
              <WalletConnectInput
                chainId={localProvider?._network.chainId}
                address={contractAddress}
                loadWalletConnectData={loadWalletConnectData}
                mainnetProvider={mainnetProvider}
                price={price}
              />
            </div>
          ) : (
            <>
              <div style={{ padding: 10, width: "100%", margin: "auto" }}>
                <AddressInput
                  autoFocus
                  ensProvider={mainnetProvider}
                  placeholder={
                    methodName == "transferFunds" || methodName == "customCallData" ? "To address" : "Owner address"
                  }
                  value={to}
                  onChange={setTo}
                />
              </div>
              <div style={{ padding: 10 }}>
                {(methodName == "addSigner" || methodName == "removeSigner") && (
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="New # of signatures required"
                    value={newSignaturesRequired}
                    onChange={value => {
                      setNewSignaturesRequired(value);
                      setHasEdited(true);
                    }}
                  />
                )}
                {methodName == "customCallData" && (
                  <>
                    <Input.Group compact>
                      <Input
                        style={{ width: "calc(100%-31px)", marginBottom: 20 }}
                        placeholder="Custom call data"
                        value={customCallData}
                        onChange={e => {
                          setCustomCallData(e.target.value);
                        }}
                      />
                      <Tooltip title="Parse transaction data">
                        <Button onClick={seeModal} icon={<CodeOutlined />} />
                      </Tooltip>
                    </Input.Group>
                    <TransactionDetailsModal
                      visible={showModal}
                      txnInfo={parsedCustomCallData}
                      handleOk={() => setShowModal(false)}
                      handleCancel={() => setShowModal(false)}
                      mainnetProvider={mainnetProvider}
                      price={price}
                    />
                  </>
                )}
                {(methodName == "transferFunds" || methodName == "customCallData") && (
                  <EtherInput price={price} mode="USD" value={amount} onChange={setAmount} />
                )}
              </div>
              <Space style={{ marginTop: 32 }}>
                <Button loading={loading} onClick={createTransaction} type="primary">
                  Propose
                </Button>
              </Space>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
