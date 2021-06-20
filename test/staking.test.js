const chai = require("chai");
const { BigNumber, Contract, constants, utils } = require("ethers")
const { solidity, MockProvider, createFixtureLoader, deployContract } = require('ethereum-waffle')
const { ecsign } = require("ethereumjs-util")
const { mineBlock, expandTo18Decimals, toHumanVal, toBigNumber, DELAY, ADDRESS_ZERO} = require("./utils/utils")
const  {takeSnapshot, advanceTime, revertTime,} = require("./utils/time-travel")
const {expandToEthers,  addNumbers, subNumbers, toBNumber } = require('./utils/mathHelp');
const expect = chai.expect
chai.use(solidity)
const provider = new MockProvider({
    ganacheOptions: {
      hardfork: 'istanbul',
      mnemonic: 'horn horn horn horn horn horn horn horn horn horn horn horn',
      gasLimit: 9999999,
    },
  })

  const overrides = {
  gasLimit: 9999999,
  };
  const accounts = provider.getWallets()
const [wallet, other0, other1, other2, other3, other4, other5, other6] =accounts
let delfyToken, basicToken, stakingPool, basicToken2;
beforeEach(async()=>{
  const DelfyStakingPool = await ethers.getContractFactory("DelfyStakingPool", wallet)
  
  stakingPool = await DelfyStakingPool.deploy()
  const Delfy = await ethers.getContractFactory("DelfyERC", wallet)
  delfyToken = await Delfy.deploy(stakingPool.address)
  const BasicERC20 = await ethers.getContractFactory("BasicERC20", wallet)
  const BasicERC2 = await ethers.getContractFactory("BasicERC20", wallet)

  basicToken = await BasicERC20.deploy()
  basicToken2 = await BasicERC20.deploy()

  expect(await delfyToken.owner()).to.equal(wallet.address)
  await delfyToken.connect(wallet).mint(wallet.address, expandTo18Decimals("1000000"), overrides)
  for(let i=1; i<8; i++ ){
    await delfyToken.connect(wallet).transfer(accounts[i].address, expandTo18Decimals("100000"), overrides)
    await basicToken.connect(wallet).transfer(accounts[i].address, expandTo18Decimals("100000"), overrides)
  }
  let blkNumber = await provider.getBlockNumber()
  console.log("BlkNumber: ",blkNumber.toString())
  await stakingPool.initialize(delfyToken.address, expandTo18Decimals("40"), blkNumber, overrides)
  expect(await stakingPool.delfyPerBlock()).to.equal(expandTo18Decimals("40"))
  await stakingPool.addPool(delfyToken.address, toBigNumber("40"), false, overrides)
  await stakingPool.addPool(basicToken.address, toBigNumber("15"), false, overrides)
  expect(await stakingPool.poolLength()).to.equal(toBigNumber("2"))
  expect((await stakingPool.getPool(delfyToken.address)).lpToken).to.equal(delfyToken.address)
  expect((await stakingPool.getPool(basicToken.address)).lpToken).to.equal(basicToken.address)

})


const advanceBlock = async(times)=> {
  for(let i=0; i<times; i++){
    await provider.send("evm_mine")
  }
}


describe("Staking ", ()=>{
  // it ("add Pool", async()=>{
//     await stakingPool.addPool(basicToken2.address, toBigNumber("40"), false, overrides)
//      expect(await stakingPool.poolLength()).to.equal(toBigNumber("3"))
//      expect((await stakingPool.getPool(basicToken2.address)).lpToken).to.equal(delfyToken.address)
//   })

//   it ("set Pool", async()=>{
//      expect((await stakingPool.getPool(delfyToken.address)).allocPoint).to.equal(toBigNumber("40"))
//      await stakingPool.set(delfyToken.address, toBigNumber("15"), false, overrides)
//      expect((await stakingPool.getPool(delfyToken.address)).allocPoint).to.equal(toBigNumber("15"))

//   })

//   it ("update Pools", async()=>{
//     await stakingPool.massUpdatePools( overrides)
//     let blkNumber = await provider.getBlockNumber()
//     expect((await stakingPool.getPool(delfyToken.address)).lastRewardBlock).to.equal(blkNumber)
//     expect((await stakingPool.getPool(basicToken.address)).lastRewardBlock).to.equal(blkNumber)
//   })
  
//   it("deposit", async()=>{
   
//     await delfyToken.connect(other0).approve(stakingPool.address, expandTo18Decimals("1000000"), overrides)
//     await expect( stakingPool.connect(other0).deposit(delfyToken.address, expandTo18Decimals("50000"), false, overrides)).to.emit(stakingPool, "Deposit").withArgs(other0.address, delfyToken.address, expandTo18Decimals("50000"))
//     expect(await delfyToken.balanceOf(stakingPool.address)).to.equal(expandTo18Decimals("50000"))
//   })

//   function getPending(multiplier, poolSupply, accrPerShr, userRwdDebt, userAmt, pendingRwd)
//  {
//      multiplier = toBNumber(multiplier)
//      poolSupply = toBNumber(poolSupply.toString())
//     let allocPoint = toBNumber("40")
//     let delfyPerBlock = expandToEthers("40")
//     let totalAllocPoint = toBNumber("55")
//     let accruedShare = toBNumber(accrPerShr)
//     let rwdDebt = toBNumber(userRwdDebt)
//     pendingRwd = toBNumber(pendingRwd)
//     userAmt = toBNumber(userAmt)
//     let tokenRwd = multiplier.times(delfyPerBlock).times(allocPoint.dividedBy(totalAllocPoint))
//     let accrdShr = accruedShare.plus((tokenRwd.times(toBNumber(10).pow(12))).dividedBy(poolSupply))
//     let diff = subNumbers(userAmt.times(accrdShr).dividedBy(toBNumber(10).pow(12)), rwdDebt)
//     let earned = toHumanVal(Math.floor(addNumbers(diff, pendingRwd)).toString())
//     return earned
//   }

//   it("calculates pendingDelfy accordingly", async()=>{
    
//    for(let i =2; i<8; i++){
//     await delfyToken.connect(accounts[i]).approve(stakingPool.address, expandTo18Decimals("1000000"), overrides)
//     await stakingPool.connect(accounts[i]).deposit(delfyToken.address, expandTo18Decimals("50000"), false, overrides)
//     await basicToken.connect(accounts[i]).approve(stakingPool.address, expandTo18Decimals("1000000"), overrides)
//     await stakingPool.connect(accounts[i]).deposit(basicToken.address, expandTo18Decimals("50000"), false, overrides)
//    }
//     await delfyToken.connect(other0).approve(stakingPool.address, expandTo18Decimals("1000000"), overrides)
//     await stakingPool.connect(other0).deposit(delfyToken.address, expandTo18Decimals("50000"), false, overrides)
//     let blkNumber = await provider.getBlockNumber()
//     // fast forward block 
//     await advanceBlock(10)
//     console.log( ( await provider.getBlockNumber()).toString());
//     let poolInfo = await stakingPool.getPool(delfyToken.address)
//     let user = await stakingPool.getUserPoolInfo(delfyToken.address, other0.address)
    
//     let earned = getPending(10, poolInfo.poolSupply.toString(), poolInfo.accDelfyPerShare.toString(), user.rewardDebt.toString(), user.amount.toString(), user.pendingReward.toString())
   
//     let cEarned = toHumanVal((await stakingPool.pendingDelfy(delfyToken.address, other0.address)).toString())
//     console.log(+earned, +cEarned);
//     expect (+earned).to.equal(+cEarned)
//   })

//   it("allow withdraw", async()=>{
//        await delfyToken.connect(other0).approve(stakingPool.address, expandTo18Decimals("1000000"), overrides)
//     await expect( stakingPool.connect(other0).deposit(delfyToken.address, expandTo18Decimals("50000"), false, overrides)).to.emit(stakingPool, "Deposit").withArgs(other0.address, delfyToken.address, expandTo18Decimals("50000"))
//     expect(await delfyToken.balanceOf(stakingPool.address)).to.equal(expandTo18Decimals("50000"))
//      await advanceBlock(10)
//      await expect ( stakingPool.connect(other0).withdraw(delfyToken.address,expandTo18Decimals("5000"), true ,overrides)).to.emit(stakingPool, "Claimed")

//      expect((await stakingPool.getUserPoolInfo(delfyToken.address, other0.address)).amount).to.equal(expandTo18Decimals("45000"))
//   })

//   it("allow claim", async()=>{
//      await delfyToken.connect(other0).approve(stakingPool.address, expandTo18Decimals("1000000"), overrides)
//     await expect( stakingPool.connect(other0).deposit(delfyToken.address, expandTo18Decimals("50000"), false, overrides)).to.emit(stakingPool, "Deposit").withArgs(other0.address, delfyToken.address, expandTo18Decimals("50000"))
//     expect(await delfyToken.balanceOf(stakingPool.address)).to.equal(expandTo18Decimals("50000"))
//      await advanceBlock(10)
//     let poolInfo = await stakingPool.getPool(delfyToken.address)
//     let user = await stakingPool.getUserPoolInfo(delfyToken.address, other0.address)
//     // the multiplier is 11 because it updates pool within the claim function (i.e blocknumber + 1)
//     let earned = getPending(11, poolInfo.poolSupply.toString(), poolInfo.accDelfyPerShare.toString(), user.rewardDebt.toString(), user.amount.toString(), user.pendingReward.toString())
//     console.log(earned.toString());
//     await expect ( stakingPool.connect(other0).claim(delfyToken.address,overrides)).to.emit(stakingPool, "Claimed").withArgs(other0.address, delfyToken.address, expandTo18Decimals(earned.toString()))
//   })
//   it("allow emergencyWithdraw withdraw", async()=>{
//      await delfyToken.connect(other0).approve(stakingPool.address, expandTo18Decimals("1000000"), overrides)
//     await expect( stakingPool.connect(other0).deposit(delfyToken.address, expandTo18Decimals("50000"), false, overrides)).to.emit(stakingPool, "Deposit").withArgs(other0.address, delfyToken.address, expandTo18Decimals("50000"))
//     expect(await delfyToken.balanceOf(stakingPool.address)).to.equal(expandTo18Decimals("50000"))
//      await advanceBlock(15)
//     await expect( stakingPool.connect(other0).emergencyWithdraw(delfyToken.address, overrides)).to.emit(stakingPool, "EmergencyWithdraw").withArgs(other0.address, delfyToken.address, expandTo18Decimals("50000"))
//   })
//   it("adjust rwd/blk", async()=>{
//       expect(await stakingPool.delfyPerBlock()).to.equal(expandTo18Decimals("40"))
//       await expect(stakingPool.connect(wallet).setDelfyPerBlock(expandTo18Decimals("30"), overrides)).to.emit(stakingPool, "BlockReward").withArgs(wallet.address, expandTo18Decimals("30"))
//       expect(await stakingPool.delfyPerBlock()).to.equal(expandTo18Decimals("30"))
//   })
  it("revert direct withdrawal of pool tokens", async()=>{
    await basicToken2.transfer(stakingPool.address, expandTo18Decimals("15"), overrides)
    expect(await basicToken2.balanceOf(stakingPool.address)).to.equal(expandTo18Decimals("15"))
    await stakingPool.withdrawStrayToken(basicToken2.address, other0.address, expandTo18Decimals("15"), overrides)
    expect(await basicToken2.balanceOf(other0.address)).to.equal(expandTo18Decimals("15"))

  })
  // it("only admin can withdraw stray tokens", async()=>{
  //   await basicToken2.transfer(stakingPool.address, expandTo18Decimals("15"), overrides)
  //   expect(await basicToken2.balanceOf(stakingPool.address)).to.equal(expandTo18Decimals("15"))
  //   await expect(stakingPool.connect(other0).withdrawStrayToken(basicToken2.address, other0.address, expandTo18Decimals("15"), overrides)).to.be.revertedWith("Ownable: caller is not the owner")
  //   expect(await basicToken2.balanceOf(stakingPool.address)).to.equal(expandTo18Decimals("15"))

  // })

  it("revert pool token withdrawal", async()=>{
    await basicToken.transfer(stakingPool.address, expandTo18Decimals("15"), overrides)
    expect(await basicToken.balanceOf(stakingPool.address)).to.equal(expandTo18Decimals("15"))
    await expect(stakingPool.connect(wallet).withdrawStrayToken(basicToken.address, other0.address, expandTo18Decimals("15"), overrides)).to.be.revertedWith("only stray tokens")
    expect(await basicToken.balanceOf(stakingPool.address)).to.equal(expandTo18Decimals("15"))

  })
});
