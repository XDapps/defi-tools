import { ethers } from "hardhat";

async function main() {

	const SlippageUtilsFactory = await ethers.getContractFactory("SlippageUtils");
	let slippageUtilsAddress = "0xedafdb092A50cE56488ad679fDe35396dE7cEEa2";

	try {
		const slippageUtils = await SlippageUtilsFactory.deploy();
		slippageUtilsAddress = await slippageUtils.getAddress();
		console.log("Slippage utils library deployed to:", slippageUtilsAddress);

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
