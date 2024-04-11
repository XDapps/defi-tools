import { ethers, upgrades } from "hardhat";
import { QUICKSWAP_V2_PROTOCOL, QUICKSWAP_V3_PROTOCOL, UNISWAP_V3_PROTOCOL, QUICKSWAP_V2_FACTORY_ADDRESS, QUICKSWAP_V3_FACTORY_ADDRESS, UNISWAP_V3_FACTORY_ADDRESS, QUICKSWAP_V2_ROUTER_ADDRESS, QUICKSWAP_V3_ROUTER_ADDRESS, UNISWAP_V3_ROUTER_ADDRESS, QUICKSWAP_V2_QUOTER_ADDRESS, QUICKSWAP_V3_QUOTER_ADDRESS, UNISWAP_V3_QUOTER_ADDRESS, QUICKSWAP_V2_FEES, QUICKSWAP_V3_FEES, UNISWAP_V3_FEES } from "../../constants/Polygon";

async function main() {

	let arbUtilsAddress = "0xd91ffe16fdF90b81831d95E811c366C76d869894";
	let quickSwapV3UtilsAddress = "0x0648ba3f5aa306AFf7BF9aCA812492B2954a2521";
	let uniSwapV2UtilsAddress = "0x77103683893aAF702053AD1cD4A3E355FbD6E871";
	let uniswapV3UtilsAddress = "0x8183a36Cd907C6c0302B14FcD53432786D300B35";

	let deployedScannerAddress = "0xBB77739791647458E181262E11B3Db6Ab5a63647";

	const dexIds = [0, 1, 2];
	const dexProtocols: number[] = [QUICKSWAP_V2_PROTOCOL, QUICKSWAP_V3_PROTOCOL, UNISWAP_V3_PROTOCOL];
	const dexFactories: string[] = [QUICKSWAP_V2_FACTORY_ADDRESS, QUICKSWAP_V3_FACTORY_ADDRESS, UNISWAP_V3_FACTORY_ADDRESS];
	const dexRouters: string[] = [QUICKSWAP_V2_ROUTER_ADDRESS, QUICKSWAP_V3_ROUTER_ADDRESS, UNISWAP_V3_ROUTER_ADDRESS];
	const dexQuoters: string[] = [QUICKSWAP_V2_QUOTER_ADDRESS, QUICKSWAP_V3_QUOTER_ADDRESS, UNISWAP_V3_QUOTER_ADDRESS];
	const dexFees: number[][] = [QUICKSWAP_V2_FEES, QUICKSWAP_V3_FEES, UNISWAP_V3_FEES];


	try {
		const ArbitrageScannerFactory = await ethers.getContractFactory("ArbitrageScanner", {
			libraries: {
				ArbUtils: arbUtilsAddress,
				UniswapV3Utils: uniswapV3UtilsAddress,
				QuickswapV3Utils: quickSwapV3UtilsAddress,
				UniswapV2Utils: uniSwapV2UtilsAddress
			},
		});

		const scannerContract = await upgrades.deployProxy(ArbitrageScannerFactory, [dexIds, dexProtocols, dexFactories, dexRouters, dexQuoters, dexFees], { initializer: 'initializeContract' });
		deployedScannerAddress = await scannerContract.getAddress();
		console.log("Scanner Contract deployed to address:", deployedScannerAddress);

	} catch (error) {
		console.error("Error deploying contract", error);
	}
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
