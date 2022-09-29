import React, { useState, useEffect } from "react";
import { Modal, Button, Collapse } from "antd";
import { Address, Balance } from "..";
import { ethers } from "ethers";
const { Panel } = Collapse;

export default function TransactionDetailsModal({
  price,
  mainnetProvider,
  txnInfo,
  showFooter,
  handleOk,
  handleCancel,
  visible,
}) {
  return (
    <Modal
      title="Transaction Details"
      visible={visible}
      onCancel={handleCancel}
      onOk={handleOk}
      destroyOnClose
      closable
      maskClosable
      footer={
        showFooter
          ? [
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button key="ok" onClick={handleOk}>
                Propose
              </Button>,
            ]
          : null
      }
    >
      {txnInfo && (
        <div>
          <Collapse>
            <Panel header="Event Name" key="event-name" style={{ borderRadius: "40px" }}>
              {txnInfo.functionFragment.name}
            </Panel>
            <Panel header="Function Signature" key="function-signature" style={{ borderRadius: "40px" }}>
              {txnInfo.signature}
            </Panel>
            <Panel header="Arguments" key="arguments" style={{ borderRadius: "40px" }}>
              {txnInfo.functionFragment.inputs.map((element, index) => {
                if (element.type === "aadress") {
                  return (
                    <div
                      key={element.name}
                      style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "left" }}
                    >
                      <b>{element.name} :&nbsp;</b>
                      <Address fontSize={16} address={txnInfo.args[index]} ensProvider={mainnetProvider} />
                    </div>
                  );
                } else if (element.type === "uint256") {
                  return (
                    <p key={element.name}>
                      {element.name === "value" ? (
                        <>
                          <b>{element.name} : </b>{" "}
                          <Balance fontSize={16} balance={txnInfo.args[index]} dollarMultiplier={price} />{" "}
                        </>
                      ) : (
                        <>
                          <b>{element.name} : </b> {txnInfo.args[index] && txnInfo.args[index].toNumber()}
                        </>
                      )}
                    </p>
                  );
                } else {
                  return (
                    <p key={element.name}>
                      {
                        <>
                          <b>{element.name} : </b> {txnInfo.args[index]}
                        </>
                      }
                    </p>
                  );
                }
              })}
            </Panel>
            <Panel header="Signature Hash" key="signature-hash" style={{ borderRadius: "40px" }}>
              {txnInfo.sighash}
            </Panel>
          </Collapse>
        </div>
      )}
    </Modal>
  );
}
