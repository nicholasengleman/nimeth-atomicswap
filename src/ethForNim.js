const nim = require('./nim')
const eth = require('./eth')
const prompt = require('./prompt')

async function ethForNim() {
  const ethWallet = eth.addWallet(nim.getWalletPrivateKey())
  console.log('Local ETH wallet address =', ethWallet);
  const nimHtlcAddress = await prompt('Enter the NIM HTLC address: ')
  const ethHtlcAddress = await prompt('Enter the ETH HTLC address: ')
  console.log('\nNIM HTLC:');
  const nimHashSecret = await nim.verifyHTLC(nimHtlcAddress)
  console.log('\nETH HTLC:');
  const ethHashSecret = await eth.verifyHTLC(ethHtlcAddress)
  if (nimHashSecret !== ethHashSecret) {
    throw "Hashes don't match"
  }
  console.log(`\nIf details are correct then send the agreed amount of ETH to ${ethHtlcAddress}`);
  console.log('Waiting for ETH contract to be resolved...');
  await eth.waitForHTLC(ethHtlcAddress)
    .then(async function(secret) {
      const nimRecipient = await prompt('Enter the NIM address to send the funds to: ')
      await nim.resolveHTLC(nimHtlcAddress, nimRecipient, nimHashSecret, secret)
    })
    .catch(async function(err) {
      console.log(err);
      console.log('Refunding ETH...');
      await eth.refundHTLC(ethWallet, ethHtlcAddress)
    })
}

module.exports = ethForNim
