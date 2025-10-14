import { describe, it, expect, beforeEach } from "vitest";
import { stringAsciiCV, stringUtf8CV, uintCV } from "@stacks/transactions";

const ERR_NOT_AUTHORIZED = 100;
const ERR_INVALID_PROOF_HASH = 101;
const ERR_INVALID_CAMPAIGN = 102;
const ERR_INVALID_DONATION = 103;
const ERR_PROOF_ALREADY_EXISTS = 104;
const ERR_PROOF_NOT_FOUND = 105;
const ERR_INVALID_TIMESTAMP = 106;
const ERR_INVALID_METADATA = 107;
const ERR_AUTHORITY_NOT_VERIFIED = 108;
const ERR_INVALID_PROOF_TYPE = 109;
const ERR_MAX_PROOFS_EXCEEDED = 111;

interface Proof {
  proofHash: string;
  campaignId: number;
  donationId: number;
  proofType: string;
  metadata: string;
  timestamp: number;
  submitter: string;
  status: boolean;
}

interface Verification {
  verifier: string;
  verificationTimestamp: number;
  isValid: boolean;
}

interface Result<T> {
  ok: boolean;
  value: T;
}

class ImpactProofMock {
  state: {
    nextProofId: number;
    maxProofs: number;
    authorityContract: string | null;
    proofs: Map<number, Proof>;
    proofsByHash: Map<string, number>;
    proofVerifications: Map<number, Verification>;
  } = {
    nextProofId: 0,
    maxProofs: 10000,
    authorityContract: null,
    proofs: new Map(),
    proofsByHash: new Map(),
    proofVerifications: new Map(),
  };
  blockHeight: number = 0;
  caller: string = "ST1TEST";

  constructor() {
    this.reset();
  }

  reset() {
    this.state = {
      nextProofId: 0,
      maxProofs: 10000,
      authorityContract: null,
      proofs: new Map(),
      proofsByHash: new Map(),
      proofVerifications: new Map(),
    };
    this.blockHeight = 0;
    this.caller = "ST1TEST";
  }

  setAuthorityContract(contractPrincipal: string): Result<boolean> {
    if (contractPrincipal === "SP000000000000000000002Q6VF78") {
      return { ok: false, value: false };
    }
    if (this.state.authorityContract !== null) {
      return { ok: false, value: false };
    }
    this.state.authorityContract = contractPrincipal;
    return { ok: true, value: true };
  }

  submitProof(
    proofHash: string,
    campaignId: number,
    donationId: number,
    proofType: string,
    metadata: string
  ): Result<number> {
    if (this.state.nextProofId >= this.state.maxProofs) return { ok: false, value: ERR_MAX_PROOFS_EXCEEDED };
    if (!proofHash || proofHash.length > 64) return { ok: false, value: ERR_INVALID_PROOF_HASH };
    if (campaignId <= 0) return { ok: false, value: ERR_INVALID_CAMPAIGN };
    if (donationId <= 0) return { ok: false, value: ERR_INVALID_DONATION };
    if (!["photo", "report", "video"].includes(proofType)) return { ok: false, value: ERR_INVALID_PROOF_TYPE };
    if (metadata.length > 256) return { ok: false, value: ERR_INVALID_METADATA };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    if (this.state.proofsByHash.has(proofHash)) return { ok: false, value: ERR_PROOF_ALREADY_EXISTS };

    const proofId = this.state.nextProofId;
    const proof: Proof = {
      proofHash,
      campaignId,
      donationId,
      proofType,
      metadata,
      timestamp: this.blockHeight,
      submitter: this.caller,
      status: true,
    };
    this.state.proofs.set(proofId, proof);
    this.state.proofsByHash.set(proofHash, proofId);
    this.state.nextProofId++;
    return { ok: true, value: proofId };
  }

  verifyProof(proofId: number, isValid: boolean): Result<boolean> {
    const proof = this.state.proofs.get(proofId);
    if (!proof) return { ok: false, value: ERR_PROOF_NOT_FOUND };
    if (!this.state.authorityContract) return { ok: false, value: ERR_AUTHORITY_NOT_VERIFIED };
    this.state.proofVerifications.set(proofId, {
      verifier: this.caller,
      verificationTimestamp: this.blockHeight,
      isValid,
    });
    this.state.proofs.set(proofId, { ...proof, status: isValid });
    return { ok: true, value: true };
  }

  getProof(proofId: number): Proof | null {
    return this.state.proofs.get(proofId) || null;
  }

  getProofByHash(proofHash: string): Proof | null {
    const proofId = this.state.proofsByHash.get(proofHash);
    return proofId !== undefined ? this.state.proofs.get(proofId) || null : null;
  }

  getVerification(proofId: number): Verification | null {
    return this.state.proofVerifications.get(proofId) || null;
  }

  getProofCount(): Result<number> {
    return { ok: true, value: this.state.nextProofId };
  }

  isProofRegistered(proofHash: string): Result<boolean> {
    return { ok: true, value: this.state.proofsByHash.has(proofHash) };
  }
}

describe("ImpactProof", () => {
  let contract: ImpactProofMock;

  beforeEach(() => {
    contract = new ImpactProofMock();
    contract.reset();
  });

  it("submits proof successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.submitProof("abc123", 1, 1, "photo", "Well built");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(0);
    const proof = contract.getProof(0);
    expect(proof?.proofHash).toBe("abc123");
    expect(proof?.campaignId).toBe(1);
    expect(proof?.donationId).toBe(1);
    expect(proof?.proofType).toBe("photo");
    expect(proof?.metadata).toBe("Well built");
    expect(proof?.submitter).toBe("ST1TEST");
    expect(proof?.status).toBe(true);
  });

  it("rejects duplicate proof hash", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.submitProof("abc123", 1, 1, "photo", "Well built");
    const result = contract.submitProof("abc123", 2, 2, "report", "School built");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_PROOF_ALREADY_EXISTS);
  });

  it("rejects invalid proof hash", () => {
    contract.setAuthorityContract("ST2TEST");
    const longHash = "a".repeat(65);
    const result = contract.submitProof(longHash, 1, 1, "photo", "Well built");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PROOF_HASH);
  });

  it("rejects invalid campaign ID", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.submitProof("abc123", 0, 1, "photo", "Well built");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_CAMPAIGN);
  });

  it("rejects invalid donation ID", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.submitProof("abc123", 1, 0, "photo", "Well built");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_DONATION);
  });

  it("rejects invalid proof type", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.submitProof("abc123", 1, 1, "invalid", "Well built");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_PROOF_TYPE);
  });

  it("rejects invalid metadata", () => {
    contract.setAuthorityContract("ST2TEST");
    const longMetadata = "a".repeat(257);
    const result = contract.submitProof("abc123", 1, 1, "photo", longMetadata);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_INVALID_METADATA);
  });

  it("rejects proof submission without authority", () => {
    const result = contract.submitProof("abc123", 1, 1, "photo", "Well built");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_AUTHORITY_NOT_VERIFIED);
  });

  it("verifies proof successfully", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.submitProof("abc123", 1, 1, "photo", "Well built");
    const result = contract.verifyProof(0, true);
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const verification = contract.getVerification(0);
    expect(verification?.verifier).toBe("ST1TEST");
    expect(verification?.isValid).toBe(true);
    const proof = contract.getProof(0);
    expect(proof?.status).toBe(true);
  });

  it("rejects verification for non-existent proof", () => {
    contract.setAuthorityContract("ST2TEST");
    const result = contract.verifyProof(99, true);
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_PROOF_NOT_FOUND);
  });

  it("gets proof by hash", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.submitProof("abc123", 1, 1, "photo", "Well built");
    const proof = contract.getProofByHash("abc123");
    expect(proof?.proofHash).toBe("abc123");
    expect(proof?.campaignId).toBe(1);
  });

  it("checks proof existence", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.submitProof("abc123", 1, 1, "photo", "Well built");
    const result = contract.isProofRegistered("abc123");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    const result2 = contract.isProofRegistered("xyz789");
    expect(result2.ok).toBe(true);
    expect(result2.value).toBe(false);
  });

  it("parses Clarity types", () => {
    const hash = stringAsciiCV("abc123");
    const metadata = stringUtf8CV("Well built");
    const campaignId = uintCV(1);
    expect(hash.value).toBe("abc123");
    expect(metadata.value).toBe("Well built");
    expect(campaignId.value).toEqual(BigInt(1));
  });

  it("rejects proof when max proofs exceeded", () => {
    contract.setAuthorityContract("ST2TEST");
    contract.state.maxProofs = 1;
    contract.submitProof("abc123", 1, 1, "photo", "Well built");
    const result = contract.submitProof("xyz789", 2, 2, "report", "School built");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(ERR_MAX_PROOFS_EXCEEDED);
  });

  it("sets authority contract successfully", () => {
    const result = contract.setAuthorityContract("ST2TEST");
    expect(result.ok).toBe(true);
    expect(result.value).toBe(true);
    expect(contract.state.authorityContract).toBe("ST2TEST");
  });

  it("rejects invalid authority contract", () => {
    const result = contract.setAuthorityContract("SP000000000000000000002Q6VF78");
    expect(result.ok).toBe(false);
    expect(result.value).toBe(false);
  });
});