// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const ethers = hre.ethers
const {MaxUint256} = ethers.constants
const stakingABI = require('../artifacts/contracts/Staking.sol/DelfyStakingPool.json').abi
const delfyABI = require('../artifacts/contracts/DelfyToken.sol/DelfyERC20.json').abi
const basicABI = require('../artifacts/contracts/Basic.sol/ERC20Token.json').abi
const routerABI = require('../artifacts/contracts/Router.sol/DelfyRouter.json').abi
const factoryABI = require('../artifacts/contracts/Factory.sol/DelfyFactory.json').abi
async function main() {
  let accounts = await ethers.getSigners();
  let [deployer, other0, other1, other3, other4, other5, other6, other7, other8] = accounts
    console.log(
    "Deploying contracts with the account:",
    deployer.address
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  // const stakeContract = await ethers.getContractFactory("DelfyStakingPool")
  // const stake = await stakeContract.deploy()
  // stake.deployed()
  // const delfyContract = await ethers.getContractFactory("DelfyERC20")
  // const delfy = await delfyContract.deploy(stake.address)
  // await delfy.deployed()
  // console.log("Stake Address: ",stake.address)
  // console.log("Stake Address LC: ",stake.address.toLowerCase())
  // console.log("Delfy Address: ",delfy.address)

  const stakingAddr = "0x5f72674ed9Eff7C2E9D82ce5d8258abe36dEfE6f"
  const delfyAddr = "0x3C52852020e96d290EdA98659606107Af0baF8E9"
  const basicAddr = "0xB306918F045CE686690911497766F9980B5Ca466"
  const wethAddr ="0xc778417E063141139Fce010982780140Aa0cD5Ab"
  const factoryAddr = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f"
  const routerAddr = "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a"
  const delfyPairAddr=  "0x8ae8c475E7B62E2c119E61a0A1812b082EA7A0F8"
  const basicPairAddr=  "0x3a1b03d92c35134B441a54b3f3aE1F9EAeFe43a3"
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Staking = new ethers.Contract(stakingAddr, stakingABI, deployer)
  const Delfy = new ethers.Contract(delfyAddr, delfyABI, deployer)
  const Basic = new ethers.Contract(basicAddr, basicABI, deployer)
  const Router = new ethers.Contract(routerAddr, routerABI, deployer)
  const Factory = new ethers.Contract(factoryAddr, factoryABI, deployer)
  const DelfyPair = new ethers.Contract(delfyPairAddr, basicABI, deployer)
  const BasicPair = new ethers.Contract(basicPairAddr, basicABI, deployer)
  
  const BN = ethers.BigNumber
  const toWei = (value) => BN.from(value).mul(BN.from(10).pow(18))

  await Staking.connect(deployer).addPool(delfyPairAddr, BN.from(5), false)
  await Staking.connect(deployer).addPool(basicPairAddr, BN.from(5), false)

  // console.log("Bal of First wallet: ", (await Delfy.balanceOf(accounts[1].address)).toString())
  // await Delfy.connect(deployer).mint(deployer.address, toWei("500000"),{gasLimit: 250000})
        //   address token,
        // uint256 amountTokenDesired,
        // uint256 amountTokenMin,
        // uint256 amountETHMin,
        // address to,
        // uint256 deadline
  for(let i = 1; i < 3; i++){
    let delfyBalance  = await DelfyPair.balanceOf(accounts[i].address)
    let basicBalance  = await BasicPair.balanceOf(accounts[i].address)
    await BasicPair.connect(accounts[i]).approve(stakingAddr, MaxUint256, {gasLimit: 250000})
    await DelfyPair.connect(accounts[i]).approve(stakingAddr, MaxUint256, {gasLimit: 250000})
    // await Router.connect(accounts[i]).addLiquidityETH(basicAddr, toWei("50"), 0, 0, accounts[i].address, MaxUint256,{
    //   gasLimit: 550000, value: toWei("1")
    // })  
    // await Router.connect(accounts[i]).addLiquidityETH(delfyAddr, toWei("50"), 0, 0, accounts[i].address, MaxUint256,{
    //   gasLimit: 550000,value: toWei("1")
    // })  
    console.log("Basic Balance: ",basicBalance.toString());
    console.log("Delfy Balance: ",delfyBalance.toString());
    await Staking.connect(accounts[i]).deposit(delfyPairAddr, delfyBalance, false,{
    gasLimit: 250000
    })  
    await Staking.connect(accounts[i]).deposit(basicPairAddr, basicBalance, false,{
    gasLimit: 250000
    })   
    console.log("Completed: ", i)
  }
  const delfyPair = await Factory.getPair(delfyAddr, wethAddr)
  const basicPair = await Factory.getPair(basicAddr, wethAddr)
  console.log("Delfy Pair: ",delfyPair)
  console.log("Basic Pair: ",basicPair)
  console.log("Bal of staking Contract: ", (await Delfy.balanceOf(stakingAddr)).toString())
  console.log("Owner: ",await Staking.owner())
}
// npx hardhat run scripts/deploy.js --network <network-name>
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
