const hre = require("hardhat");
const ethers = hre.ethers


async function main(){
  let accounts = await ethers.getSigners();
  let [deployer, other0, other1, other3, other4, other5, other6, other7, other8] = accounts
    console.log(
    "Deploying contracts with the account:",
    deployer.address
  );
  const wethAddr ="0x9B4578900377c853da0C46A90382E8f75Ea5A80E"
  const factoryAddr = "0x1a6d1a320989b629A1315A3F748d78966fA329e0"
  const routerAddr = "0x201E4c2CaEA7722C43FA0fc7073F7333A332285D"
 


}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });