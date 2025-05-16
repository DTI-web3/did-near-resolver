import bs58 from "bs58";
import { Account, connect, keyStores, Near, providers } from "near-api-js";
import { DIDResolver } from 'did-resolver';

class NearDIDResolver {
  private readonly CONTRACT_ID: string;
  private readonly RPC_URL: string;
  private readonly NETWORK_ID: string;

  constructor(contract_id: string, rpc_url: string, network_id: string = "testnet") {
    this.CONTRACT_ID = contract_id;
    this.RPC_URL = rpc_url;
    this.NETWORK_ID = network_id;
  }

  async getNear(): Promise<Near> {
    const keyStore = new keyStores.InMemoryKeyStore();
    return await connect({
      networkId: this.NETWORK_ID,
      keyStore,
      nodeUrl: this.RPC_URL,
      headers: {},
    });
  }

  extractAccountId(did: string): string {
    if (!did.startsWith("did:near:")) {
      throw new Error("Invalid DID format");
    }
    return did.substring("did:near:".length);
  }

  public async getPublicKeyFromRPC(accountId: string): Promise<string> {
    const provider = new providers.JsonRpcProvider({ url: this.RPC_URL });
    const response: Record<string, any> = await provider.query({
      request_type: "view_account",
      finality: "final",
      account_id: this.extractAccountId(accountId),
    });
    const rawKey = response.public_key.replace("ed25519:", "");
    return bs58.encode(Buffer.from(bs58.decode(rawKey)));
  }

  public async resolveDID(accountId: string) {
    const near = await this.getNear();
    const account: Account = await near.account(this.CONTRACT_ID);

    const owner: string = await account.viewFunction({
      contractId: this.CONTRACT_ID,
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
}

export const getResolver = (...args: ConstructorParameters<typeof NearDIDResolver>): Record<string, DIDResolver> => {
    const resolver = new NearDIDResolver(...args);
    return {
        near: async (did) => {
          const didDocument = await resolver.resolveDID(did);
          return {
            didDocument,
            didResolutionMetadata: { contentType: "application/did+json" },
            didDocumentMetadata: {},
          };
        },
    };
}

export default NearDIDResolver;