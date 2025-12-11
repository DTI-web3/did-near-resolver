# @kaytrust/did-near-resolver

A lightweight TypeScript SDK to resolve `did:near:<identifier>` DIDs from a NEAR smart contract registry and/or NEAR accounts.

## 📦 Installation

```bash
npm install @kaytrust/did-near-resolver near-api-js bs58 did-resolver
```

Or with Yarn:

```bash
yarn add @kaytrust/did-near-resolver near-api-js bs58 did-resolver
```

## 🚀 Usage

### Standalone Usage

```ts
import { NearDIDResolver } from '@kaytrust/did-near-resolver';

const resolver = new NearDIDResolver(
  'registry.contract.testnet',
  'https://rpc.testnet.near.org',
  'testnet'
);

const didDocument = await resolver.resolveDID('did:near:CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR');
console.log(didDocument);
```

### Usage with `did-resolver`

This is the recommended way to use this package if you are working with multiple DID methods.

```ts
import { Resolver } from 'did-resolver';
import { getResolver } from '@kaytrust/did-near-resolver';

const nearResolver = getResolver(
  'registry.contract.testnet',
  'https://rpc.testnet.near.org',
  'testnet'
);

const resolver = new Resolver({
  ...nearResolver,
  // ...other resolvers
});

const result = await resolver.resolve('did:near:CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR');
console.log(result.didDocument);
```

## 🔧 Configuration

The `NearDIDResolver` constructor supports single network configuration or multiple networks.

### Single Network

```ts
new NearDIDResolver(contractId: string, rpcUrl: string, networkId: string = 'testnet')
```

### Multiple Networks

You can configure multiple networks (e.g. testnet and mainnet) by passing an options object.

```ts
const resolver = new NearDIDResolver({
  networks: [
    {
      networkId: 'testnet',
      contractId: 'registry.contract.testnet',
      rpcUrl: 'https://rpc.testnet.near.org'
    },
    {
      networkId: 'mainnet',
      contractId: 'registry.contract.near',
      rpcUrl: 'https://rpc.mainnet.near.org'
    }
  ]
});
```

## 🔍 Resolution Strategy

Resolves a `did:near:<base58PublicKey | accountId>` into a DID Document.

*   **Implicit DIDs:** If the identifier is a base58-encoded public key, it generates a DID Document with that key as the verification method.
*   **Registered DIDs:** If the identifier is a NEAR account ID (e.g. `alice.testnet`), it queries the configured smart contract (`identity_owner` method) to retrieve the associated public key(s).

#### Example output:

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2018/v1"
  ],
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

ISC
