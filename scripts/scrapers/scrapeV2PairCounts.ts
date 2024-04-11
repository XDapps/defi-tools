import { ethers } from "hardhat";
import { ARB_UTILS_ADDRESS, UNISWAP_V3_UTILS_ADDRESS, QUICKSWAP_V3_UTILS_ADDRESS, UNISWAP_V2_UTILS_ADDRESS, DEPLOYED_SCANNER_ADDRESS } from "../../constants/Polygon";

//************ Scrape Pair Counts Uniswap V2 *********************/
// This script queries the ArbitrageScannerV2 contract for the
// total number of pairs for a UniswapV2 dex.
//
// You pass in an array of dexIds and receive an array of pair counts.
// If you pass in an array of dexIds that includes a dex that is not a
// UniswapV2 dex it will return 0 for that dex.
// DexIds: are determined by the order in which the dexes were added to
// the ArbitrageScannerV2 contract.
// Currently the order is:
// 0: QuickSwapV2
// 1: QuickSwapV3
// 2: UniswapV3
//******************************************************************/

async function main() {
	//Connect to the ArbitrageScannerV2 contract
	const ArbitrageScannerV2Factory = await ethers.getContractFactory("ArbitrageScannerV2", {
		libraries: {
			ArbUtils: ARB_UTILS_ADDRESS,
			UniswapV3Utils: UNISWAP_V3_UTILS_ADDRESS,
			QuickswapV3Utils: QUICKSWAP_V3_UTILS_ADDRESS,
			UniswapV2Utils: UNISWAP_V2_UTILS_ADDRESS
		},
	});	
	const contract = new ethers.Contract(DEPLOYED_SCANNER_ADDRESS, ArbitrageScannerV2Factory.interface, ethers.provider);

	const dexIds = [0, 1, 2]; // Dex Ids you'd like to check.

	const result = await contract.getTotalPairs(dexIds);
	console.log("Pair Counts: ", result);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
