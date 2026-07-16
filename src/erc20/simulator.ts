import type { Address } from "viem";

export const ACCOUNTS = {
  alice: "0x1111111111111111111111111111111111111111",
  bob: "0x2222222222222222222222222222222222222222",
  dex: "0x3333333333333333333333333333333333333333",
} as const satisfies Record<string, Address>;

export type AccountName = keyof typeof ACCOUNTS;

export type SimulationEvent =
  | {
      name: "Transfer";
      from: Address;
      to: Address;
      value: bigint;
      timestamp: number;
    }
  | {
      name: "Approval";
      owner: Address;
      spender: Address;
      value: bigint;
      timestamp: number;
    };

export interface SimulationSnapshot {
  totalSupply: bigint;
  balances: Map<Address, bigint>;
  allowances: Map<Address, Map<Address, bigint>>;
  events: SimulationEvent[];
}

export type SimulationResult =
  | { ok: true; value: bigint | boolean; message: string }
  | { ok: false; message: string };

const createInitialState = (): SimulationSnapshot => ({
  totalSupply: 1100n,
  balances: new Map<Address, bigint>([
    [ACCOUNTS.alice, 1000n],
    [ACCOUNTS.bob, 100n],
    [ACCOUNTS.dex, 0n],
  ]),
  allowances: new Map(),
  events: [],
});

const cloneState = (state: SimulationSnapshot): SimulationSnapshot => ({
  totalSupply: state.totalSupply,
  balances: new Map(state.balances),
  allowances: new Map(
    [...state.allowances].map(([owner, allowances]) => [
      owner,
      new Map(allowances),
    ]),
  ),
  events: state.events.map((event) => ({ ...event })),
});

export class TokenSimulator {
  private state = createInitialState();

  get events(): readonly SimulationEvent[] {
    return this.state.events;
  }

  totalSupply(): bigint {
    return this.state.totalSupply;
  }

  balanceOf(account: Address): bigint {
    return this.state.balances.get(account) ?? 0n;
  }

  allowance(owner: Address, spender: Address): bigint {
    return this.state.allowances.get(owner)?.get(spender) ?? 0n;
  }

  transfer(caller: Address, to: Address, amount: bigint): SimulationResult {
    const validation = this.validateTransfer(caller, to, amount);
    if (validation) return validation;

    const next = cloneState(this.state);
    next.balances.set(caller, this.balanceOf(caller) - amount);
    next.balances.set(to, this.balanceOf(to) + amount);
    next.events.push({
      name: "Transfer",
      from: caller,
      to,
      value: amount,
      timestamp: Date.now(),
    });
    this.state = next;
    return { ok: true, value: true, message: `${amount} LAB 전송에 성공했습니다.` };
  }

  approve(owner: Address, spender: Address, amount: bigint): SimulationResult {
    if (amount < 0n) {
      return { ok: false, message: "승인 수량은 0 이상이어야 합니다." };
    }
    if (owner === spender) {
      return { ok: false, message: "소유자와 승인받는 주소는 달라야 합니다." };
    }

    const next = cloneState(this.state);
    const ownerAllowances = next.allowances.get(owner) ?? new Map<Address, bigint>();
    ownerAllowances.set(spender, amount);
    next.allowances.set(owner, ownerAllowances);
    next.events.push({
      name: "Approval",
      owner,
      spender,
      value: amount,
      timestamp: Date.now(),
    });
    this.state = next;
    return {
      ok: true,
      value: true,
      message: `${amount} LAB 사용 권한을 승인했습니다. 토큰은 아직 이동하지 않았습니다.`,
    };
  }

  transferFrom(
    caller: Address,
    from: Address,
    to: Address,
    amount: bigint,
  ): SimulationResult {
    if (amount <= 0n) {
      return { ok: false, message: "전송 수량은 0보다 커야 합니다." };
    }
    const approved = this.allowance(from, caller);
    if (approved < amount) {
      return {
        ok: false,
        message: `현재 허용 수량은 ${approved} LAB입니다. ${amount} LAB을 대신 전송할 수 없습니다.`,
      };
    }
    const balance = this.balanceOf(from);
    if (balance < amount) {
      return {
        ok: false,
        message: `소유자의 잔액은 ${balance} LAB입니다. ${amount} LAB을 전송할 수 없습니다.`,
      };
    }
    if (from === to) {
      return { ok: false, message: "보내는 주소와 받는 주소는 달라야 합니다." };
    }

    const next = cloneState(this.state);
    next.balances.set(from, balance - amount);
    next.balances.set(to, this.balanceOf(to) + amount);
    const allowances = next.allowances.get(from) ?? new Map<Address, bigint>();
    allowances.set(caller, approved - amount);
    next.allowances.set(from, allowances);
    next.events.push({
      name: "Transfer",
      from,
      to,
      value: amount,
      timestamp: Date.now(),
    });
    this.state = next;
    return {
      ok: true,
      value: true,
      message: `${caller === ACCOUNTS.dex ? "DEX가" : "승인받은 주소가"} ${amount} LAB을 대신 전송했습니다.`,
    };
  }

  snapshot(): SimulationSnapshot {
    return cloneState(this.state);
  }

  reset(): void {
    this.state = createInitialState();
  }

  private validateTransfer(
    caller: Address,
    to: Address,
    amount: bigint,
  ): Extract<SimulationResult, { ok: false }> | null {
    if (amount <= 0n) {
      return { ok: false, message: "전송 수량은 0보다 커야 합니다." };
    }
    if (caller === to) {
      return { ok: false, message: "보내는 주소와 받는 주소는 달라야 합니다." };
    }
    const balance = this.balanceOf(caller);
    if (balance < amount) {
      return {
        ok: false,
        message: `현재 잔액은 ${balance} LAB이지만 ${amount} LAB 전송을 시도했습니다.`,
      };
    }
    return null;
  }
}
