
const TokenPayAddr = '0xaE505db78C245893A7D2A4B3CDFE78603d373293'
const lott = artifacts.require("./LotteryGame.sol");

module.exports = async function(deployer) {
    await deployer.deploy(lott, TokenPayAddr);
};