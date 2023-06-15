/* eslint-disable @typescript-eslint/naming-convention */
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

import { Contract, providers, utils } from "ethers";

// import { uploadJsonFile } from "./s3-cient";
import { bammsAbi, helperAbi, unitrollerABI } from "./abis/abis";
import { storedS3 } from "./accounts";

interface ISTORED_DATA {
  accounts: string[];
  lastCoveredBlock: number;
}

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider, storage } = context;
  const provider = multiChainProvider.default();

  let storedData: ISTORED_DATA = {
    accounts: [],
    lastCoveredBlock: 20683828 + 1, //20683828 contract creation on Fantom
  };

  const storageStoredData = await storage.get("storedData");

  if (storageStoredData == undefined) {
    storedData = storedS3;
  } else {
    storedData = JSON.parse(storageStoredData) as ISTORED_DATA;
  }

  storedData = await updateUsers(provider, storedData);

  await storage.set("storedData", JSON.stringify(storedData));

  console.log("stored new accounts");

  const lastPostTime = parseInt((await storage.get("lastPostTime")) ?? "0");

  const blockTime = (await provider.getBlock("latest")).timestamp;

  if (blockTime - lastPostTime < 10 * 60) {
    return {
      canExec: false,
      message: "Not time elapsed since last run (10 min)",
    };
  }
  await storage.set("lastPostTime", blockTime.toString());

  const callDatas: Array<{ to: string; data: string }> = [];

  const helperContract = new Contract(
    "0xd134A5cE381d7db33596D83de74CBBfC34fbc7dC",
    helperAbi,
    provider
  ) as Contract;

  for (let i = 0; i < storedData.accounts.length; i += 200) {
    const slice = storedData.accounts.slice(i, i + 200);

    const comptroller = "0x0F390559F258eB8591C8e31Cf0905E97cf36ACE2";
    const bamms1 = ["0x1346e106b4E2558DAACd2E8207505ce7E31e05CA"];
    //   "0xEDC7905a491fF335685e2F2F1552541705138A3D",
    //   "0x6d62d6Af9b82CDfA3A7d16601DDbCF8970634d22",
    // ];
    // /const bamms2 = bamms1.reverse();
    // const rand = Math.floor(+new Date() / 1000) % 2;
    // console.log({ rand });
    // const bamms = rand == 0 ? bamms1 : bamms2;

    const result = await helperContract.getInfo(slice, comptroller, bamms1);

    if (result.length > 0) {
      console.log("found liquidation candidate", result[0]);
      const iface = new utils.Interface(bammsAbi);

      callDatas.push({
        to: result[0].bamm,
        data: iface.encodeFunctionData("liquidateBorrow", [
          result[0].account,
          result[0].repayAmount,
          result[0].ctoken,
        ]),
      });
    }
  }

  if (callDatas.length > 0) {
    return {
      canExec: false,
      message: `Found ${callDatas.length} users to liquidate`,
    };
  }

  return { canExec: false, message: "No Users to liquidate" };
});

export async function updateUsers(
  provider: providers.StaticJsonRpcProvider,
  storedData: ISTORED_DATA
): Promise<ISTORED_DATA> {
  console.log("updating users");
  const currBlock = (await provider.getBlock("latest")).number - 10;
  if (currBlock > storedData.lastCoveredBlock) {
    storedData = await readAllUsers(
      storedData.lastCoveredBlock,
      currBlock,
      storedData,
      provider
    );
  }

  storedData.lastCoveredBlock = currBlock;

  console.log("updateUsers end");

  return storedData;
  //setTimeout(updateUsers, 1000 * 60);
}

async function readAllUsers(
  startBlock: number,
  lastBlock: number,
  storedData: ISTORED_DATA,
  provider: providers.StaticJsonRpcProvider
): Promise<ISTORED_DATA> {
  const step = 1000;
  const unitroller = "0x0F390559F258eB8591C8e31Cf0905E97cf36ACE2";
  const unitrollerIface = new utils.Interface(unitrollerABI);
  const topics = [unitrollerIface.getEventTopic("MarketEntered")];

  for (let i = startBlock; i < lastBlock; i += step) {
    const start = i;
    let end = i + step - 1;
    if (end > lastBlock) end = lastBlock;
    const eventFilter = {
      address: unitroller,
      topics,
      fromBlock: start,
      toBlock: end,
    };
    console.log("blocks: " + eventFilter.fromBlock, eventFilter.toBlock);
    const transferLogs = await provider.getLogs(eventFilter);

    for (const transferLog of transferLogs) {
      const transferEvent = unitrollerIface.parseLog(transferLog);
      const [, account] = transferEvent.args;
      if (!storedData.accounts.includes(account))
        storedData.accounts.push(account);
    }
  }

  console.log("num users", storedData.accounts.length);

  return storedData;
}
