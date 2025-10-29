pragma solidity ^0.8.0;

contract Pagos {
    address[] public payees;
    mapping(address => uint) public shares;
    mapping(address => uint) public released;
    uint public totalShares;
    uint public totalReleased;

    event PaymentReceived(address from, uint amount);
    event PaymentReleased(address to, uint amount);

    constructor(address[] memory _payees, uint[] memory _shares) {
        require(_payees.length == _shares.length, "Payees and shares length mismatch");
        require(_payees.length > 0, "No payees");

        for (uint i = 0; i < _payees.length; i++) {
            require(_payees[i] != address(0), "Invalid payee");
            require(_shares[i] > 0, "Shares must be > 0");
            payees.push(_payees[i]);
            shares[_payees[i]] = _shares[i];
            totalShares += _shares[i];
        }
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }

    function deposit() external payable {
        require(msg.value > 0, "No ether sent");
        emit PaymentReceived(msg.sender, msg.value);
    }

    function release(address payable account) external {
        require(shares[account] > 0, "Account has no shares");

        uint totalReceived = address(this).balance + totalReleased;
        uint payment = (totalReceived * shares[account]) / totalShares - released[account];
        require(payment > 0, "No payment due");

        released[account] += payment;
        totalReleased += payment;

        (bool success, ) = account.call{value: payment}("");
        require(success, "Transfer failed");

        emit PaymentReleased(account, payment);
    }

    function getPayees() external view returns (address[] memory) {
        return payees;
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}
