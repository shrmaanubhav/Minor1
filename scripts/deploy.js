const { ethers } = require("hardhat");

async function main() {
  // Hardhat automatically uses the account corresponding to the PRIVATE_KEY in your .env
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contract with the account:", deployer.address);

  // Get the ContractFactory for our "LegitCred" contract
  const LegitCred = await ethers.getContractFactory("LegitCred");

  // Deploy the contract
  const legitCred = await LegitCred.deploy(deployer.address);

  // Wait for the deployment to be mined
  await legitCred.deployed();
  
  console.log("Contract deployed to address:", legitCred.address);

  // The deployer is automatically set as the owner by OpenZeppelin's Ownable constructor
  const owner = await legitCred.owner();
  console.log("Contract owner is:", owner);

  // Verify the owner
  if (owner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("Deployment successful! The deployer is the owner of the contract.");
      console.log(`Owner address: ${owner}`);
  } else {
      console.log("Warning: The deployer is NOT the owner of the contract. Please check your setup.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
