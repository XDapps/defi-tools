import { ethers } from "hardhat";

async function main() {

	const DecimalUtilsFactory = await ethers.getContractFactory("DecimalUtils");

	let decimalUtilsAddress = "0x66251624649E0DaC7E1BF53A98cDDafed896e8b8";

	try {
		const decimalUtils = await DecimalUtilsFactory.deploy();
		decimalUtilsAddress = await decimalUtils.getAddress();
		console.log("Decimal utils library deployed to:", decimalUtilsAddress);
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
