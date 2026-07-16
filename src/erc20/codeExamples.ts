import type { FunctionLesson } from "./functionLessons";

const SOLIDITY: Record<string, string> = {
  totalSupply: `function totalSupply() public view returns (uint256) {
    return _totalSupply;
}`,
  balanceOf: `function balanceOf(address account) public view returns (uint256) {
    return _balances[account];
}`,
  transfer: `function transfer(address to, uint256 value) public returns (bool) {
    address owner = msg.sender;
    _transfer(owner, to, value);
    return true;
}`,
  approve: `function approve(address spender, uint256 value) public returns (bool) {
    _approve(msg.sender, spender, value);
    return true;
}`,
  allowance: `function allowance(address owner, address spender) public view returns (uint256) {
    return _allowances[owner][spender];
}`,
  transferFrom: `function transferFrom(address from, address to, uint256 value) public returns (bool) {
    _spendAllowance(from, msg.sender, value);
    _transfer(from, to, value);
    return true;
}`,
};

export function codeForLesson(lesson: FunctionLesson) {
  const read = lesson.kind === "READ";
  const args = lesson.name === "totalSupply" ? "" : lesson.name === "balanceOf" ? "[account]" : "args";
  return {
    solidity: SOLIDITY[lesson.name] ?? "",
    typescript: read
      ? `const result = await publicClient.readContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: "${lesson.name}",
  args: ${args || "undefined"},
});`
      : `const { request } = await publicClient.simulateContract({
  account,
  address: tokenAddress,
  abi: erc20Abi,
  functionName: "${lesson.name}",
  args,
});
const hash = await walletClient.writeContract(request);`,
  };
}
