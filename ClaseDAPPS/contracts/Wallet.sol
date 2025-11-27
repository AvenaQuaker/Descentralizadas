// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSignPaymentWallet {

    // ------------------------------- MULTISIGN ------------------------------------ 
    address[] public owners;
    uint public requiredApprovals;
    mapping(address => bool) public isOwner;

    struct Transaction {
        uint id;
        address to;
        uint amount;
        uint approvalCount;
        bool executed;
        bytes32 txHash;
    }

    Transaction[] public transactions;
    uint public nextTransactionId;
    mapping(uint => mapping(address => bool)) public approvals;

    address[] public payees;
    mapping(address => uint) public shares;
    uint256 public totalShares;

    uint private _status;
    modifier nonReentrant() {
        require(_status != 2, "Reentrancy Guard: Reentrant");
        _status = 2;
        _;
        _status = 1;
    }

    // --------------------------------- EVENTOS  ---------------------------------- 
    event ContractDeployed(address indexed contractAddress, address[] owners, address[] payees, uint256[] shares, uint requiredApprovals);
    event Deposit(address indexed sender, uint amount);
    event TransactionSubmitted(uint indexed txId, address indexed to, uint amount);
    event TransactionApproved(uint indexed txId, address indexed owner);
    event TransactionExecuted(uint indexed txId, address indexed to, uint amount, bytes32 txHash);
    event PaymentReleased(address indexed to, uint amount);

    // --------------------------------- PRODUCTOS ---------------------------------
    event ProductAdded(uint indexed productId, string name, uint price, uint stock, address seller);
    event ProductUpdated(uint indexed productId, string name, uint price);
    event ProductStatusChanged(uint indexed productId, bool active);
    event ProductPurchased(uint indexed productId, address buyer, uint price);
    event ProductPaymentQueued(uint indexed productId, uint indexed txId, uint amount);
    event StockAdded(uint indexed productId, uint amount, uint newStock);

    // ---------------------------------- ROLES -------------------------------------
    enum Role { Customer, Seller, Admin }
    mapping(address => Role) public roles;

    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Only admin");
        _;
    }

    modifier onlySellerOrAdmin() {
        require(
            roles[msg.sender] == Role.Seller ||
            roles[msg.sender] == Role.Admin,
            "Only seller or admin"
        );
        _;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    // -------------------------------- CONSTRUCTOR ---------------------------------
    constructor(
        address[] memory _owners,
        uint _requiredApprovals,
        address[] memory _payees,
        uint256[] memory _shares
    ) {
        _status = 1;
        nextTransactionId = 0;

        require(_owners.length > 0, "Owners required");
        require(_requiredApprovals > 0 && _requiredApprovals <= _owners.length);
        require(_payees.length == _shares.length, "Payees mismatch");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");

            isOwner[owner] = true;
            owners.push(owner);

            roles[owner] = Role.Admin; // Owners son admins
        }

        for (uint i = 0; i < _payees.length; i++) {
            address payee = _payees[i];
            uint256 share = _shares[i];
            require(payee != address(0), "Invalid payee");
            require(share > 0, "Invalid share");
            require(shares[payee] == 0, "Payee exists");

            payees.push(payee);
            shares[payee] = share;
            totalShares += share;
        }

        requiredApprovals = _requiredApprovals;

        emit ContractDeployed(address(this), _owners, _payees, _shares, _requiredApprovals);
    }

    // ------------------------------ FUNCIONES ----------------------------------
    function deposit() external payable {
        require(msg.value > 0);
        emit Deposit(msg.sender, msg.value);
    }

    function submitTransaction(address _to, uint _amount) external onlyOwner {
        require(_to != address(0));
        require(_amount > 0);

        uint txId = nextTransactionId++;
        bytes32 txHash = keccak256(abi.encodePacked(block.timestamp, _to, _amount, txId));

        transactions.push(Transaction(txId, _to, _amount, 0, false, txHash));
        emit TransactionSubmitted(txId, _to, _amount);
    }

    function approveTransaction(uint txId) external onlyOwner {
        Transaction storage t = transactions[txId];
        require(!t.executed, "Executed");
        require(!approvals[txId][msg.sender], "Approved");

        approvals[txId][msg.sender] = true;
        t.approvalCount++;

        emit TransactionApproved(txId, msg.sender);
    }

    function executeTransaction(uint txId) external onlyOwner nonReentrant {
        Transaction storage t = transactions[txId];
        require(t.approvalCount >= requiredApprovals);
        require(!t.executed);
        require(address(this).balance >= t.amount);

        t.executed = true;
        (bool success,) = t.to.call{value: t.amount}("");
        require(success);

        emit TransactionExecuted(txId, t.to, t.amount, t.txHash);
    }

    function releasePayments() external onlyOwner nonReentrant {
        uint balance = address(this).balance;
        require(balance > 0);

        for (uint i = 0; i < payees.length; i++) {
            uint payment = (balance * shares[payees[i]]) / totalShares;
            (bool success,) = payees[i].call{value: payment}("");
            require(success);
            emit PaymentReleased(payees[i], payment);
        }
    }

    // ------------------------------- PRODUCTOS ---------------------------------
    struct Product {
        uint id;
        string name;
        uint price;
        uint stock;
        address seller;
        bool active;
    }

    uint public nextProductId;
    mapping(uint => Product) public products;

    // Permitir que admin asigne vendedores
    function setSeller(address worker) external onlyAdmin {
        roles[worker] = Role.Seller;
    }

    // Crear producto
    function addProduct(string memory _name, uint _price, uint _stock)
        external
        onlySellerOrAdmin
    {
        require(_price > 0, "Invalid price");
        require(_stock > 0, "Invalid stock");

        uint productId = nextProductId++;

        products[productId] = Product({
            id: productId,
            name: _name,
            price: _price,
            stock: _stock,
            seller: msg.sender,
            active: true
        });

        emit ProductAdded(productId, _name, _price, _stock, msg.sender);
    }

    // Agregar stock
    function addStock(uint productId, uint amount) external onlySellerOrAdmin {
        Product storage p = products[productId];
        require(p.active, "Inactive");
        require(amount > 0, "Invalid amount");
        require(msg.sender == p.seller || roles[msg.sender] == Role.Admin, "Not seller");

        p.stock += amount;

        emit StockAdded(productId, amount, p.stock);
    }

    // Comprar producto
    function buyProduct(uint productId) external payable nonReentrant {
        Product storage p = products[productId];
        require(p.active, "Inactive");
        require(p.stock > 0, "Out of stock");
        require(msg.value == p.price, "Incorrect price");

        p.stock -= 1;

        emit ProductPurchased(productId, msg.sender, msg.value);

        uint txId = nextTransactionId++;
        bytes32 txHash = keccak256(
            abi.encodePacked(block.timestamp, p.seller, msg.value, txId)
        );

        transactions.push(Transaction(txId, p.seller, msg.value, 0, false, txHash));

        emit TransactionSubmitted(txId, p.seller, msg.value);
        emit ProductPaymentQueued(productId, txId, msg.value);
    }

    // Editar producto
    function updateProduct(uint productId, string memory newName, uint newPrice)
        external
        onlyAdmin
    {
        require(newPrice > 0);
        Product storage p = products[productId];
        p.name = newName;
        p.price = newPrice;

        emit ProductUpdated(productId, newName, newPrice);
    }

    // Modificar status
    function setProductActive(uint productId, bool _active) external onlyAdmin {
        Product storage p = products[productId];
        p.active = _active;
        emit ProductStatusChanged(productId, _active);
    }

    // Listar productos
    function getAllProducts() external view returns (Product[] memory all) {
        all = new Product[](nextProductId);
        for (uint i = 0; i < nextProductId; i++) all[i] = products[i];
    }

    // Mostrar balance
    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}
