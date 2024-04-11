import { ethers } from "ethers";
import { DexProtocol } from "./Protocols";

//************ Exchange Details*******************/
export const QUICKSWAP_V2_FACTORY_ADDRESS = "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32";
export const QUICKSWAP_V2_ROUTER_ADDRESS = "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff";
export const QUICKSWAP_V2_QUOTER_ADDRESS = "0x0000000000000000000000000000000000000000";
export const QUICKSWAP_V2_FEES = [25]; 
export const QUICKSWAP_V2_PROTOCOL = DexProtocol.UNISWAP_V2;

export const QUICKSWAP_V3_FACTORY_ADDRESS = "0x411b0fAcC3489691f28ad58c47006AF5E3Ab3A28";
export const QUICKSWAP_V3_ROUTER_ADDRESS = "0xf5b509bB0909a69B1c207E495f687a596C168E12";
export const QUICKSWAP_V3_QUOTER_ADDRESS = "0xa15F0D7377B2A0C0c10db057f641beD21028FC89";
export const QUICKSWAP_V3_FEES = [3000]; //QuickswapV3 has dynamic fees, this value is just a placeholder
export const QUICKSWAP_V3_PROTOCOL = DexProtocol.UNISWAP_V3;

export const UNISWAP_V3_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const UNISWAP_V3_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
export const UNISWAP_V3_QUOTER_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
export const UNISWAP_V3_FEES = [500, 3000, 10000]; 
export const UNISWAP_V3_PROTOCOL = DexProtocol.UNISWAP_V3;

//************ Token Addresses *******************/
export const WMATIC = "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270";
export const WETH = "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619";
export const USDC = "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359";
export const USDCE = "0x2791bca1f2de4661ed88a30c99a7a9449aa84174";
export const USDT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";

//************ Liquidity Validation *******************/
// Acceptable Tokens for Validation
// These values are used to determine if a potential arbitrage token
// can handle a specific input amount and its price remain within a
// certain slippage tolerance
// This allows us to scan a large list of alt coins and determine
// if they have minimum liquidity vs at least one of the acceptable tokens
export const POTENTIAL_PAIRS_ADDRESSES = [WMATIC, WETH, USDC, USDCE, USDT];
// Here we're setting the maximum slippage tolerance for each token at 0.5%
// You may adjust this on a token by token basis
export const POTENTIAL_PAIRS_MAX_SLIPPAGE = [500, 500, 500, 500, 500];
// Here we're setting the input amounts for each token in the Potential Pairs list
// It's important to include the proper amount of decimal places for normalization
// This example is calculating liquidity/slippage based on trade sizes of:
// 10,000 WMATIC, 3 WETH, 10,000 USDC, 10,000 USDCE, 10,000 USDT
const wmaticInputAmount = ethers.parseUnits("10000", 18);
const wethInputAmount = ethers.parseUnits("3", 18);
const usdcInputAmount = ethers.parseUnits("10000", 6);
const usdceInputAmount = ethers.parseUnits("10000", 6);
const usdtInputAmount = ethers.parseUnits("10000", 6);
export const POTENTIAL_PAIRS_INPUT_AMOUNTS = [wmaticInputAmount, wethInputAmount, usdcInputAmount, usdceInputAmount, usdtInputAmount];


//************ Deployed Addresses *******************/
// These are the addresses where these contracts are
// currently deployed on the Polygon Network

export const ARB_UTILS_ADDRESS = "0xd91ffe16fdF90b81831d95E811c366C76d869894";
export const QUICKSWAP_V3_UTILS_ADDRESS = "0x0648ba3f5aa306AFf7BF9aCA812492B2954a2521";
export const UNISWAP_V2_UTILS_ADDRESS = "0x77103683893aAF702053AD1cD4A3E355FbD6E871";
export const UNISWAP_V3_UTILS_ADDRESS = "0x8183a36Cd907C6c0302B14FcD53432786D300B35";
export const DEPLOYED_SCANNER_ADDRESS = "0xBB77739791647458E181262E11B3Db6Ab5a63647";

