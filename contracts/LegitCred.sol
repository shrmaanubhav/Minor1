// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LegitCred
 * @notice Minimal ERC721 that stores IPFS metadata strings and exposes a
 *         helper to get the total supply.
 */
contract LegitCred is ERC721URIStorage, Ownable {
    uint256 private _tokenIds;

    constructor(address initialOwner) ERC721("LegitCred", "NFT") Ownable(initialOwner) {}

    function mint(address recipient, string memory metadata)
        public
        returns (uint256)
    {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, metadata);

        return newTokenId;
    }

    function getMetaData(uint256 id) public view returns (string memory data) {
        return tokenURI(id);
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds;
    }
}
