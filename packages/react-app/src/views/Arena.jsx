import React, { useState, useEffect, useCallback } from "react";
import { Button, List, Divider, Input, Card, DatePicker, Slider, Switch, Spin } from "antd";
import { ConsoleSqlOutlined, SyncOutlined } from "@ant-design/icons";
import { parseEther, formatEther } from "@ethersproject/units";
import { ethers } from "ethers";
import { Address, AddressInput, Balance, Blockie } from "../components";
import { TransactionListItem } from "../components/Multiverse";
import { usePoller } from "eth-hooks";

const axios = require("axios");

const DEBUG = false;

export default function Arena({
  mainnetProvider,
  poolServerUrl,
  contractName,
  signaturesRequired,
  address,
  nonce,
  userSigner,
  localProvider,
  yourLocalBalance,
  price,
  tx,
  readContracts,
  writeContracts,
  blockExplorer,
}) {
  const [transactions, setTransactions] = useState();

  usePoller(() => {
    const getTransactions = async () => {
      // define what we want to get
      const url = poolServerUrl + readContracts[contractName].address + "_" + localProvider._network.chainId;
      console.log("url: ", url);
      // get the transactions from backend
      const res = await axios.get(url);

      console.log("Backend: res: ", res.data);

      // check if the signatures are valid
      const newTransactions = [];
      for (const i in res.data) {
        console.log("Backend: res.data[i]: ", res.data[i]);
        const thisNonce = ethers.BigNumber.from(res.data[i].nonce);
        if (thisNonce && nonce && thisNonce.gte(nonce)) {
          const validSignatures = [];
          for (const sig in res.data[i].signatures) {
            const signer = await readContracts[contractName].recover(res.data[i].hash, res.data[i].signatures[sig]);
            const isOwner = await readContracts[contractName].isOwner(signer);
            if (signer && isOwner) {
              validSignatures.push({ signer, signature: res.data[i].signatures[sig] });
            }
          }
          // create a new object that holds the validSignatures
          const update = { ...res.data[i], validSignatures };
          newTransactions.push(update);
        }
      }

      setTransactions(newTransactions);
    };
    if (readContracts[contractName]) getTransactions();
  }, 3777);

  const getSortedSigList = async (allSigs, newHash) => {
    const sigList = [];
    for (const sig in allSigs) {
      const recover = await readContracts[contractName].recover(newHash, allSigs[sig]);
      sigList.push({ signature: allSigs[sig], signer: recover });
    }

    sigList.sort((a, b) => {
      return ethers.BigNumber.from(a.signer).sub(ethers.BigNumber.from(b.signer)); // sorts by numerical value from low to high
    });

    const finalSigList = [];
    const finalSigners = [];
    const used = {};
    for (const sig in sigList) {
      if (!used[sigList[sig].signature]) {
        finalSigList.push(sigList[sig].signature);
        finalSigners.push(sigList[sig].signer);
      }
      used[sigList[sig].signature] = true;
    }

    return [finalSigList, finalSigners];
  }; // In conclusion: pass in all the signatures and the transaction hash, create an array that holds every signature with its signer
  // then order these by the signer address from low to high (idfk lol), then create an array with only signers and only signatures and fill these
  // up with the values from previous array and make sure every signature only gets one appearance.

  if (!signaturesRequired) {
    return <Spin />;
  }

  return (
    <div style={{ maxWidth: 850, margin: "auto", marginTop: 32, marginBottom: 32 }}>
      <List
        bordered
        dataSource={transactions}
        renderItem={item => {
          const hasSigned = item.signers.indexOf(address) >= 0;
          const hasEnoughSignatures = item.signatures.length <= signaturesRequired.toNumber();

          console.log("Transaction details: ", item);

          return (
            <TransactionListItem
              item={item}
              mainnetProvider={mainnetProvider}
              blockExplorer={blockExplorer}
              price={price}
              readContracts={readContracts}
              contractName={contractName}
            >
              <div style={{ padding: 16 }}>
                <span style={{ padding: 4 }}>
                  {item.signatures.length}/{signaturesRequired.toNumber()} {hasSigned ? "✅" : ""}
                </span>

                <span style={{ padding: 4 }}>
                  <Button
                    type="secondary"
                    onClick={async () => {
                      const newHash = await readContracts[contractName].getTransactionHash(
                        item.nonce,
                        item.to,
                        parseEther("" + parseFloat(item.amount).toFixed(12)),
                        item.data,
                      );

                      const signature = await userSigner?.signMessage(ethers.utils.arrayify(newHash));
                      const recover = await readContracts[contractName].recover(newHash, signature);
                      const isOwner = await readContracts[contractName].isOwner(recover);
                      if (isOwner) {
                        const [finalSigList, finalSigners] = await getSortedSigList(
                          [...item.signatures, signature],
                          newHash,
                        );

                        const res = await axios.post(poolServerUrl, {
                          ...item,
                          signatures: finalSigList,
                          signers: finalSigners,
                        });
                      }
                    }}
                  >
                    Sign
                  </Button>
                  <Button
                    key={item.hash}
                    type={hasEnoughSignatures ? "primary" : "secondary"}
                    onClick={async () => {
                      const newHash = await readContracts[contractName].getTransactionHash(
                        item.nonce,
                        item.to,
                        parseEther("" + parseFloat(item.amount).toFixed(12)),
                        item.data,
                      );

                      const [finalSigList, finalSigners] = await getSortedSigList(item.signatures, newHash);

                      // console.log(
                      //     "writeContracts: ", item.to, parseEther("" + parseFloat(item.amount).toFixed(12)), item.data, finalSigList
                      // );

                      tx(
                        writeContracts[contractName].executeTransaction(
                          item.to,
                          parseEther("" + parseFloat(item.amount).toFixed(12)),
                          item.data,
                          finalSigList,
                        ),
                      );
                      //window.location.reload();
                    }}
                  >
                    Exec
                  </Button>
                </span>
              </div>
            </TransactionListItem>
          );
        }}
      />
    </div>
  );
}
