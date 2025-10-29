// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.0;

contract MultiSignPaymentWallet{
    address[]public owners;
    uint public requiredApprovals;
    mapping (address => bool) public isOwner;

    struct Transaction{
        address to;
        uint amount;
        uint approvalCount;
        bool executed;
    }
    Transaction[] public transactions;
    mapping(uint => mapping(address => bool)) public approvals;
    address[] public payees;
    mapping(address=>uint) public shares;
    uint256 public totalShares;

    uint private _status;
    modifier nonRreentrant(){
        require(_status!=2,"Reentrancy Guard, Reentrant Call");
        _status=2;
        _;
        _status=1;
    }

    event Deposit(address indexed sender, uint amount);
    event TransactionSubmitted(uint indexed txId, address indexed to, uint amount);
    event TransactionApproved(uint indexed txId, address indexed owner);
    event TransactionExecuted(uint indexed txId, address indexed to, uint amount);
    event PaymentReleased(address indexed to, uint amount);
    modifier onlyOwner(){
        require(isOwner[msg.sender],"Not an owner");
        _;
    }

        constructor(
        address[] memory _owners,
        uint _requiredApprovals,
        address[] memory _payees,
        uint256[] memory _shares
    ) {
        _status = 1;
        require(_owners.length > 0, "Owners required");
        require(
            _requiredApprovals > 0 && _requiredApprovals <= _owners.length,
            "Invalid number of required approvals"
        );
        require(_payees.length == _shares.length, "Payees and shares length mismatch");

        // Registrar owners
        for (uint i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Owner not unique");
            isOwner[owner] = true;
            owners.push(owner);
        }

        // Registrar payees y shares
        for (uint i = 0; i < _payees.length; i++) {
            address payee = _payees[i];
            uint256 share = _shares[i];
            require(payee != address(0), "Invalid payee");
            require(share > 0, "Share must be > 0");
            require(shares[payee] == 0, "Payee already exists");

            payees.push(payee);
            shares[payee] = share;
            totalShares += share;
        }

        requiredApprovals = _requiredApprovals;
    }


    function deposit() external payable{
        require(msg.value>0,"Deposit amount must be greater than zero");
        emit Deposit(msg.sender,msg.value);
    }
    function submitTransaction(address _to,uint _amount) external onlyOwner{
        require(_to!=address(0),"Invalid recipient");
        require(_amount>0,"Amount must be greater than zero");
        transactions.push(Transaction({
            to:_to,
            amount:_amount,
            approvalCount:0,
            executed:false
        }));
        emit TransactionSubmitted(transactions.length-1,_to,_amount);
    }

    function approveTransaction(uint txId) external onlyOwner {
        Transaction storage transaction = transactions[txId];
        require(!transaction.executed, "TRANSACCION YA EJECUTADA");
        require(!approvals[txId][msg.sender], "ESTA COSA YA FUE APROBAADA");

        approvals[txId][msg.sender] = true;
        transaction.approvalCount++;

        approvalDetails[txId].push(ApprovalInfo({
            approver: msg.sender,
            timestamp: block.timestamp
        }));

        emit TransactionApproved(txId, msg.sender);
    }

    function getApprovalsForTransaction(uint txId)
        external
        view
        returns (ApprovalInfo[] memory)
    {
        return approvalDetails[txId];
    }


    function executeTransaction(uint txId) external onlyOwner nonRreentrant{
        Transaction storage transaction=transactions[txId];
        require(
            transaction.approvalCount>=requiredApprovals,
            "Not enough approvals"
        );
        require(!transaction.executed,"Transaction already executed");
        require(address(this).balance>=transaction.amount,"Insufficient balance");
        transaction.executed=true;
        (bool success,)=transaction.to.call{value:transaction.amount}("");
        require(success,"Transaction execution failed");
        emit TransactionExecuted(txId,transaction.to,transaction.amount);
    }
    
    function releasePayments() external onlyOwner nonRreentrant{
        uint balance=address(this).balance;
        for(uint i=0;i<payees.length;i++){
            address payee = payees[i];
            uint payment = (balance * shares[payee]) / totalShares;
            (bool success, ) = payee.call{value: payment}("");
            require (success, "Transaction failed");
            emit PaymentReleased(payee, payment);

        }
    }

    function getTransactions() external view returns (Transaction[] memory){
        return transactions;
    }

    function getBalance() external view returns (uint){
        return address(this).balance;
    }

    struct ApprovalInfo {
    address approver;
    uint256 timestamp;
    }

    mapping(uint => ApprovalInfo[]) public approvalDetails;

    struct Product {
        uint id;
        string name;
        uint price;
        address seller;
        bool active;
    }

    uint public nextProductId;
    mapping(uint => Product) public products;
    mapping(address => uint[]) public purchases;

    event ProductAdded(uint id, string name, uint price, address seller);
    event ProductPurchased(uint id, address buyer, uint price);

    function addProduct(string memory _name, uint _price) external onlyOwner {
        require(_price > 0, "El precio debe ser mayor a 0");
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

    function buyProduct(uint _productId) external payable nonRreentrant {
        Product storage product = products[_productId];
        require(product.id == _productId, "Producto no existe");
        require(product.active, "Producto no disponible");
        require(msg.value == product.price, "Monto incorrecto");

        purchases[msg.sender].push(_productId);
        
        (bool success, ) = product.seller.call{value: msg.value}("");
        require(success, "Pago al vendedor fallido");
        
        emit ProductPurchased(_productId, msg.sender, product.price);
    }
    

    function disableProduct(uint _productId) external onlyOwner {
        products[_productId].active = false;
    }

    function getAllProducts() external view returns (Product[] memory) {
        Product[] memory all = new Product[](nextProductId);
        for (uint i = 0; i < nextProductId; i++) {
            all[i] = products[i];
        }
        return all;
    }

}