import { Button, Divider, List } from "antd";
import QR from "qrcode.react";
import React, { useEffect, useState } from "react";
import { DisplayOwners, TransactionListItem } from "../components/Multiverse";
import { Address, AddressFull, AddressInput, Balance, Events, MultiAddressInput, EtherInput } from "../components";
import { Link } from "react-router-dom";

import { CreateMultiverseModal } from "../components/Multiverse";

//import { text } from "express";

export default function FrontPage({
  currentMultiverseAddress,
  address,
  signer,
  mainnetProvider,
  localProvider,
  selectedChainId,
  writeContracts,
  contractName,
  signaturesRequired,
  price,
  readContracts,
  setOwners,
  ownerEvents,
  blockExplorer,
  executeTransactionEvents,
}) {
  const signaturesInJavascript = signaturesRequired ? signaturesRequired.toNumber() : "Not determined";

  const sortData = data => {
    return data.slice().sort((a, b) => b.args.nonce.toNumber() - a.args.nonce.toNumber());
  };

  return (
    <>
      <div style={{ paddingTop: 40, position: "left" }}>
        <Link to="/twist">
          <Button type={"primary"} size={"large"} style={{ marginRight: 50 }}>
            {" "}
            📜 Propose A Transaction
          </Button>
        </Link>
        <Link to="/arena">
          <Button
            type={"primary"}
            size={"large"}
            style={{ marginLeft: 50 }}
            onClick={() => {
              window.location = "/arena";
            }}
          >
            {" "}
            🖋️ Sign/Execute Transactions
          </Button>
        </Link>
      </div>
      <div style={{ paddingBottom: 100, maxWidth: 850, margin: "auto" }}>
        <div style={{ padding: 30 }}>
          <div>
            <Balance size={40} address={currentMultiverseAddress} provider={localProvider} price={price} />
          </div>
          <div>
            <QR
              value={currentMultiverseAddress ? currentMultiverseAddress.toString() : ""}
              size={180}
              level="H"
              includeMargin
              renderAs="svg"
              imageSettings={{ excavate: false }}
              bgColor={"transparent"}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
            <Address
              address={currentMultiverseAddress}
              ensProvider={mainnetProvider}
              //blockExplorer={blockExplorer}
              fontSize={25}
            />
          </div>
        </div>
        <div style={{ padding: 10 }}>
          <h2>Signatures required: {signaturesInJavascript}</h2>
        </div>

        <div style={{ padding: 32 }}>
          <DisplayOwners
            mainnetProvider={mainnetProvider}
            ownerEvents={ownerEvents}
            signaturesRequired={signaturesRequired}
            blockExplorer={blockExplorer}
          />{" "}
          <br />
        </div>

        <Divider>Transaction logs:</Divider>
        <List
          bordered
          dataSource={sortData(executeTransactionEvents)}
          renderItem={item => {
            return (
              <TransactionListItem
                item={Object.create(item)}
                mainnetProvider={mainnetProvider}
                blockExplorer={blockExplorer}
                price={price}
                contractName={contractName}
                readContracts={readContracts}
              />
            );
          }}
        />
      </div>
    </>
  );
}
