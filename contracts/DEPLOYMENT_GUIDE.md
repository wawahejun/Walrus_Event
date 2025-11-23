# Sui Move Contract Deployment Guide

## 📋 Prerequisites

### 1. Install Sui CLI

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Sui CLI
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
```

### 2. Create Sui Wallet (if needed)

```bash
# Initialize Sui client
sui client

# Create new address
sui client new-address ed25519

# Get testnet tokens
sui client faucet
```

---

## 🚀 Deploy Contract

### Step 1: Build Contract

```bash
cd /home/wawahejun/Walrus_Event/contracts/walrus_events
sui move build
```

**Expected output:**
```
BUILDING walrus_events
INCLUDING DEPENDENCY Sui
INCLUDING DEPENDENCY MoveStdlib
BUILDING walrus_events
```

### Step 2: Test Contract (Optional)

```bash
sui move test
```

### Step 3: Deploy to Testnet

```bash
sui client publish --gas-budget 100000000
```

**Expected output:**
```
Transaction Digest: AbCdEf123...
╭──────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                       │
├──────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                     │
│  ┌──                                                                │
│  │ ObjectID: 0x1234...                                             │
│  │ Sender: 0xabcd...                                               │
│  │ Owner: Immutable                                                │
│  │ ObjectType: 0x2::package::UpgradeCap                           │
│  └──                                                                │
│ Published Objects:                                                  │
│  ┌──                                                                │
│  │ PackageID: 0x5678abcd...  ← **COPY THIS**                      │
│  │ Version: 1                                                      │
│  │ Digest: ...                                                     │
│  └──                                                                │
╰──────────────────────────────────────────────────────────────────────╯
```

### Step 4: Record Package ID

**IMPORTANT:** Copy the `PackageID` from the output!

Example: `0x5678abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456`

---

## ⚙️ Configuration

### Backend Configuration

Edit `/home/wawahejun/Walrus_Event/.env`:

```bash
# Add this line
SUI_PACKAGE_ID=0x5678abcdef...  # Your actual Package ID
```

### Frontend Configuration

Create `/home/wawahejun/Walrus_Event/frontbackend/.env.local`:

```bash
VITE_SUI_PACKAGE_ID=0x5678abcdef...  # Same Package ID
```

---

## ✅ Verify Deployment

### 1. Check on Sui Explorer

```
https://testnet.suivision.xyz/object/0x5678abcdef...
```

Replace `0x5678abcdef...` with your actual Package ID.

### 2. Test Contract Call

```bash
# View contract functions
sui client call --help

# Example: Call anchor_event
sui client call \
  --package 0x5678abcdef... \
  --module event_anchor \
  --function anchor_event \
  --args \
    "event_test_001" \
    "a1b2c3d4e5f6789012345678901234567890123456789012345678901234" \
    "walrus_blob_test_xyz" \
  --gas-budget 10000000
```

---

## 🔄 Restart Services

After updating config:

```bash
# Restart backend
cd /home/wawahejun/Walrus_Event
# Ctrl+C to stop python main.py
python main.py

# Restart frontend
cd /home/wawahejun/Walrus_Event/frontbackend
# Ctrl+C to stop npm run dev
npm run dev
```

---

## 🎯 Test End-to-End

1. Open browser: `http://localhost:5173`
2. Connect Sui wallet
3. Create an event
4. Watch for:
   - ✅ Walrus upload (blob_id)
   - ✅ Sui transaction popup
   - ✅ Sign transaction
   - ✅ Success message with tx digest

5. Verify on blockchain:
   ```
   https://testnet.suivision.xyz/txblock/<your_tx_digest>
   ```

---

## 📝 Troubleshooting

### "Insufficient gas"
```bash
# Get more test SUI
sui client faucet
```

### "Package not found"
- Double-check Package ID in `.env` files
- Restart both backend and frontend

### "Transaction failed"
- Check wallet has sufficient SUI balance
- Verify event_hash is exactly 64 characters

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ `sui client publish` returns Package ID
- ✅ Frontend console shows: "✅ Sui transaction successful"
- ✅ Sui Explorer shows EventAnchor object
- ✅ Event details show blockchain verification badge

---

Ready to deploy? Run the commands above and update me with your Package ID!
