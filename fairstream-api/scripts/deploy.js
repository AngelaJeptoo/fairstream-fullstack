const hre = require('hardhat');
(async () => {
  const c = await hre.ethers.deployContract('FairStreamRoyalties');
  await c.waitForDeployment();
  console.log('Deployed to:', await c.getAddress(), '\nPut this in .env as CONTRACT_ADDRESS');
})();
