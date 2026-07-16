// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20Learning {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @notice Sepolia에서 한 지갑으로 approve/transferFrom을 연습하기 위한 교육용 컨트랙트입니다.
contract AllowancePlayground {
    mapping(address user => mapping(address token => uint256 amount)) public deposited;

    event TokensPulled(address indexed user, address indexed token, uint256 amount);
    event TokensReturned(address indexed user, address indexed token, uint256 amount);

    function pullToken(address token, uint256 amount) external {
        require(amount > 0, "Amount must be positive");
        require(IERC20Learning(token).transferFrom(msg.sender, address(this), amount), "transferFrom failed");
        deposited[msg.sender][token] += amount;
        emit TokensPulled(msg.sender, token, amount);
    }

    function returnToken(address token, uint256 amount) external {
        uint256 available = deposited[msg.sender][token];
        require(amount > 0 && available >= amount, "Insufficient deposited amount");
        deposited[msg.sender][token] = available - amount;
        require(IERC20Learning(token).transfer(msg.sender, amount), "transfer failed");
        emit TokensReturned(msg.sender, token, amount);
    }
}
