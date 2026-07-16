import { formatUnits, parseUnits, type Address } from "viem";

export function parseTokenAmount(value: string, decimals: number): bigint {
  const trimmed = value.trim();
  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) {
    if (trimmed.startsWith("-")) throw new Error("토큰 수량은 0 이상이어야 합니다.");
    throw new Error("토큰 수량을 숫자로 입력해 주세요.");
  }
  return parseUnits(trimmed, decimals);
}

export function formatTokenAmount(value: bigint, decimals: number): string {
  return formatUnits(value, decimals);
}

export function shortenAddress(address: Address | string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatLab(value: bigint): string {
  return new Intl.NumberFormat("ko-KR").format(value) + " LAB";
}

export function escapeCode(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
