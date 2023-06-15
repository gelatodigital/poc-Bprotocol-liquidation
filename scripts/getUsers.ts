import { providers, utils } from "ethers";
import { readFileSync, writeFileSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as hre from "hardhat";
import { unitrollerABI } from "../web3-functions/BLiquidator/abis/abis";
import { join } from "path";
interface IstoredData {
  accounts: string[];
  lastCoveredBlock: number;
}
const getUsers = async () => {
  let storedData: IstoredData = JSON.parse(
    readFileSync(join(process.cwd(), "result.json"), "utf-8")
  );

  const currBlock = (await hre.ethers.provider.getBlock("latest")).number - 10;

  console.log(currBlock);
  storedData = await readAllUsers(
    storedData.lastCoveredBlock,
    currBlock,
    storedData,
    hre.ethers.provider
  );

  // 55387186
  //20683828 + 1

  writeFileSync(join(process.cwd(), "result.json"), JSON.stringify(storedData));
};

getUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

export function getHardhatNetwork(hre: HardhatRuntimeEnvironment) {
  let network = hre.hardhatArguments.network;
  if (network == undefined) {
    network = hre.network.name;
  }
  return network;
}

async function readAllUsers(
  startBlock: number,
  lastBlock: number,
  storedData: IstoredData,
  provider: providers.StaticJsonRpcProvider
): Promise<IstoredData> {
  const step = 1000;
  const unitroller = "0x0F390559F258eB8591C8e31Cf0905E97cf36ACE2";
  const unitrollerIface = new utils.Interface(unitrollerABI);
  const topics = [unitrollerIface.getEventTopic("MarketEntered")];
  console.log({ lastBlock });

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
    console.log(start, end);
    const transferLogs = await provider.getLogs(eventFilter);
    //console.log(transferLogs.length, storedData.accounts.length);
    for (const transferLog of transferLogs) {
      const transferEvent = unitrollerIface.parseLog(transferLog);
      const [, account] = transferEvent.args;

      if (!storedData.accounts.includes(account))
        storedData.accounts.push(account);
    }
    storedData.lastCoveredBlock = end;
  }

  console.log("num users", storedData.accounts.length);

  return storedData;
}
