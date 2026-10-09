import { Keypair, Asset, Horizon } from "@stellar/stellar-sdk";

export async function issueTBTC(recipientPublicKey?: string, amount: string = "100.0") {
  console.log(`[+] Issuing ${amount} tBTC testnet tokens...`);
  const issuer = Keypair.random();
  console.log(`Issuer public key: ${issuer.publicKey()}`);
  const asset = new Asset("tBTC", issuer.publicKey());
  console.log(`Asset established: ${asset.getCode()}`);
  if (recipientPublicKey) {
    console.log(`Target recipient: ${recipientPublicKey}`);
  }
  return { asset, issuer };
}

if (require.main === module) {
  issueTBTC().catch(console.error);
}
