import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type Address,
  type Hash,
} from "viem";
import { sepolia } from "viem/chains";
import type { CompiledContract } from "./compiler";
import type { DeploymentRecord, TokenDraft } from "../types";
import { getInjectedProvider } from "../wallet/client";

export async function deployGeneratedToken(
  contract: CompiledContract,
  draft: TokenDraft,
): Promise<DeploymentRecord> {
  const provider = getInjectedProvider();
  const walletClient = createWalletClient({ chain: sepolia, transport: custom(provider) });
  const [account] = await walletClient.getAddresses();
  if (!account) throw new Error("먼저 지갑을 연결해 주세요.");
  const chainId = await walletClient.getChainId();
  if (chainId !== sepolia.id) throw new Error("Sepolia가 아닌 네트워크에서는 배포할 수 없습니다.");
  const args = draft.capped
    ? [draft.recipient as Address, BigInt(draft.initialSupply), BigInt(draft.maxSupply ?? "0")]
    : [draft.recipient as Address, BigInt(draft.initialSupply)];
  const hash = await walletClient.deployContract({
    account,
    abi: contract.abi,
    bytecode: contract.bytecode,
    args,
  });
  const publicClient = createPublicClient({ chain: sepolia, transport: http() });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success" || !receipt.contractAddress) {
    throw new Error("배포 트랜잭션은 처리되었지만 컨트랙트 주소를 확인하지 못했습니다.");
  }
  return {
    chainId: sepolia.id,
    contractAddress: receipt.contractAddress,
    transactionHash: hash,
    deployer: account,
    name: draft.name,
    symbol: draft.symbol,
    decimals: draft.decimals,
    deployedAt: Date.now(),
  };
}

export async function readTokenSummary(contractAddress: Address, account?: Address) {
  const { erc20Abi } = await import("./abi");
  const client = createPublicClient({ chain: sepolia, transport: http() });
  const [name, symbol, decimals, totalSupply, balance] = await Promise.all([
    client.readContract({ address: contractAddress, abi: erc20Abi, functionName: "name" }),
    client.readContract({ address: contractAddress, abi: erc20Abi, functionName: "symbol" }),
    client.readContract({ address: contractAddress, abi: erc20Abi, functionName: "decimals" }),
    client.readContract({ address: contractAddress, abi: erc20Abi, functionName: "totalSupply" }),
    account ? client.readContract({ address: contractAddress, abi: erc20Abi, functionName: "balanceOf", args: [account] }) : Promise.resolve(0n),
  ]);
  return { name, symbol, decimals, totalSupply, balance };
}

export async function readTokenAllowance(contractAddress: Address, owner: Address, spender: Address): Promise<bigint> {
  const { erc20Abi } = await import("./abi");
  const client = createPublicClient({ chain: sepolia, transport: http() });
  return client.readContract({ address: contractAddress, abi: erc20Abi, functionName: "allowance", args: [owner, spender] });
}

export async function writeToken(
  contractAddress: Address,
  functionName: "transfer" | "approve" | "transferFrom",
  args: readonly [Address, bigint] | readonly [Address, Address, bigint],
): Promise<Hash> {
  const { erc20Abi } = await import("./abi");
  const provider = getInjectedProvider();
  const wallet = createWalletClient({ chain: sepolia, transport: custom(provider) });
  const [account] = await wallet.getAddresses();
  if (!account) throw new Error("먼저 지갑을 연결해 주세요.");
  if ((await wallet.getChainId()) !== sepolia.id) throw new Error("지갑 네트워크를 Sepolia로 변경해 주세요.");
  const publicClient = createPublicClient({ chain: sepolia, transport: http() });
  const simulation = await publicClient.simulateContract({ address: contractAddress, abi: erc20Abi, functionName, args: args as never, account });
  return wallet.writeContract(simulation.request);
}

export async function useAllowancePlayground(
  playground: Address,
  token: Address,
  action: "pullToken" | "returnToken",
  amount: bigint,
): Promise<Hash> {
  const abi = [
    { type: "function", name: "pullToken", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
    { type: "function", name: "returnToken", stateMutability: "nonpayable", inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }], outputs: [] },
  ] as const;
  const provider = getInjectedProvider();
  const wallet = createWalletClient({ chain: sepolia, transport: custom(provider) });
  const [account] = await wallet.getAddresses();
  if (!account) throw new Error("먼저 지갑을 연결해 주세요.");
  if ((await wallet.getChainId()) !== sepolia.id) throw new Error("지갑 네트워크를 Sepolia로 변경해 주세요.");
  const publicClient = createPublicClient({ chain: sepolia, transport: http() });
  const simulation = await publicClient.simulateContract({ address: playground, abi, functionName: action, args: [token, amount], account });
  return wallet.writeContract(simulation.request);
}
