export const EDUCATIONAL_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * 이 코드는 ERC-20의 내부 동작을 학습하기 위한 교육용 구현입니다.
 * 실제 서비스용 토큰은 검증된 OpenZeppelin 구현을 사용해야 합니다.
 */
contract LearningToken {
    string public name = "Learning Token";
    string public symbol = "LAB";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(uint256 initialSupply) {
        totalSupply = initialSupply * 10 ** decimals;
        balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account]; // 과제 2: 이 매핑이 무엇을 반환하는지 확인하세요.
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return allowances[owner][spender];
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(allowances[from][msg.sender] >= amount, "Insufficient allowance");
        require(balances[from] >= amount, "Insufficient balance");
        allowances[from][msg.sender] -= amount;
        balances[from] -= amount;
        balances[to] += amount;
        emit Transfer(from, to, amount);
        return true;
    }
}
`;

export const CODE_TASKS = [
  { title: "토큰 정보 수정", hint: "name, symbol, constructor의 initialSupply를 찾아보세요." },
  { title: "balanceOf 이해", hint: "주소를 key로 사용하는 balances 매핑에서 값을 읽습니다." },
  { title: "transfer 이해", hint: "잔액 확인 → 감소 → 증가 → Transfer 이벤트 순서입니다." },
  { title: "approve와 allowance", hint: "allowances[owner][spender]처럼 2단계 매핑을 사용합니다." },
  { title: "transferFrom 이해", hint: "msg.sender의 allowance와 from의 balance를 모두 확인해야 합니다." },
];
