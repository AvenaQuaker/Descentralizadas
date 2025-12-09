// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

contract PersonalManager {
    enum Role {
        None,
        Admin,
        Seller,
        Customer
    }

    struct Person {
        uint256 id;
        string email;
        string username;
        string imageUrl;
        Role role;
        uint256 salary;
        bool active;
        address wallet;
    }

    struct PurchaseRecord {
        uint256 purchaseId; 
        uint256 productId;
        uint256 timestamp;
        uint256 amountPaid;
    }

    // STORAGE
    mapping(uint256 => Person) public persons;
    mapping(address => uint256) public walletToPersonId;
    mapping(uint256 => PurchaseRecord[]) public purchasesByPerson;

    uint256 public nextPersonId;
    uint256[] private personIds;   // <--- AGREGADO

    // EVENTS
    event PersonCreated(uint256 id, address wallet, Role role);
    event PurchaseRegistered(uint256 personId, uint256 productId);

    // MODIFIERS
    modifier onlyAdmin() {
        uint256 id = walletToPersonId[msg.sender];
        require(id != 0, "Not registered");
        require(persons[id].role == Role.Admin, "Not admin");
        _;
    }

    modifier onlyExistingUser(address user) {
        require(walletToPersonId[user] != 0, "User not registered");
        _;
    }

    // CONSTRUCTOR
    constructor() {
        nextPersonId = 1;

        persons[nextPersonId] = Person({
            id: nextPersonId,
            email: "admin@system.com",
            username: "admin",
            imageUrl: "",
            role: Role.Admin,
            salary: 0,
            active: true,
            wallet: msg.sender
        });

        walletToPersonId[msg.sender] = nextPersonId;
        personIds.push(nextPersonId); // <--- AGREGADO

        emit PersonCreated(nextPersonId, msg.sender, Role.Admin);
        nextPersonId++;
    }

    // AUTO-REGISTER CUSTOMER
    function autoRegisterCustomer(address _wallet)
        external
        returns (uint256)
    {
        require(_wallet != address(0), "Invalid wallet");
        require(walletToPersonId[_wallet] == 0, "Already registered");

        persons[nextPersonId] = Person(
            nextPersonId,
            "",
            "",
            "",
            Role.Customer,
            0,
            true,
            _wallet
        );

        walletToPersonId[_wallet] = nextPersonId;
        personIds.push(nextPersonId); // <--- AGREGADO

        emit PersonCreated(nextPersonId, _wallet, Role.Customer);

        nextPersonId++;
        return nextPersonId - 1;
    }

    // REGISTER PURCHASE
    function registerPurchase(
        address buyerWallet,
        uint256 purchaseId,
        uint256 productId,
        uint256 amountPaid
    ) external onlyExistingUser(buyerWallet) {
        uint256 personId = walletToPersonId[buyerWallet];

        purchasesByPerson[personId].push(
            PurchaseRecord({
                purchaseId: purchaseId,
                productId: productId,
                timestamp: block.timestamp,
                amountPaid: amountPaid
            })
        );

        emit PurchaseRegistered(personId, productId);
    }

    // GET PURCHASES
    function getPurchasesByPerson(uint256 personId)
        external
        view
        returns (PurchaseRecord[] memory)
    {
        return purchasesByPerson[personId];
    }

    // GET PERSON BY WALLET
    function getPersonByWallet(address _wallet)
        external
        view
        returns (Person memory)
    {
        uint256 id = walletToPersonId[_wallet];
        require(id != 0, "User not found");
        return persons[id];
    }

    function exists(address _wallet) external view returns (bool) {
        return walletToPersonId[_wallet] != 0;
    }

    function roleOf(address _wallet) external view returns (uint8) {
        uint256 id = walletToPersonId[_wallet];
        if (id == 0) return uint8(Role.None);
        return uint8(persons[id].role);
    }

    // ADMIN UPDATE USER
    function updateUser(
        uint256 personId,
        string memory email,
        string memory username,
        string memory imageUrl,
        bool active
    ) external onlyAdmin {
        require(persons[personId].id != 0, "User not found");

        Person storage p = persons[personId];
        p.email = email;
        p.username = username;
        p.imageUrl = imageUrl;
        p.active = active;
    }

    function setRole(uint256 personId, Role newRole) external onlyAdmin {
        require(persons[personId].id != 0, "User not found");
        persons[personId].role = newRole;
    }

    function getAllPersons() external view returns (Person[] memory) {
        Person[] memory list = new Person[](personIds.length);

        for (uint256 i = 0; i < personIds.length; i++) {
            list[i] = persons[personIds[i]];
        }

        return list;
    }

    
}
