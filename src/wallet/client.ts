import { createWalletClient, custom, type Address, type EIP1193Provider } from "viem";
import { sepolia } from "viem/chains";
import type { WalletStatus } from "../types";

declare global {
  interface Window { ethereum?: EIP1193Provider; }
}

export interface ConnectedWalletState {
  status: WalletStatus;
  address?: Address;
  chainId?: number;
  message?: string;
}

export async function connectInjectedWallet(): Promise<ConnectedWalletState> {
  if (!window.ethereum) {
    return { status: "unavailable", message: "브라우저 확장 지갑이 설치되어 있지 않습니다." };
  }
  const client = createWalletClient({ chain: sepolia, transport: custom(window.ethereum) });
  const [address] = await client.requestAddresses();
  if (!address) throw new Error("연결된 지갑 주소를 찾지 못했습니다.");
  const chainId = await client.getChainId();
  if (chainId !== sepolia.id) {
    return { status: "wrong-network", address, chainId, message: "지갑 네트워크를 Sepolia로 변경해 주세요." };
  }
  return { status: "connected", address, chainId, message: "Sepolia 지갑이 연결되었습니다." };
}

export function getInjectedProvider(): EIP1193Provider {
  if (!window.ethereum) throw new Error("브라우저 확장 지갑이 필요합니다.");
  return window.ethereum;
}
