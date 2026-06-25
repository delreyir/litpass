import deployment from "./deployment.json";

export const ADDR = deployment.contracts as {
  LitPass: `0x${string}`;
  AchievementBadges: `0x${string}`;
  StampRegistry: `0x${string}`;
  ReferralTracker: `0x${string}`;
};

export const DAY_LENGTH = deployment.dayLength as number;

// ---------------- ABIs (only the symbols we read/write from the UI) ----------------

export const litPassAbi = [
  { type: "function", name: "mint", stateMutability: "nonpayable", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "checkIn", stateMutability: "nonpayable", inputs: [], outputs: [{ type: "uint32" }] },
  { type: "function", name: "hasPass", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "canCheckIn", stateMutability: "view", inputs: [{ name: "user", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "totalSupply", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "passOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "dayLength", stateMutability: "view", inputs: [], outputs: [{ type: "uint32" }] },
  {
    type: "function",
    name: "getPass",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "tokenId", type: "uint256" },
          { name: "mintedAt", type: "uint64" },
          { name: "lastCheckIn", type: "uint64" },
          { name: "currentStreak", type: "uint32" },
          { name: "longestStreak", type: "uint32" },
          { name: "totalCheckIns", type: "uint32" },
        ],
      },
    ],
  },
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ type: "uint256" }], outputs: [{ type: "string" }] },
  {
    type: "event",
    name: "PassportMinted",
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint64" },
    ],
  },
  {
    type: "event",
    name: "CheckedIn",
    inputs: [
      { indexed: true, name: "owner", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: false, name: "newStreak", type: "uint32" },
      { indexed: false, name: "totalCheckIns", type: "uint32" },
      { indexed: false, name: "timestamp", type: "uint64" },
    ],
  },
] as const;

export const badgesAbi = [
  { type: "function", name: "claim", stateMutability: "nonpayable", inputs: [{ type: "uint256" }], outputs: [] },
  { type: "function", name: "badgeCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "balanceOf", stateMutability: "view", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "uint256" }] },
  { type: "function", name: "isEligible", stateMutability: "view", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }] },
  {
    type: "function",
    name: "badges",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "color", type: "string" },
      { name: "metric", type: "uint8" },
      { name: "threshold", type: "uint32" },
      { name: "exists", type: "bool" },
    ],
  },
] as const;

export const stampsAbi = [
  { type: "function", name: "userStamps", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "bytes32[]" }] },
  { type: "function", name: "holds", stateMutability: "view", inputs: [{ type: "bytes32" }, { type: "address" }], outputs: [{ type: "bool" }] },
  {
    type: "function",
    name: "stamps",
    stateMutability: "view",
    inputs: [{ type: "bytes32" }],
    outputs: [
      { name: "issuer", type: "address" },
      { name: "name", type: "string" },
      { name: "description", type: "string" },
      { name: "imageURI", type: "string" },
      { name: "exists", type: "bool" },
    ],
  },
] as const;

export const referralAbi = [
  { type: "function", name: "bindReferrer", stateMutability: "nonpayable", inputs: [{ type: "address" }], outputs: [] },
  { type: "function", name: "referrerOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "address" }] },
  { type: "function", name: "referralsOf", stateMutability: "view", inputs: [{ type: "address" }], outputs: [{ type: "uint32" }] },
] as const;
