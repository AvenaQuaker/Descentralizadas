// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSignPaymentWallet {
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
        require(_status != 2, "Reentrancy Guard: Reentrant call");
        _status = 2;
        _;
        _status = 1;
    }

    // Eventos
    event ContractDeployed(
        address indexed contractAddress,
        address[] owners,
        address[] payees,
        uint256[] shares,
        uint requiredApprovals
    );
    event Deposit(address indexed sender, uint amount);
    event TransactionSubmitted(
        uint indexed txId,
        address indexed to,
        uint amount
    );
    event TransactionApproved(uint indexed txId, address indexed owner);
    event TransactionExecuted(
        uint indexed txId,
        address indexed to,
        uint amount,
        bytes32 txHash
    );
    event PaymentReleased(address indexed to, uint amount);

    // Eventos para productos
    event ProductAdded(
        uint indexed productId,
        string name,
        uint price,
        address seller
    );
    event ProductPurchased(uint indexed productId, address buyer, uint price);
    event ProductPaymentQueued(
        uint indexed productId,
        uint indexed txId,
        uint amount
    );
    event ProductStatusChanged(uint indexed productId, bool active);
    event ProductUpdated(uint indexed productId, string name, uint price);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not an owner");
        _;
    }

    constructor(
        address[] memory _owners,
        uint _requiredApprovals,
        address[] memory _payees,
        uint256[] memory _shares
    ) {
        _status = 1;
        nextTransactionId = 0;
        require(_owners.length > 0, "Owners required");
        require(
            _requiredApprovals > 0 && _requiredApprovals <= _owners.length,
            "Invalid number of required approvals"
        );
        require(_payees.length == _shares.length, "Payees and shares mismatch");

        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");
            isOwner[owner] = true;
            owners.push(owner);
        }

        for (uint i = 0; i < _payees.length; i++) {
            address payee = _payees[i];
            uint256 share = _shares[i];
            require(payee != address(0), "Invalid payee");
            require(share > 0, "Share must be greater than zero");
            require(shares[payee] == 0, "Payee already exists");
            payees.push(payee);
            shares[payee] = share;
            totalShares += share;
        }

        requiredApprovals = _requiredApprovals;

        emit ContractDeployed(
            address(this),
            _owners,
            _payees,
            _shares,
            _requiredApprovals
        );
    }

    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        emit Deposit(msg.sender, msg.value);
    }

    function submitTransaction(address _to, uint _amount) external onlyOwner {
        require(_to != address(0), "Invalid recipient");
        require(_amount > 0, "Amount must be greater than zero");

        uint txId = nextTransactionId++;
        bytes32 txHash = keccak256(
            abi.encodePacked(block.timestamp, _to, _amount, txId)
        );

        transactions.push(
            Transaction({
                id: txId,
                to: _to,
                amount: _amount,
                approvalCount: 0,
                executed: false,
                txHash: txHash
            })
        );

        emit TransactionSubmitted(txId, _to, _amount);
    }

    function approveTransaction(uint txId) external onlyOwner {
        Transaction storage transaction = transactions[txId];
        require(!transaction.executed, "Already executed");
        require(!approvals[txId][msg.sender], "Already approved");

        approvals[txId][msg.sender] = true;
        transaction.approvalCount++;

        emit TransactionApproved(txId, msg.sender);
    }

    function executeTransaction(uint txId) external onlyOwner nonReentrant {
        Transaction storage transaction = transactions[txId];
        require(
            transaction.approvalCount >= requiredApprovals,
            "Not enough approvals"
        );
        require(!transaction.executed, "Transaction already executed");
        require(
            address(this).balance >= transaction.amount,
            "Insufficient balance"
        );

        transaction.executed = true;
        (bool success, ) = transaction.to.call{value: transaction.amount}("");
        require(success, "Execution failed");

        emit TransactionExecuted(
            txId,
            transaction.to,
            transaction.amount,
            transaction.txHash
        );
    }

    function releasePayments() external onlyOwner nonReentrant {
        uint balance = address(this).balance;
        require(balance > 0, "No funds to release");

        for (uint i = 0; i < payees.length; i++) {
            uint payment = (balance * shares[payees[i]]) / totalShares;
            (bool success, ) = payees[i].call{value: payment}("");
            require(success, "Transaction failed");
            emit PaymentReleased(payees[i], payment);
        }
    }

    struct Product {
        uint id;
        string name;
        uint price;
        address seller;
        bool active;
    }

    uint public nextProductId;
    mapping(uint => Product) public products;

    function addProduct(string memory _name, uint _price) external onlyOwner {
        require(_price > 0, "Price must be greater than zero");

        uint productId = nextProductId++;
        products[productId] = Product({
            id: productId,
            name: _name,
            price: _price,
            seller: msg.sender,
            active: true
        });

        emit ProductAdded(productId, _name, _price, msg.sender);
    }

    function buyProduct(uint _productId) external payable nonReentrant {
        Product storage product = products[_productId];
        require(product.active, "Product inactive");
        require(msg.value == product.price, "Incorrect payment");

        emit ProductPurchased(_productId, msg.sender, msg.value);

        uint txId = nextTransactionId++;
        bytes32 txHash = keccak256(
            abi.encodePacked(block.timestamp, product.seller, msg.value, txId)
        );

        transactions.push(
            Transaction({
                id: txId,
                to: product.seller,
                amount: msg.value,
                approvalCount: 0,
                executed: false,
                txHash: txHash
            })
        );

        emit TransactionSubmitted(txId, product.seller, msg.value);
        emit ProductPaymentQueued(_productId, txId, msg.value);
    }

    function getTransactions() external view returns (Transaction[] memory) {
        return transactions;
    }

    function getAllProducts() external view returns (Product[] memory) {
        Product[] memory all = new Product[](nextProductId);
        for (uint i = 0; i < nextProductId; i++) {
            all[i] = products[i];
        }
        return all;
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }

    function updateProduct(
        uint _productId,
        string memory _newName,
        uint _newPrice
    ) external onlyOwner {
        require(_productId < nextProductId, "Invalid product ID");
        require(_newPrice > 0, "Price must be greater than zero");

        Product storage product = products[_productId];
        product.name = _newName;
        product.price = _newPrice;

        emit ProductUpdated(_productId, _newName, _newPrice);
    }

    function setProductActive(
        uint _productId,
        bool _active
    ) external onlyOwner {
        require(_productId < nextProductId, "Invalid product ID");

        Product storage product = products[_productId];
        product.active = _active;

        emit ProductStatusChanged(_productId, _active);
    }

    // Extra: Liberar fondos ignorando cuenta
    function releaseToPayee(
        address _payee,
        uint _amount
    ) external onlyOwner nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        require(
            address(this).balance >= _amount,
            "Insufficient contract balance"
        );

        (bool success, ) = _payee.call{value: _amount}("");
        require(success, "Transfer failed");

        emit PaymentReleased(_payee, _amount);
    }
}
