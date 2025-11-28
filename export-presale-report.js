// export-presale-report.js
// SnakePresale rapor scripti: cüzdan bazlı CSV üretir.
//
// Kolonlar:
// wallet,normal_tokens,vesting_tokens,total_tokens,bnb_spent,usdt_spent,normal_claimed,vesting_claimed
//
// Kullanım:
// 1) .env içine BSC_RPC_URL yaz
// 2) npm install ethers dotenv
// 3) node export-presale-report.js

require("dotenv").config();
const fs = require("fs");
const { ethers } = require("ethers");

// --- CONFIG ---

const RPC_URL = process.env.BSC_RPC_URL;
if (!RPC_URL) {
  console.error("HATA: .env içinde BSC_RPC_URL tanımlı olmalı");
  process.exit(1);
}

// SnakePresale adresi
const PRESALE_ADDRESS = "0xbA073B1ec8fa5d7521E1592E03F08f1F272A7f5A";

// Kontrat yeni deploy olduğu için 69M civarından başlatıyoruz.
// İleride BscScan'den gerçek deploy bloğunu bulup burayı o sayıyla güncelleyebilirsin.
const FROM_BLOCK = 69_600_000;

// BlastAPI "max 2000 blok" dediği için 1500 yapalım.
const BATCH_SIZE = 1_500;

const POOL_NORMAL = 0;
const POOL_VESTING = 1;
const DECIMALS = 18;

// Remix’ten aldığın SnakePresale ABI’si:
const PRESALE_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "_snakeToken", "type": "address" },
      { "internalType": "address", "name": "_usdtToken", "type": "address" },
      { "internalType": "address", "name": "_priceFeed", "type": "address" },
      { "internalType": "address", "name": "_treasury", "type": "address" }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" },
      { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint8", "name": "poolId", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "newPriceUsd", "type": "uint256" }
    ],
    "name": "PoolPriceUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "newFeed", "type": "address" }
    ],
    "name": "PriceFeedUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "newTimestamp", "type": "uint256" }
    ],
    "name": "TgeTimestampUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
      { "indexed": true, "internalType": "uint8", "name": "poolId", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "TokensClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "buyer", "type": "address" },
      { "indexed": true, "internalType": "uint8", "name": "poolId", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "tokenAmount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "paidBNB", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "paidUSDT", "type": "uint256" }
    ],
    "name": "TokensPurchased",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "newTreasury", "type": "address" }
    ],
    "name": "TreasuryUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "UnsoldTokensWithdrawn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "POOL_NORMAL",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "POOL_VESTING",
    "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "poolId", "type": "uint8" },
      { "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }
    ],
    "name": "buyWithBNB",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "poolId", "type": "uint8" },
      { "internalType": "uint256", "name": "tokenAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "maxUSDT", "type": "uint256" }
    ],
    "name": "buyWithUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "poolId", "type": "uint8" }
    ],
    "name": "claim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "poolId", "type": "uint8" },
      { "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }
    ],
    "name": "getBNBAmountForTokens",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint8", "name": "poolId", "type": "uint8" }
    ],
    "name": "getClaimableAmount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLatestBNBPrice",
    "outputs": [
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "uint8", "name": "decimals", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "poolId", "type": "uint8" },
      { "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }
    ],
    "name": "getUSDTAmountForTokens",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "pools",
    "outputs": [
      { "internalType": "uint256", "name": "priceUsd", "type": "uint256" },
      { "internalType": "bool", "name": "isVesting", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "priceFeed",
    "outputs": [
      { "internalType": "contract AggregatorV3Interface", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint8", "name": "poolId", "type": "uint8" },
      { "internalType": "uint256", "name": "newPriceUsd", "type": "uint256" }
    ],
    "name": "setPoolPriceUsd",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_priceFeed", "type": "address" }
    ],
    "name": "setPriceFeed",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_tgeTimestamp", "type": "uint256" }
    ],
    "name": "setTgeTimestamp",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_treasury", "type": "address" }
    ],
    "name": "setTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "tgePercentBP", "type": "uint256" },
      { "internalType": "uint256", "name": "monthlyPercentBP", "type": "uint256" },
      { "internalType": "uint8", "name": "months", "type": "uint8" }
    ],
    "name": "setVestingConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "snakeToken",
    "outputs": [
      { "internalType": "contract IERC20", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tgeTimestamp",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalClaimedTokens",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSoldTokens",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "newOwner", "type": "address" }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdtToken",
    "outputs": [
      { "internalType": "contract IERC20", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "uint8", "name": "", "type": "uint8" }
    ],
    "name": "userClaimed",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" },
      { "internalType": "uint8", "name": "", "type": "uint8" }
    ],
    "name": "userPurchased",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "vesting",
    "outputs": [
      { "internalType": "uint256", "name": "tgePercentBP", "type": "uint256" },
      { "internalType": "uint256", "name": "monthlyPercentBP", "type": "uint256" },
      { "internalType": "uint8", "name": "months", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "withdrawBNB",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "withdrawUSDT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "withdrawUnsoldTokens",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

// --- HELPERS ---

function formatUnitsSafe(bn) {
  try {
    return ethers.utils.formatUnits(bn, DECIMALS);
  } catch {
    return "0";
  }
}

// BSC'nin log limitine takılmamak için blokları parça parça tarıyoruz
async function fetchLogsInBatches(provider, baseFilter, fromBlock, toBlock, step) {
  const allLogs = [];
  let start = fromBlock;
  while (start <= toBlock) {
    const end = Math.min(start + step, toBlock);
    console.log(`  - fetching logs from ${start} to ${end}`);
    const filter = {
      ...baseFilter,
      fromBlock: start,
      toBlock: end
    };
    const logs = await provider.getLogs(filter);
    allLogs.push(...logs);
    start = end + 1;
  }
  return allLogs;
}

async function main() {
  console.log("Connecting to BSC RPC:", RPC_URL);
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

  const latestBlock = await provider.getBlockNumber();
  console.log("Latest block:", latestBlock);

  const iface = new ethers.utils.Interface(PRESALE_ABI);

  const topicPurchased = iface.getEventTopic("TokensPurchased");
  const topicClaimed = iface.getEventTopic("TokensClaimed");

  console.log("Fetching TokensPurchased logs in batches...");
  const purchaseLogs = await fetchLogsInBatches(
    provider,
    {
      address: PRESALE_ADDRESS,
      topics: [topicPurchased]
    },
    FROM_BLOCK,
    latestBlock,
    BATCH_SIZE
  );
  console.log(`Total TokensPurchased logs: ${purchaseLogs.length}`);

  console.log("Fetching TokensClaimed logs in batches...");
  const claimedLogs = await fetchLogsInBatches(
    provider,
    {
      address: PRESALE_ADDRESS,
      topics: [topicClaimed]
    },
    FROM_BLOCK,
    latestBlock,
    BATCH_SIZE
  );
  console.log(`Total TokensClaimed logs: ${claimedLogs.length}`);

  // walletAddress -> aggregated info
  const walletMap = new Map();

  function ensureWallet(addr) {
    const key = ethers.utils.getAddress(addr);
    if (!walletMap.has(key)) {
      walletMap.set(key, {
        bnbSpent: ethers.BigNumber.from(0),
        usdtSpent: ethers.BigNumber.from(0)
      });
    }
    return walletMap.get(key);
  }

  // 1) Purchase event'lerinden BNB / USDT harcamasını topla + cüzdanları listele
  for (const log of purchaseLogs) {
    const parsed = iface.parseLog(log);
    const buyer = parsed.args.buyer;
    const poolId = parsed.args.poolId;
    const tokenAmount = parsed.args.tokenAmount;
    const paidBNB = parsed.args.paidBNB;
    const paidUSDT = parsed.args.paidUSDT;

    const w = ensureWallet(buyer);

    if (paidBNB && !paidBNB.isZero()) {
      w.bnbSpent = w.bnbSpent.add(paidBNB);
    }
    if (paidUSDT && !paidUSDT.isZero()) {
      w.usdtSpent = w.usdtSpent.add(paidUSDT);
    }
  }

  // 2) Claim event'lerinden sadece cüzdan setine ekle (rakamları mapping'den çekeceğiz)
  for (const log of claimedLogs) {
    const parsed = iface.parseLog(log);
    const user = parsed.args.user;
    ensureWallet(user);
  }

  const uniqueWallets = Array.from(walletMap.keys());
  console.log(`Unique wallets found (purchased/claimed): ${uniqueWallets.length}`);

  const contract = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, provider);

  const rows = [];
  rows.push("Wallet;Normal Tokens;Vesting Tokens;Total Tokens;BNB Spent;USDT Spent;Normal Claimed;Vesting Claimed");

  for (let i = 0; i < uniqueWallets.length; i++) {
    const addr = uniqueWallets[i];
    const info = walletMap.get(addr) || {
      bnbSpent: ethers.BigNumber.from(0),
      usdtSpent: ethers.BigNumber.from(0)
    };

    // Mapping'lerden kesin rakamları oku
    const [p0, p1, c0, c1] = await Promise.all([
      contract.userPurchased(addr, POOL_NORMAL),
      contract.userPurchased(addr, POOL_VESTING),
      contract.userClaimed(addr, POOL_NORMAL),
      contract.userClaimed(addr, POOL_VESTING)
    ]);

    const totalTokens = p0.add(p1);

    const normalTokensStr = formatUnitsSafe(p0);
    const vestingTokensStr = formatUnitsSafe(p1);
    const totalTokensStr = formatUnitsSafe(totalTokens);

    const normalClaimedStr = formatUnitsSafe(c0);
    const vestingClaimedStr = formatUnitsSafe(c1);

    const bnbSpentStr = formatUnitsSafe(info.bnbSpent);
    const usdtSpentStr = formatUnitsSafe(info.usdtSpent);

    rows.push([
      addr,
      normalTokensStr,
      vestingTokensStr,
      totalTokensStr,
      bnbSpentStr,
      usdtSpentStr,
      normalClaimedStr,
      vestingClaimedStr
    ].join(";"));

    if ((i + 1) % 20 === 0) {
      console.log(`Processed ${i + 1}/${uniqueWallets.length} wallets...`);
    }
  }

  fs.writeFileSync("presale_report.csv", rows.join("\n"), "utf8");
  console.log("Done. Wrote presale_report.csv");
}

main().catch((err) => {
  console.error("Script error:", err);
  process.exit(1);
});
