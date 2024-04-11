import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { QUICKSWAP_V2_FACTORY_ADDRESS, 
	QUICKSWAP_V2_QUOTER_ADDRESS, 
	QUICKSWAP_V2_ROUTER_ADDRESS,
	QUICKSWAP_V2_FEES,
	QUICKSWAP_V2_PROTOCOL,
	QUICKSWAP_V3_FACTORY_ADDRESS,
	QUICKSWAP_V3_PROTOCOL,
	UNISWAP_V3_PROTOCOL,
	QUICKSWAP_V3_ROUTER_ADDRESS,
	UNISWAP_V3_ROUTER_ADDRESS,
	QUICKSWAP_V3_QUOTER_ADDRESS,
	UNISWAP_V3_QUOTER_ADDRESS,
	QUICKSWAP_V3_FEES,
	UNISWAP_V3_FEES,
	UNISWAP_V3_FACTORY_ADDRESS,
	POTENTIAL_PAIRS_ADDRESSES,
	POTENTIAL_PAIRS_MAX_SLIPPAGE,
	POTENTIAL_PAIRS_INPUT_AMOUNTS
 } from "../constants/Polygon";

const dexIds = [0, 1, 2];
const dexProtocols: number[] = [QUICKSWAP_V2_PROTOCOL, QUICKSWAP_V3_PROTOCOL, UNISWAP_V3_PROTOCOL];
const dexFactories: string[] = [QUICKSWAP_V2_FACTORY_ADDRESS, QUICKSWAP_V3_FACTORY_ADDRESS, UNISWAP_V3_FACTORY_ADDRESS];
const dexRouters: string[] = [QUICKSWAP_V2_ROUTER_ADDRESS, QUICKSWAP_V3_ROUTER_ADDRESS, UNISWAP_V3_ROUTER_ADDRESS];
const dexQuoters: string[] = [QUICKSWAP_V2_QUOTER_ADDRESS, QUICKSWAP_V3_QUOTER_ADDRESS, UNISWAP_V3_QUOTER_ADDRESS];
const dexFees: number[][] = [QUICKSWAP_V2_FEES, QUICKSWAP_V3_FEES, UNISWAP_V3_FEES];

let arbUtilsAddress = "";
let decimalUtilsAddress = "";
let slippageUtilsAddress = "";
let uniswapV3UtilsAddress = "";
let quickSwapV3UtilsAddress = "";
let uniSwapV2UtilsAddress = "";


describe("Validate Tokens", async function () {
	let arbitrageScannerAddress = "";
	it("Deploy & Validate Tokens", async function () {
		const [owner] = await ethers.getSigners();
		console.log("Deploying contracts with the account:", owner.address);

		//Deploy the base libraries first
		const ArbUtilsFactory = await ethers.getContractFactory("ArbUtils");
		const DecimalUtilsFactory = await ethers.getContractFactory("DecimalUtils");
		const SlippageUtilsFactory = await ethers.getContractFactory("SlippageUtils");

		const arbUtils = await ArbUtilsFactory.deploy();
		arbUtilsAddress = await arbUtils.getAddress();
		const decimalUtils = await DecimalUtilsFactory.deploy();
		decimalUtilsAddress = await decimalUtils.getAddress();
		const slippageUtils = await SlippageUtilsFactory.deploy();
		slippageUtilsAddress = await slippageUtils.getAddress();

		//Deploy the Exchange Utils libraries
		const UniswapV3UtilsFactory = await ethers.getContractFactory("UniswapV3Utils", {
			libraries: {
				DecimalUtils: decimalUtilsAddress,
				SlippageUtils: slippageUtilsAddress
			}
		});
		const uniswapV3Utils = await UniswapV3UtilsFactory.deploy();
		uniswapV3UtilsAddress = await uniswapV3Utils.getAddress();

		const QuickSwapV3UtilsFactory = await ethers.getContractFactory("QuickswapV3Utils", {
			libraries: {
				DecimalUtils: decimalUtilsAddress,
				SlippageUtils: slippageUtilsAddress
			}
		});
		const quickSwapV3Utils = await QuickSwapV3UtilsFactory.deploy();
		quickSwapV3UtilsAddress = await quickSwapV3Utils.getAddress();

		const UniswapV2UtilsFactory = await ethers.getContractFactory("UniswapV2Utils", {
			libraries: {
				DecimalUtils: decimalUtilsAddress,
				SlippageUtils: slippageUtilsAddress
			}
		});
		const uniSwapV2Utils = await UniswapV2UtilsFactory.deploy();
		uniSwapV2UtilsAddress = await uniSwapV2Utils.getAddress();
		
		// Deploy the Arbitrage Scanner contract using the libraries
		const ArbitrageScannerFactory = await ethers.getContractFactory("ArbitrageScanner", {
			libraries: {
				ArbUtils: arbUtilsAddress,
				UniswapV3Utils: uniswapV3UtilsAddress,
				QuickswapV3Utils: quickSwapV3UtilsAddress,
				UniswapV2Utils: uniSwapV2UtilsAddress
			},
		});

		const contract = await upgrades.deployProxy(ArbitrageScannerFactory, [dexIds, dexProtocols, dexFactories, dexRouters, dexQuoters, dexFees], { initializer: 'initializeContract' });
		arbitrageScannerAddress = await contract.getAddress();
		console.log("Scanner Contract deployed to address:", arbitrageScannerAddress);

		// Query to see if specific tokens are valid
		// Valid means that the token has enough liquidity to handle
		// the input amount and be within the slippage tolerance
		// Returns an array of addresses
		// Valid addresses will be the same as the input addresses
		// Invalid addresses will returned as the zero address

		const wbtc = "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6";
		const link = "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39";
		const ric = "0x263026e7e53dbfdce5ae55ade22493f828922965";

		const tokensToCheck = [wbtc, link, ric];
		const results = await contract.validateTokens.staticCall(tokensToCheck, dexIds, POTENTIAL_PAIRS_ADDRESSES, POTENTIAL_PAIRS_INPUT_AMOUNTS, POTENTIAL_PAIRS_MAX_SLIPPAGE);
		console.log("Valid Token Addresses: ", results);
		expect(results.length).to.equal(tokensToCheck.length);
	});

});
