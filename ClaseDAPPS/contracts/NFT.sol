pragma solidity >= 0.8.0 < 0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFTClase is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIDS;

    using Strings for uint256;
    mapping (uint256 => string) private _tokenURIs;

    constructor() ERC721("DKPTokens", "DKP") {}
    string private _baseURIextended;

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseURIextended = baseURI;
    } 

    function _setTokenURI(uint256 tokenId, string memory _tokenURI) internal virtual {
        require(_exists(tokenId), "ERC721Metadata: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }  

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory _tokenURI = _tokenURIs[tokenId];
        string memory base = _baseURI();

        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }
        return string(abi.encodePacked(base, tokenId.toString()));
    }
    function mintNFT(address recipient, string memory _tokenURI) public onlyOwner returns (uint256) {
        _tokenIDS.increment();
        uint256 newItemID = _tokenIDS.current();
        _mint(recipient, newItemID);
        _setTokenURI(newItemID, _tokenURI);
        return newItemID;
    }
}
