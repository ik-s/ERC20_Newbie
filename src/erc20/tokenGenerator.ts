import { isAddress } from "viem";
import type { TokenDraft } from "../types";

export interface DraftValidationError {
  field: keyof TokenDraft;
  message: string;
}

export function createDefaultTokenDraft(): TokenDraft {
  return {
    name: "My Learning Token",
    symbol: "MLT",
    initialSupply: "1000000",
    recipient: "0x1111111111111111111111111111111111111111",
    decimals: 18,
    burnable: false,
    mintable: false,
    capped: false,
    sourceCode: "",
  };
}

export function validateTokenDraft(draft: TokenDraft): DraftValidationError[] {
  const errors: DraftValidationError[] = [];
  if (draft.name.trim().length < 2 || draft.name.trim().length > 40) {
    errors.push({ field: "name", message: "토큰 이름은 2~40자로 입력해 주세요." });
  }
  if (!/^[A-Z0-9]{2,8}$/.test(draft.symbol)) {
    errors.push({ field: "symbol", message: "심볼은 영문 대문자와 숫자 2~8자로 입력해 주세요." });
  }
  if (!/^\d+$/.test(draft.initialSupply) || Number(draft.initialSupply) <= 0) {
    errors.push({ field: "initialSupply", message: "초기 발행량은 0보다 큰 정수여야 합니다." });
  }
  if (!isAddress(draft.recipient)) {
    errors.push({ field: "recipient", message: "올바른 이더리움 수령 주소를 입력해 주세요." });
  }
  if (!Number.isInteger(draft.decimals) || draft.decimals < 0 || draft.decimals > 18) {
    errors.push({ field: "decimals", message: "decimals는 0~18 사이의 정수여야 합니다." });
  }
  if (draft.capped) {
    const maximum = Number(draft.maxSupply ?? "");
    if (!Number.isFinite(maximum) || maximum <= 0 || maximum < Number(draft.initialSupply)) {
      errors.push({ field: "maxSupply", message: "최대 발행량은 초기 발행량 이상이어야 합니다." });
    }
  }
  return errors;
}

export function generateTokenSource(draft: TokenDraft): string {
  const imports = ['import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";'];
  const parents = ["ERC20"];
  if (draft.burnable) {
    imports.push('import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";');
    parents.push("ERC20Burnable");
  }
  if (draft.capped) {
    imports.push('import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";');
    parents.push("ERC20Capped");
  }
  if (draft.mintable) {
    imports.push('import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";');
    parents.push("Ownable");
  }

  const constructorParents = [
    `ERC20(${JSON.stringify(draft.name.trim())}, ${JSON.stringify(draft.symbol)})`,
  ];
  if (draft.capped) constructorParents.push("ERC20Capped(maxSupply * 10 ** decimals())");
  if (draft.mintable) constructorParents.push("Ownable(msg.sender)");

  const extras: string[] = [];
  if (draft.mintable) {
    extras.push(`    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }`);
  }
  if (draft.capped) {
    extras.push(`    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }`);
  }

  const maxParameter = draft.capped ? ", uint256 maxSupply" : "";
  return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

${imports.join("\n")}

contract MyToken is ${parents.join(", ")} {
    constructor(address recipient, uint256 initialSupply${maxParameter})
        ${constructorParents.join(" ")}
    {
        _mint(recipient, initialSupply * 10 ** decimals());
    }
${extras.length ? `\n${extras.join("\n\n")}\n` : ""}}
`;
}
