import { DIDResolver } from 'did-resolver';
import { Account, connect, keyStores } from "near-api-js";

export class NearDIDResolver {
  private readonly NETWORK_ID: string;
  private readonly RPC_URL: string;
  private readonly CONTRACT_ID: string;

  constructor(contract_id: string, rpc_url: string, network_id: string = "testnet") {
    this.CONTRACT_ID = contract_id;
    this.RPC_URL = rpc_url;
    this.NETWORK_ID = network_id;
  }

  private isNamedAccount(did: string): boolean {
    const accountId = did.replace('did:near:', '');
    return /^[a-z0-9_\-\.]+\.testnet$|\.near$/i.test(accountId);
  }

  private isBase58Did(did: string): boolean {
    const identifier = did.replace('did:near:', '');
    return /^[1-9A-HJ-NP-Za-km-z]{44,50}$/.test(identifier);
  }

  private async getNear() {
    return connect({
      networkId: this.NETWORK_ID,
      nodeUrl: this.RPC_URL,
      deps: { keyStore: new keyStores.InMemoryKeyStore() },
    });
  }

  private async getPublicKeyFromRPC(accountId: string): Promise<string[]> {
    const near = await this.getNear();
    const account = await near.account(accountId);

    if (!account) {
      throw new Error(`No account found ${accountId}`);
    }

    const accessKeys = await account.getAccessKeys();

    if (!accessKeys || accessKeys.length === 0) {
      throw new Error(`No access keys found for account ${accountId}`);
    }

    return accessKeys.filter((a)=>a.access_key.permission == "FullAccess").map(a=>a.public_key.replace('ed25519:', ''))
  }

  public async resolveDID(did: string) {
    const identifier = did.replace('did:near:', '');
    let publicKeyBase58List:string[] = [];

    if (this.isNamedAccount(did)) {
      try {
        publicKeyBase58List = await this.getPublicKeyFromRPC(identifier);
      } catch (err) {
        throw new Error(`Named account ${identifier} not found: ${(err as Error).message}`);
      }
    } else if (this.isBase58Did(did)) {
      const near = await this.getNear();
      const account: Account = await near.account(this.CONTRACT_ID);

      const owner: string | null = await account.viewFunction({
        contractId: this.CONTRACT_ID,
        methodName: 'identity_owner',
        args: { identity: did },
      });

      if (!owner || owner === 'null') {
        throw new Error(`DID ${did} not registered in ${this.CONTRACT_ID}`);
      }

      publicKeyBase58List = [owner.startsWith('did:near:')
        ? owner.replace('did:near:', '')
        : owner];
    } else {
      throw new Error(`Invalid did:near format`);
    }

    const keyId = `${did}#owner`;

    const verificationMethod = publicKeyBase58List.map((public_key)=>{
      return {
          id: keyId,
          type: 'Ed25519VerificationKey2018',
          controller: did,
          publicKeyBase58: public_key,
        }
    })
    return {
      '@context': [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/ed25519-2018/v1"
      ],
      id: did,
      verificationMethod,
      authentication: [keyId],
      assertionMethod: [keyId],
    };
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