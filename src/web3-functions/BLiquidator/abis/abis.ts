export const helperAbi = [
  {
    inputs: [
      {
        internalType: "address[]",
        name: "accounts",
        type: "address[]",
      },
      {
        internalType: "address",
        name: "comptroller",
        type: "address",
      },
      {
        internalType: "address[]",
        name: "bamms",
        type: "address[]",
      },
    ],
    name: "getInfo",
    outputs: [
      {
        components: [
          {
            internalType: "address",
            name: "account",
            type: "address",
          },
          {
            internalType: "address",
            name: "bamm",
            type: "address",
          },
          {
            internalType: "address",
            name: "ctoken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "repayAmount",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "underwater",
            type: "bool",
          },
        ],
        internalType: "struct LiquidationBotHelper.Account[]",
        name: "unsafeAccounts",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export const bammsAbi = [
  {
    inputs: [
      { internalType: "address", name: "borrower", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "contract ICToken", name: "collateral", type: "address" },
    ],
    name: "liquidateBorrow",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export const unitrollerABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract CToken",
        name: "cToken",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "MarketEntered",
    type: "event",
  },
];
