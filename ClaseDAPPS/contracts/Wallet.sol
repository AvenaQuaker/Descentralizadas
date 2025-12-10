// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract MultiSignPaymentWallet {
    enum Role {
        None,
        Admin,
        Seller,
        Customer
    }

    struct Product {
        uint256 id;
        string name;
        string description;
        uint256 price;
        uint256 stock;
        string imageUrl;
        bool active;
    }

    struct Purchase {
        uint256 id;
        uint256 productId;
        address buyer;
        uint256 amount;
        uint256 timestamp;
    }

    address public owner;

    mapping(address => Role) public roles;
    mapping(uint256 => Product) public products;
    mapping(uint256 => Purchase) public purchases;

    uint256 public nextProductId = 1;
    uint256 public nextPurchaseId = 1;

    event ProductCreated(uint256 id);
    event ProductPurchased(uint256 id, address buyer);
    event ProductUpdated(uint256 id);
    event ProductDeleted(uint256 id);

    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Not admin");
        _;
    }

    modifier onlySeller() {
        require(
            roles[msg.sender] == Role.Admin ||
                roles[msg.sender] == Role.Seller,
            "Not seller"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        roles[msg.sender] = Role.Admin;
    }

    function setRole(address _wallet, Role _role) external onlyAdmin {
        roles[_wallet] = _role;
    }

    function createProduct(
        string memory _name,
        string memory _description,
        uint256 _price,
        uint256 _stock,
        string memory _imageUrl
    ) external onlySeller returns (uint256) {
        require(_price > 0, "Price must be > 0");

        products[nextProductId] = Product(
            nextProductId,
            _name,
            _description,
            _price,
            _stock,
            _imageUrl,
            true
        );

        emit ProductCreated(nextProductId);
        nextProductId++;
        return nextProductId - 1;
    }

    function updateProduct(
        uint256 _id,
        string memory _name,
        string memory _description,
        uint256 _price,
        uint256 _stock,
        string memory _imageUrl,
        bool _active
    ) external onlySeller {
        require(products[_id].id != 0, "Not found");

        Product storage p = products[_id];
        p.name = _name;
        p.description = _description;
        p.price = _price;
        p.stock = _stock;
        p.imageUrl = _imageUrl;
        p.active = _active;

        emit ProductUpdated(_id);
    }

    function deleteProduct(uint256 _id) external onlySeller {
        require(products[_id].id != 0, "Not found");
        delete products[_id];
        emit ProductDeleted(_id);
    }


    function buyProduct(uint256 _productId) external payable {
        Product storage p = products[_productId];

        require(p.id != 0, "Product not found");
        require(p.active, "Product inactive");
        require(p.stock > 0, "Out of stock");
        require(msg.value == p.price, "Incorrect amount");

        p.stock--;
        if (p.stock == 0) {
            p.active = false;
}

        // Registrar compra
        purchases[nextPurchaseId] = Purchase(
            nextPurchaseId,
            _productId,
            msg.sender,
            msg.value,
            block.timestamp
        );

        emit ProductPurchased(_productId, msg.sender);

        nextPurchaseId++;
    }

    function getProducts() external view returns (Product[] memory) {
        Product[] memory list = new Product[](nextProductId - 1);

        for (uint256 i = 1; i < nextProductId; i++) {
            list[i - 1] = products[i];
        }

        return list;
    }

    function getPurchasesByUser(address _wallet)
        external
        view
        returns (Purchase[] memory)
    {
        uint256 count;

        for (uint256 i = 1; i < nextPurchaseId; i++) {
            if (purchases[i].buyer == _wallet) {
                count++;
            }
        }

        Purchase[] memory list = new Purchase[](count);
        uint256 idx = 0;

        for (uint256 i = 1; i < nextPurchaseId; i++) {
            if (purchases[i].buyer == _wallet) {
                list[idx] = purchases[i];
                idx++;
            }
        }

        return list;
    }

    function withdraw(address payable to, uint256 amount) external onlyAdmin {
    require(to != address(0), "Invalid address");
    require(address(this).balance >= amount, "Insufficient balance");

    (bool success, ) = to.call{value: amount}("");
    require(success, "Transfer failed");
}

}
