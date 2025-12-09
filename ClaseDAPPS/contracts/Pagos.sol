// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Pagos {
    address[] private payees;
    mapping(address => uint256) public shares;
    mapping(address => uint256) public released;
    uint256 public totalShares;
    uint256 public totalReleased;

    event PaymentReceived(address indexed from, uint256 amount);
    event PaymentReleased(address indexed to, uint256 amount);

    constructor(address[] memory _payees, uint256[] memory _shares) {
        require(_payees.length == _shares.length, "Payees/shares mismatch");
        require(_payees.length > 0, "No payees provided");

        for (uint256 i = 0; i < _payees.length; i++) {
            _addPayee(_payees[i], _shares[i]);
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
        require(shares[account] > 0, "Not a payee");

        uint256 totalReceived = address(this).balance + totalReleased;
        uint256 payment = pendingPayment(account, totalReceived);

        require(payment > 0, "Nothing to release");

        released[account] += payment;
        totalReleased += payment;

        (bool success, ) = account.call{value: payment}("");
        require(success, "Transfer failed");

        emit PaymentReleased(account, payment);
    }

    function pendingPayment(address account, uint256 totalReceived)
        public
        view
        returns (uint256)
    {
        return (totalReceived * shares[account]) / totalShares - released[account];
    }

    function getPayees() external view returns (address[] memory) {
        return payees;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function _addPayee(address account, uint256 share) internal {
        require(account != address(0), "Invalid payee");
        require(share > 0, "Share must be >0");
        require(shares[account] == 0, "Payee already added");

        payees.push(account);
        shares[account] = share;
        totalShares += share;
    }


}
