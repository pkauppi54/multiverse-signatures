import React, { useState } from "react";
import { Button, Modal, Select, Alert } from "antd";
import { ethers } from "ethers";
import { useLocalStorage } from "../../hooks";

import { AddressInput } from "..";
import { useEffect } from "react";

export default function ImportMultiverseModal({
  mainnetProvider,
  targetNetwork,
  networkOptions,
  multiverses,
  setMultiverses,
  setCurrentMultiverseAddress,
  MultiverseSignaturesABI,
  localProvider,
  contractName,
  userAddress,
  readContracts,
}) {
  const [importedMultiverses, setImportedMultiverses] = useLocalStorage("importedMultiverses");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingImport, setPendingImport] = useState(false);
  const [error, setError] = useState(false);
  const [ownerError, setOwnerError] = useState(false);
  const [address, setAddress] = useState();
  const [network, setNetwork] = useState(targetNetwork.name);

  const resetState = () => {
    setError(false);
    setOwnerError(false);
    setAddress("");
    setNetwork(targetNetwork.name);
    setPendingImport(false);
  };

  const handleCancel = () => {
    resetState();
    setIsModalVisible(false);
  };
  // useEffect(async () => {
  //     const isOwner = await readContracts[contractName].isOwner(userAddress);
  // })

  const handleSubmit = async () => {
    try {
      setPendingImport(true);

      const contract = new ethers.Contract(address, MultiverseSignaturesABI, localProvider);
      await contract.signaturesRequired();

      let newImportedMultiverses = importedMultiverses || {};
      (newImportedMultiverses[network] = newImportedMultiverses[network] || []).push(address);
      newImportedMultiverses[network] = [...new Set(newImportedMultiverses[network])];
      setImportedMultiverses(newImportedMultiverses);

      if (network === targetNetwork.name) {
        setMultiverses([...new Set([...newImportedMultiverses[network], ...multiverses])]);
        setCurrentMultiverseAddress(address);
      }
      resetState();
      setIsModalVisible(false);
    } catch (err) {
      console.log("Import error: ", err);
      setError(true);
      setPendingImport(false);
    }
  };

  return (
    <>
      <Button type="link" onClick={() => setIsModalVisible(true)}>
        Import
      </Button>
      <Modal
        title="Import Multiverse"
        visible={isModalVisible}
        onCancel={handleCancel}
        destroyOnClose
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            disabled={!address || !network}
            loading={pendingImport}
            onClick={handleSubmit}
          >
            Import
          </Button>,
        ]}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <AddressInput
            autoFocus
            ensProvider={mainnetProvider}
            placeholder={"Multiverse address"}
            value={address}
            onChange={setAddress}
          />
          <Select defaultValue={targetNetwork.name} onChange={value => setNetwork(value)}>
            {networkOptions}
          </Select>
          {error && (
            <Alert message="Unable to import: please check the given multiverse address." type="error" showIcon />
          )}
          {ownerError && <Alert message="Unable to import: You are not one of the owners." type="error" showIcon />}
        </div>
      </Modal>
    </>
  );
}
