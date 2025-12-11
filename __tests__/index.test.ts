import { NearDIDResolver } from "../src";
// import * as nearAPI from "near-api-js";
// import bs58 from "bs58";

const CONTRACT_ID = "neardti.testnet";
const RPC_URL = "https://rpc.testnet.near.org";
const RPC_URL_MAINNET = "https://rpc.mainnet.near.org";

// jest.mock("near-api-js", () => {
//   const original = jest.requireActual("near-api-js");

//   return {
//     ...original,
//     connect: jest.fn().mockResolvedValue({
//       account: async () => ({
//         viewFunction: async ({ methodName }: { methodName: string }) => {
//             if (methodName === "identity_owner") {
//               return "did:near:CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR";
//             }
//         },
//         getAccessKeys: async () => {
//           return [{access_key: {permission: "FullAccess"}, public_key: "ed25519:7WLUHT69sw5UpYK9xAY5cbdWKf4vSMruXzwfbL999zXo"}]
//         }
//       }),
//     }),
//     providers: {
//       JsonRpcProvider: jest.fn().mockImplementation(() => ({
//         query: async () => ({
//           public_key: "ed25519:AnExampleBase58KeyString",
//         }),
//       })),
//     },
//   };
// });

jest.mock("bs58", () => ({
    encode: jest.fn().mockImplementation((buf) => `bs58(${Buffer.from(buf).toString("hex")})`),
    decode: jest.fn().mockImplementation(() =>
      Buffer.from(new Uint8Array(32).fill(1))
    )
}));

describe("resolveDID", () => {
  let resolver: NearDIDResolver;
  let resolver_both: NearDIDResolver;

  beforeEach(() => {
    resolver = new NearDIDResolver(CONTRACT_ID, RPC_URL);
    resolver_both = new NearDIDResolver({
      networks: [
        {contractId: CONTRACT_ID, rpcUrl: RPC_URL, networkId: "testnet"},
        {contractId: CONTRACT_ID, rpcUrl: RPC_URL_MAINNET, networkId: "near"},
      ],
    });
  });

  it("should return a valid DID Document", async () => {
    const doc = await resolver.resolveDID("did:near:CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR");

    expect(doc).toEqual({
      "@context": doc['@context'],
      id: "did:near:CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR",
      verificationMethod: [
        {
          id: "did:near:CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR#owner",
          type: "Ed25519VerificationKey2018",
          controller: "did:near:CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR",
          publicKeyBase58: "CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR",
        },
      ],
      authentication: ["did:near:CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR#owner"],
      assertionMethod: ["did:near:CF5RiJYh4EVmEt8UADTjoP3XaZo1NPWxv6w5TmkLqjpR#owner"],
    });
  });

  it("should return a valid DID Document for named account", async () => {
    const did = "did:near:geinergv.testnet";
    const doc = await resolver.resolveDID(did);

    const id = did + "#owner"

    expect(doc).toEqual({
      "@context": doc['@context'],
      id: did,
      verificationMethod: [
        {
          id: id,
          type: "Ed25519VerificationKey2018",
          controller: did,
          publicKeyBase58: "7WLUHT69sw5UpYK9xAY5cbdWKf4vSMruXzwfbL999zXo",
        },
      ],
      authentication: [id],
      assertionMethod: [id],
    });
  });

  it("should return a valid DID Document for named account mainnet", async () => {
    const did = "did:near:geinergv.near";
    const doc = await resolver_both.resolveDID(did);

    const id = did + "#owner"

    expect(doc).toEqual({
      "@context": doc['@context'],
      id: did,
      verificationMethod: [
        {
          id: id,
          type: "Ed25519VerificationKey2018",
          controller: did,
          publicKeyBase58: "8hagSnSS6RngSHHmSfwjqEoj3Namt1aVtwZjiJAdrEcf",
        },
      ],
      authentication: [id],
      assertionMethod: [id],
    });
  });

  it("should return a valid DID Document for named account testnet", async () => {
    const did = "did:near:geinergv.testnet";
    const doc = await resolver_both.resolveDID(did);

    const id = did + "#owner"

    expect(doc).toEqual({
      "@context": doc['@context'],
      id: did,
      verificationMethod: [
        {
          id: id,
          type: "Ed25519VerificationKey2018",
          controller: did,
          publicKeyBase58: "7WLUHT69sw5UpYK9xAY5cbdWKf4vSMruXzwfbL999zXo",
        },
      ],
      authentication: [id],
      assertionMethod: [id],
    });
  });
});
