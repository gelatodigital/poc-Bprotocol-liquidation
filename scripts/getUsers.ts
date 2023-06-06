import { BytesLike, Wallet, providers, utils } from "ethers";
import { readFileSync, writeFileSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import * as hre from "hardhat";
import { unitrollerABI } from "../src/web3-functions/BLiquidator/abis/abis";
import { join } from "path";
interface ISTORED_DATA {
  accounts: string[];
  lastCoveredBlock: number;
}
const getUsers = async () => {
  const [deployer, user1, user2, user3, user4] = await initEnv(hre);

  let storedData: ISTORED_DATA = JSON.parse(
    readFileSync(join(process.cwd(), "result.json"), "utf-8")
  );

  storedData = await readAllUsers(
    storedData.lastCoveredBlock,
    63682401,
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

export async function initEnv(hre: HardhatRuntimeEnvironment): Promise<any[]> {
  let network = getHardhatNetwork(hre);
  if (network == "localhost") {
    const ethers = hre.ethers; // This allows us to access the hre (Hardhat runtime environment)'s injected ethers instance easily
    const accounts = await ethers.getSigners(); // This returns an array of the default signers connected to the hre's ethers instance
    const deployer = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];
    const user4 = accounts[4];

    return [deployer, user1, user2, user3, user4];
  } else {
    const deployer_provider = hre.ethers.provider;
    const privKeyDEPLOYER = process.env["DEPLOYER_KEY"] as BytesLike;
    const deployer_wallet = new Wallet(privKeyDEPLOYER);
    const deployer = await deployer_wallet.connect(deployer_provider);

    // const privKeyUSER = process.env['USER1_KEY'] as BytesLike;
    // const user_wallet = new Wallet(privKeyUSER);
    // const user1 = await user_wallet.connect(deployer_provider);

    // const privKeyUSER2 = process.env['USER2_KEY'] as BytesLike;
    // const user2_wallet = new Wallet(privKeyUSER2);
    // const user2 = await user2_wallet.connect(deployer_provider);

    // const privKeyUSER3 = process.env['USER3_KEY'] as BytesLike;
    // const user3_wallet = new Wallet(privKeyUSER3);
    // const user3 = await user3_wallet.connect(deployer_provider);

    // const privKeyUSER4 = process.env['USER4_KEY'] as BytesLike;
    // const user4_wallet = new Wallet(privKeyUSER4);
    // const user4 = await user4_wallet.connect(deployer_provider);

    return [deployer];
  }
}

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
  storedData: ISTORED_DATA,
  provider: providers.StaticJsonRpcProvider
): Promise<ISTORED_DATA> {
  const step = 1000;
  const unitroller = "0x0F390559F258eB8591C8e31Cf0905E97cf36ACE2";
  const unitrollerIface = new utils.Interface(unitrollerABI);
  const topics = [unitrollerIface.getEventTopic("MarketEntered")];
  console.log({ lastBlock });

  for (let i = startBlock; i < lastBlock; i += step) {
    let start = i;
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
      const [ctoken, account] = transferEvent.args;

      if (!storedData.accounts.includes(account))
        storedData.accounts.push(account);
    }
    storedData.lastCoveredBlock = end;
  }

  console.log("num users", storedData.accounts.length);

  return storedData;
}
