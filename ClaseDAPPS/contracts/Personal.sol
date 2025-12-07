// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PersonalManager {

    // ---------------------------------- ROLES -------------------------------------
    enum Role { Customer, Seller, Admin }

    // Datos del personal
    struct Person {
        uint id;
        string email;
        bytes32 passwordHash;
        string username;
        Role role;
        string imageUrl;
        uint salary;
        bool active;
        address wallet;
    }

    uint public nextPersonId;
    mapping(uint => Person) public persons;
    mapping(address => uint) public walletToPersonId;

    address public owner;

    // Modificador de acceso para rol de admin
    modifier onlyContractAdmin() {
        require(
            walletToPersonId[msg.sender] != 0 &&
            persons[walletToPersonId[msg.sender]].role == Role.Admin,
            "Only admin"
        );
        _;
    }

    // Crear el primer admin por default
    constructor() {
        owner = msg.sender;

        persons[1] = Person({
            id: 1,
            email: "admin@dapps.com",
            passwordHash: keccak256(bytes("admin")),
            username: "admin",
            role: Role.Admin,
            imageUrl: "img/admin.png",
            salary: 500,
            active: true,
            wallet: msg.sender
        });

        walletToPersonId[msg.sender] = 1;
        nextPersonId = 2;
    }

    // -------------------------------- PERSONAL -------------------------------
    // Crear personal
    function createPerson(
        string memory _email,
        string memory _password,
        string memory _username,
        Role _role,
        string memory _imageUrl,
        uint _salary,
        address _wallet
    ) external onlyContractAdmin {

        require(_wallet != address(0), "Invalid wallet");
        require(walletToPersonId[_wallet] == 0, "Wallet already registered");

        uint personId = nextPersonId++;

        persons[personId] = Person({
            id: personId,
            email: _email,
            passwordHash: keccak256(bytes(_password)),
            username: _username,
            role: _role,
            imageUrl: _imageUrl,
            salary: _salary,
            active: true,
            wallet: _wallet
        });

        walletToPersonId[_wallet] = personId;
    }

    // -------------------------------- LOGIN  --------------------------------
    // Validacion de personal
    function login(address _wallet, string memory _password)
        external view returns (bool)
    {
        uint id = walletToPersonId[_wallet];
        require(persons[id].active, "Inactive user");

        return persons[id].passwordHash == keccak256(bytes(_password));
    }

    // -------------------------------- ROL O SALARIO --------------------------------
    // Actualizar rol de un personal
    function updateRole(uint _id, Role _newRole)
        external onlyContractAdmin
    {
        require(_id < nextPersonId, "Invalid ID");
        persons[_id].role = _newRole;
    }

    // Actualizar salario de un personal
    function updateSalary(uint _id, uint _newSalary)
        external onlyContractAdmin
    {
        require(_id < nextPersonId, "Invalid ID");
        persons[_id].salary = _newSalary;
    }

    // -------------------------------- ADMINISTRAR PERSONAL --------------------------------
    // Modificar estatus
    function setActive(uint _id, bool _active)
        external onlyContractAdmin
    {
        require(_id < nextPersonId, "Invalid ID");
        persons[_id].active = _active;
    }

    // Actualizar datos
    function updateBasicData(uint _id, string memory _email, string memory _username, string memory _imageUrl) external onlyContractAdmin 
    {
        require(_id < nextPersonId, "Invalid ID");

        persons[_id].email = _email;
        persons[_id].username = _username;
        persons[_id].imageUrl = _imageUrl;
    }

    // Listar personal
    function getAllPersons() 
        external view 
        returns (Person[] memory)
    {
        Person[] memory list = new Person[](nextPersonId);

        for (uint i = 0; i < nextPersonId; i++) {
            list[i] = persons[i];
        }

        return list;
    }

    // Obtener el usuario segun su wallet MetaMask
    function getPersonByWallet(address _wallet)
        external view
        returns (
            uint id,
            string memory email,
            string memory username,
            Role role,
            string memory imageUrl,
            uint salary,
            bool active
        )
    {
        uint personId = walletToPersonId[_wallet];
        require(personId != 0, "Person not found");

        Person memory p = persons[personId];

        return (
            p.id,
            p.email,
            p.username,
            p.role,
            p.imageUrl,
            p.salary,
            p.active
        );
    }
}
