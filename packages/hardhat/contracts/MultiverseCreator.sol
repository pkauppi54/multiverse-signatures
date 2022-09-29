//SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;
import "./MultiverseSignatures.sol";



contract MultiverseCreator {

    MultiverseSignatures[] public multiverses;

    mapping(address => bool) hasMultiverse;

    //MultiverseSignatures multiverse;

    // Events

    event MultiverseCreated(
        uint256 indexed contractId,
        address indexed contractAddress,
        address creator,  
        address[] owners, 
        uint256 signaturesRequired
    );

    event Owners(
        address indexed multiverseAddress,
        address[] owners,
        uint256 indexed signaturesRequired
    );


    modifier onlyRegisteredWallet() {
        require(
            hasMultiverse[msg.sender],
            "caller must be created by the MultiverseCreator"
        );
        _;
    }

    // Functions
    
    function createMultiverse(
        uint256 _chainId, 
        address[] memory _owners, 
        uint256 _signaturesRequired) public payable {

        //require(_owners.length > 0 && _signaturesRequired > 0, "createMultiverse: Owners or signatures invalid");

        uint256 multiverseId = multiverses.length;

        MultiverseSignatures multiverse = new MultiverseSignatures{value: msg.value}(
            _chainId, 
            _owners, 
            _signaturesRequired, 
            payable(address(this)) 
        );

        address multiverseAddress = address(multiverse);

        require(!hasMultiverse[multiverseAddress], "Multiverse already exists");

        multiverses.push(multiverse);
        hasMultiverse[multiverseAddress] = true;

        emit MultiverseCreated(
            multiverseId,
            multiverseAddress,
            msg.sender, 
            _owners, 
            _signaturesRequired);

        emit Owners(multiverseAddress, _owners, _signaturesRequired);
    }

    function getMultiverse(uint256 _index) public view returns (address _multiverseAddress, uint256 _signaturesRequired, uint256 _balance) {
        MultiverseSignatures muultiverse = multiverses[_index];
        _multiverseAddress = address(muultiverse);
        _signaturesRequired = muultiverse.signaturesRequired();
        _balance = address(muultiverse).balance;
    }

    function emitOwners(
        address _multiverseAddress,
        address[] memory _owners,
        uint256 _signaturesRequired
    ) external onlyRegisteredWallet {
        emit Owners(_multiverseAddress, _owners, _signaturesRequired);
    }



}