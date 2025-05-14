import bs58 from "bs58";
import { Account, connect, keyStores, Near, providers } from "near-api-js";

// const CONTRACT_ID = "neardti.testnet";
const RPC_URL = "https://rpc.testnet.near.org";

async function getNear(): Promise<Near> {
  const keyStore = new keyStores.InMemoryKeyStore();
  return await connect({
    networkId: "testnet",
    keyStore,
    nodeUrl: RPC_URL,
    headers: {},
  });
}

function extractAccountId(did: string): string {
  console.log(did);
    if (!did.startsWith("did:near:")) {
      throw new Error("Invalid DID format");
    }
    return did.substring("did:near:".length);
}

async function getPublicKeyFromRPC(accountId: string): Promise<string> {
  const provider = new providers.JsonRpcProvider({ url: RPC_URL });
  const response: Record<string, any> = await provider.query({
    request_type: "view_account",
    finality: "final",
    account_id: extractAccountId(accountId),
  });
  const rawKey = response.public_key.replace("ed25519:", "");
  return bs58.encode(Buffer.from(bs58.decode(rawKey)));
}

export async function resolveDID(accountId: string, contract_id: string) {
  const near = await getNear();
  const account: Account = await near.account(contract_id);

  const owner: string = await account.viewFunction({
    contractId: contract_id,
    methodName: "identity_owner",
    args: { identity: accountId },
  });

  const did = `${accountId}`;
  const keyId = `${did}#owner`;

  // const publicKeyBase58 = await getPublicKeyFromRPC(owner);
  let publicKeyBase58 = owner;

  if (owner.startsWith("did:near:")) {
    publicKeyBase58 = owner.replace("did:near:", "");
  }

  const document = {
    "@context": "https://w3id.org/did/v1",
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: "Ed25519VerificationKey2018",
        controller: did,
        publicKeyBase58,
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
  };

  return document;
}

// Ejecutar si se llama directamente
// if (require.main === module) {
//   (async () => {
//     const doc = await resolveDID("your-user.testnet");
//     console.log(JSON.stringify(doc, null, 2));
//   })();
// }
