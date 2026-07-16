# ERC-20 Lab

Web3 초보자가 ERC-20을 읽는 데서 멈추지 않고 직접 실행하고, 코드를 수정하고, Ethereum Sepolia 테스트넷에 토큰을 배포하도록 돕는 한국어 인터랙티브 학습 서비스입니다.

## 구현 기능

- ERC-20 표준, 대체 가능성, decimals, allowance, event, read/write 함수 개념 학습
- Alice, Bob, DEX 계정을 이용한 `totalSupply`, `balanceOf`, `transfer`, `approve`, `allowance`, `transferFrom` 로컬 시뮬레이션
- 실행 전후 잔액·allowance, 반환값, `msg.sender`, `Transfer`/`Approval` 이벤트 표시
- 실행 함수에 대응하는 Solidity와 viem TypeScript 코드 보기
- CodeMirror 6 코드 편집기와 solc-js Web Worker 브라우저 컴파일
- OpenZeppelin 기반 고정 발행량, Burnable, Owner Mintable, Capped 토큰 생성
- EIP-1193 확장 지갑 연결, Sepolia 확인, 컨트랙트 배포와 receipt 대기
- 배포한 토큰의 `totalSupply`, `balanceOf`, `transfer` 실습과 Sepolia Explorer 링크
- 학습 진행도, 수정 코드, 토큰 초안, 배포 기록의 검증된 `localStorage` 저장

## 기술 구성

Vite, TypeScript, Vanilla DOM API, Vanilla CSS, Solidity, viem, solc-js, CodeMirror 6, OpenZeppelin Contracts, Vitest를 사용합니다. React, Vue, Svelte, Tailwind, UI 컴포넌트 라이브러리와 백엔드는 사용하지 않습니다.

주요 폴더는 다음과 같습니다.

```text
src/
├─ components/       공통 헤더, 진행 단계, 코드·이벤트 패널
├─ erc20/            시뮬레이터, 수업 데이터, 코드 생성, 컴파일·배포
├─ pages/            홈, 개념, 함수 랩, 코드 랩, 토큰 생성기, 내 토큰
├─ state/            작은 구독형 앱 스토어
├─ storage/          localStorage 런타임 검증
├─ wallet/           EIP-1193·viem 지갑 연결
├─ workers/          solc-js Web Worker
└─ styles/           Coinbase 기반 디자인 토큰과 반응형 스타일
contracts/           Sepolia 전용 AllowancePlayground
scripts/             OpenZeppelin 소스 맵과 Sites Worker 생성
tests/               도메인·스토리지·UI·Solidity 컴파일 테스트
```

## 설치와 실행

Node.js 22.13 이상이 필요합니다.

```bash
npm install
npm run dev
```

브라우저에서 표시되는 로컬 주소를 엽니다. 로컬 함수 실습은 지갑 없이 모두 사용할 수 있습니다.

검증 명령은 다음과 같습니다.

```bash
npm run typecheck
npm run test
npm run build
```

`predev`와 `prebuild`가 `node_modules/@openzeppelin/contracts`에서 허용된 import의 의존 파일만 읽어 `src/generated/openzeppelinSources.ts`를 생성합니다. 컴파일러는 외부 URL import를 허용하지 않습니다.

## Sepolia 지갑과 배포

1. 브라우저 확장 지갑을 설치합니다.
2. 지갑 네트워크를 Ethereum Sepolia로 변경합니다.
3. Faucet에서 가치 없는 Sepolia ETH를 준비합니다.
4. 사이트 상단의 `지갑 연결`을 누릅니다.
5. 토큰 생성기에서 코드를 컴파일한 뒤 배포합니다.
6. 지갑에서 네트워크, 배포 정보, 예상 가스를 확인하고 승인합니다.

서비스는 개인키나 복구 문구를 입력받거나 저장하지 않습니다. 모든 서명은 확장 지갑에서 진행되며 Sepolia가 아니면 배포와 write 기능을 막습니다.

## AllowancePlayground 설정

`contracts/AllowancePlayground.sol`은 한 지갑으로 `approve`와 `transferFrom`을 연습하기 위한 Sepolia 전용 보조 컨트랙트입니다. 사용자가 직접 호출한 `pullToken`만 `msg.sender`의 토큰을 가져오며, 기록된 본인 예치량만 `returnToken`으로 돌려받을 수 있습니다.

Remix 또는 사용하는 Solidity 배포 도구에서 Solidity 0.8.20 이상으로 이 파일을 컴파일하고 Sepolia에 배포합니다. 주소를 `.env.local`에 넣고 개발 서버를 다시 시작합니다.

```bash
cp .env.example .env.local
```

```dotenv
VITE_ALLOWANCE_PLAYGROUND_ADDRESS=0x배포한_컨트랙트_주소
```

주소가 비어 있으면 보조 `transferFrom` 실습만 비활성화되며 로컬 실습, 토큰 생성과 일반 배포는 정상 작동합니다.

## 제한사항

- 메인넷과 다중 체인은 지원하지 않습니다.
- Sepolia RPC와 Faucet, 확장 지갑의 가용성은 외부 서비스 상태에 영향을 받습니다.
- 백엔드와 로그인, 기기 간 동기화, 공개 코드 공유 기능은 없습니다.
- 교육용 자체 ERC-20 코드는 학습 목적으로만 사용해야 합니다. 실제 토큰은 생성기가 사용하는 검증된 OpenZeppelin 구현을 기반으로 작성하세요.
- 배포 비용은 네트워크 상태에 따라 달라지므로 실제 예상 가스는 지갑 확인 화면을 기준으로 합니다.
