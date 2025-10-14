# 🌍 Immutable Donation Platform

Welcome to a transparent, blockchain-based donation platform built on the Stacks blockchain using Clarity smart contracts. This project ensures donors can track their contributions and receive verifiable proof of impact, such as photos or reports, securely stored on the blockchain.

## ✨ Features

🔄 **Immutable Donation Records**: Track every donation with transparency.  
📸 **Proof of Impact**: Donors receive photos or reports linked to their contributions.  
✅ **Verification System**: Donors can verify the authenticity of impact proofs.  
🛡️ **Secure Fund Allocation**: Ensures donations are used as intended.  
📊 **Donation Analytics**: Provides insights into donation history and impact.  
🚫 **Fraud Prevention**: Prevents duplicate or unauthorized proof submissions.

## 🛠 How It Works

### For Donors
1. **Donate**: Send STX (Stacks' native token) to a campaign via the `donation-manager` contract.
2. **Receive Proof**: Charities upload proof of impact (e.g., photo hash or report) linked to your donation.
3. **Verify Impact**: Use the `proof-verifier` contract to confirm the authenticity of the proof.

### For Charities
1. **Register Campaign**: Create a campaign with details via the `campaign-manager` contract.
2. **Submit Proof**: Upload proof of impact (e.g., photo hash) to the `impact-proof` contract.
3. **Access Funds**: Withdraw allocated funds via the `fund-escrow` contract after proof submission.

### For Verifiers
1. **Check Donation**: Use the `donation-tracker` contract to view donation details.
2. **Validate Proof**: Query the `proof-verifier` contract to ensure the proof is legitimate.

## 📜 Smart Contracts

This project uses 6 Clarity smart contracts to manage the donation ecosystem:

1. **donation-manager.clar**: Handles donation transactions and records donor details.
2. **campaign-manager.clar**: Manages charity campaigns, including creation and updates.
3. **impact-proof.clar**: Stores and manages proof of impact (e.g., photo hashes or report metadata).
4. **proof-verifier.clar**: Verifies the authenticity of submitted proofs.
5. **fund-escrow.clar**: Manages fund allocation and release to charities.
6. **donation-analytics.clar**: Tracks donation statistics and impact metrics.

### Contract Details

#### 1. donation-manager.clar
- **Purpose**: Records donations and links them to campaigns.
- **Key Functions**:
  - `donate`: Accepts STX donations and records donor details.
  - `get-donation-details`: Retrieves donation history for a donor or campaign.

#### 2. campaign-manager.clar
- **Purpose**: Allows charities to create and manage campaigns.
- **Key Functions**:
  - `create-campaign`: Registers a new campaign with title, description, and goal.
  - `update-campaign-status`: Updates campaign status (e.g., active, completed).

#### 3. impact-proof.clar
- **Purpose**: Stores proof of impact, such as photo hashes or report metadata.
- **Key Functions**:
  - `submit-proof`: Allows charities to submit proof linked to a donation.
  - `get-proof-details`: Retrieves proof metadata for a donation.

#### 4. proof-verifier.clar
- **Purpose**: Enables donors to verify the authenticity of impact proofs.
- **Key Functions**:
  - `verify-proof`: Checks if a proof matches the recorded hash and campaign.
  - `get-verification-status`: Returns verification results.

#### 5. fund-escrow.clar
- **Purpose**: Secures funds until proof of impact is submitted.
- **Key Functions**:
  - `lock-funds`: Locks donated funds for a campaign.
  - `release-funds`: Releases funds to the charity after proof verification.

#### 6. donation-analytics.clar
- **Purpose**: Provides analytics on donations and impact.
- **Key Functions**:
  - `get-total-donations`: Returns total donations for a campaign or globally.
  - `get-impact-metrics`: Summarizes proof submissions and verified impacts.

## 🚀 Getting Started

### Prerequisites
- Stacks blockchain wallet (e.g., Hiro Wallet).
- Clarity development environment (e.g., Clarinet).
- STX tokens for testing on the Stacks testnet.

### Installation
1. Clone this repository:
   ```bash
   git clone https://github.com/your-repo/immutable-donation-platform.git
   ```
2. Install Clarinet:
   ```bash
   npm install -g @hirosystems/clarinet
   ```
3. Deploy contracts to the Stacks testnet using Clarinet:
   ```bash
   clarinet deploy
   ```

### Usage
1. **Charities**: Create a campaign using `campaign-manager.clar` and submit proof via `impact-proof.clar`.
2. **Donors**: Donate STX using `donation-manager.clar` and verify proof with `proof-verifier.clar`.
3. **Analytics**: Query donation and impact metrics via `donation-analytics.clar`.

## 🧪 Testing
Run contract tests using Clarinet:
```bash
clarinet test
```

## 🌟 Why This Matters
This platform solves the real-world problem of donation transparency by leveraging the Stacks blockchain. Donors gain confidence that their contributions make a difference, while charities can prove their impact immutably. The use of Clarity ensures secure, transparent, and auditable smart contracts.

## 📌 Example Workflow
1. A charity creates a campaign for clean water wells.
2. A donor sends 10 STX via `donation-manager.clar`.
3. The charity submits a photo hash of the completed well to `impact-proof.clar`.
4. The donor verifies the photo hash using `proof-verifier.clar`.
5. Funds are released to the charity via `fund-escrow.clar`.
6. The donor views impact metrics (e.g., number of wells built) via `donation-analytics.clar`.
