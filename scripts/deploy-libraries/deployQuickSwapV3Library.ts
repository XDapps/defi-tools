import { ethers } from "hardhat";

async function main() {

	let decimalUtilsAddress = "0x66251624649E0DaC7E1BF53A98cDDafed896e8b8";
	let slippageUtilsAddress = "0xedafdb092A50cE56488ad679fDe35396dE7cEEa2";

	let quickSwapV3UtilsAddress = "0x0648ba3f5aa306AFf7BF9aCA812492B2954a2521";

	const QuickSwapV3UtilsFactory = await ethers.getContractFactory("QuickswapV3Utils", {
		libraries: {
			DecimalUtils: decimalUtilsAddress,
			SlippageUtils: slippageUtilsAddress
		}
	});

	try {
		const quickSwapV3Utils = await QuickSwapV3UtilsFactory.deploy();
		quickSwapV3UtilsAddress = await quickSwapV3Utils.getAddress();
		console.log("QuickSwapV3 utils library deployed to:", quickSwapV3UtilsAddress);

		} catch (error) {
		console.error("Error deploying contract", error);
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
