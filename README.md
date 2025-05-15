# NearDIDResolver SDK (TypeScript)

A lightweight TypeScript SDK to resolve `did:near:<identifier>` DIDs from a NEAR smart contract registry and/or NEAR accounts.

## 📦 Installation

```bash
npm install near-api-js bs58
```

Or with Yarn:

```bash
yarn add near-api-js bs58
```

## 🚀 Usage

```ts
import NearDIDResolver from './NearDIDResolver';

const resolver = new NearDIDResolver(
  'registry.contract.testnet',
  'https://rpc.testnet.near.org',
  'testnet'
);

const didDocument = await resolver.resolveDID('did:near:CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR');
console.log(didDocument);
```

## 🔧 Constructor

```ts
new NearDIDResolver(contractId: string, rpcUrl: string, networkId: string = 'testnet')
```

* `contractId`: The NEAR smart contract that implements `identity_owner`.
* `rpcUrl`: RPC URL for NEAR network.
* `networkId`: NEAR network (e.g., `testnet`, `mainnet`).

## 🔍 `resolveDID(did: string)`

Resolves a `did:near:<base58PublicKey | accountId>` into a DID Document.

### Resolution Strategy:

* Calls the `identity_owner` view function on the specified contract.
* If the result is a `did:near:<key>`, it strips the prefix.
* Otherwise assumes it’s a base58-encoded Ed25519 public key.

#### Example output:

```json
{
  "@context": "https://w3id.org/did/v1",
  "id": "did:near:CF5Ri...",
  "verificationMethod": [
    {
      "id": "did:near:CF5Ri...#owner",
      "type": "Ed25519VerificationKey2018",
      "controller": "did:near:CF5Ri...",
      "publicKeyBase58": "CF5Ri..."
    }
  ],
  "authentication": ["did:near:CF5Ri...#owner"],
  "assertionMethod": ["did:near:CF5Ri...#owner"]
}
```

---

## 🧰 `getPublicKeyFromRPC(accountId: string): Promise<string>`

Fetches the public key of a NEAR account directly from the RPC (not from the registry).

---

## 🔐 Cryptographic Notes

* Uses Ed25519 public keys encoded in **base58**.
* Compatible with `Ed25519VerificationKey2018` type in the DID Document spec.
* Supports keys stored:

  * Directly on-chain in the smart contract
  * From NEAR account keys using `view_account`

---

## 🧪 Testing

To test your resolver:

1. Deploy a compatible `NearDIDRegistry` contract.
2. Register a DID and owner.
3. Call `resolveDID(...)` from this SDK.
4. Validate it against a DID resolver or JWT verifier like `did-jwt`.

---

## 📄 License

MIT — use freely in your own DID resolver stacks and NEAR integrations.
