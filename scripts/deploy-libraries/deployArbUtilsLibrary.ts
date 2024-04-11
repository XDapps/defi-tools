import { ethers } from "hardhat";

async function main() {

	const ArbUtilsFactory = await ethers.getContractFactory("ArbUtils");
	let arbUtilsAddress = "0xd91ffe16fdF90b81831d95E811c366C76d869894";

	try {
		const arbUtils = await ArbUtilsFactory.deploy();
		arbUtilsAddress = await arbUtils.getAddress();
		console.log("Arb utils library deployed to:", arbUtilsAddress);
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
