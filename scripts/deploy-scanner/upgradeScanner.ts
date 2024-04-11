import { ethers, upgrades } from "hardhat";

async function main() {

	let arbUtilsAddress = "0xd91ffe16fdF90b81831d95E811c366C76d869894";
	let quickSwapV3UtilsAddress = "0x0648ba3f5aa306AFf7BF9aCA812492B2954a2521";
	let uniSwapV2UtilsAddress = "0x77103683893aAF702053AD1cD4A3E355FbD6E871";
	let uniswapV3UtilsAddress = "0x8183a36Cd907C6c0302B14FcD53432786D300B35";
	
	let deployedScannerAddress = "0xBB77739791647458E181262E11B3Db6Ab5a63647";

	const ArbitrageScannerV2Factory = await ethers.getContractFactory("ArbitrageScannerV2", {
		libraries: {
			ArbUtils: arbUtilsAddress,
			UniswapV3Utils: uniswapV3UtilsAddress,
			QuickswapV3Utils: quickSwapV3UtilsAddress,
			UniswapV2Utils: uniSwapV2UtilsAddress
		},
	}); 
	const upgraded = await upgrades.upgradeProxy(deployedScannerAddress, ArbitrageScannerV2Factory);
  console.log("Contract upgraded at address:", await upgraded.getAddress());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
