//SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./MultiverseCreator.sol";


contract MultiverseSignatures {


  // Most of these first lines of code are from Meta multi sig example since they are the common multi sig wallet functions! 

  using ECDSA for bytes32;

  MultiverseCreator public multiverseCreator;

  event Deposit(address indexed sender, uint256 amount, uint256 balance);
  // bytes = byte[]
  event ExecuteTransaction(address indexed owner, address payable to, uint256 value, bytes data, uint256 nonce, bytes32 hash, bytes result);
  event OwnerChanged(address indexed owner, bool added);

  mapping(address => bool) public isOwner;

  uint256 public signaturesRequired;
  uint256 public nonce;
  uint256 public chainId;
  address[] public owners;

  constructor(
    uint256 _chainId, 
    address[] memory _owners, 
    uint _signaturesrequired, 
    address payable _creatorAddress
    ) payable {
    
    require(_signaturesrequired > 0, "constructor(): Please provide at least one siganture required");
    require(signaturesRequired <= _owners.length, "Constructor(): Signatures Required cannot be more than owners length.");

      
      for (uint256 i = 0; i<_owners.length; i++) {
        address owner = _owners[i];

        require(owner != address(0), "constructor(): Owner can not be a zero address");
        require(!isOwner[owner], "constructor(): owner not unique");

        isOwner[owner] = true;
        owners.push(owner);

        emit OwnerChanged(owner, true);
      }
      chainId = _chainId;
      signaturesRequired = _signaturesrequired;

      multiverseCreator = MultiverseCreator(_creatorAddress);

  }

  modifier onlySelf() {
    require(msg.sender == address(this), "not self");
    _;
  }
  
  function addSigner(address newSigner, uint256 newSignaturesRequired) public onlySelf {
    require(newSigner != address(0), "addSigner(): signer is a zero address");
    require(!isOwner[newSigner], "addSigner(): Signer already an owner");
    require(newSignaturesRequired > 0, "addSigner(): Signatures required should be more than 0");

    isOwner[newSigner] = true;
    owners.push(newSigner);
    //emit OwnerChanged(newSigner, isOwner[newSigner]);

    //multiverseCreator.emitOwners(address(this), owners, newSignaturesRequired);

    signaturesRequired = newSignaturesRequired;
  }

  function removeSigner(address signerToRemove, uint256 newSignaturesRequired) public onlySelf {
    require(signerToRemove != address(0), "removeSigner(): can't remove a zero address");
    require(isOwner[signerToRemove], "removeSigner(): address already removed");
    require(newSignaturesRequired > 0, "removeSigner(): Signatures required should be more than 0" );

    delete isOwner[signerToRemove];

    for (uint256 i = 0; i<owners.length; i++) {
      if (owners[i] == signerToRemove) {
        owners[i] = owners[owners.length - 1];
        owners.pop();
        break;
      }
    }

    signaturesRequired = newSignaturesRequired;

    //emit OwnerChanged(signerToRemove, isOwner[signerToRemove]);

    //multiverseCreator.emitOwners(address(this), owners, newSignaturesRequired);
  }

  function updateSignaturesRequired(uint256 newSignaturesRequired) public onlySelf {
    require(newSignaturesRequired > 0, "updateSignaturesRequired(): Signatures required should be more than 0" );
    signaturesRequired = newSignaturesRequired;
  }


  function getTransactionHash(uint256 _nonce, address to, uint256 value, bytes calldata data) public view returns (bytes32) {
      return keccak256(abi.encodePacked(address(this), chainId, _nonce, to, value, data));
  }


  function executeTransaction(address payable _to, uint256 _value, bytes calldata _data, bytes[] calldata _signatures) 
      public
      returns (bytes memory) {
        require(isOwner[msg.sender], "executeTransaction(): Only owners can execute");
        bytes32 _hash = getTransactionHash(nonce, _to, _value, _data);

        nonce++;
        uint256 validSignatures;
        address duplicateGuard;

        for (uint256 i=0; i < _signatures.length; i++) {
            // Gives us the signer address
            bytes memory signature = _signatures[i];
            address recovered = recover(_hash, signature);
            // I assume signatures needs to be in order from lowest to highest?
            require(duplicateGuard < recovered, "executeTransaction(): duplicate or unordered signatures");

            duplicateGuard = recovered;
            if (isOwner[recovered]) {
              validSignatures += 1;
            }
        }
        
        require(validSignatures >= signaturesRequired, "executeTransaction(): not enough signers");

        (bool sent, bytes memory result) = _to.call{value: _value}(_data);
        require(sent, "executeTransaction(): execution reverted");
        
        emit ExecuteTransaction(msg.sender, _to, _value, _data, nonce - 1, _hash, result);

        multiverseCreator.emitOwners(address(this), owners, signaturesRequired);
        return result;
    }


  function recover(bytes32 _hash, bytes memory _signature) public pure returns (address) {
    return _hash.toEthSignedMessageHash().recover(_signature);
  }

  receive() external payable {
    emit Deposit(msg.sender, msg.value, address(this).balance);
  }

  fallback() external payable {
    emit Deposit(msg.sender, msg.value, address(this).balance);
  }



}
