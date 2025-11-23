# Walrus Events - Sui Move Contracts

Sui Move智能合约，用于将事件数据锚定到Sui区块链。

## 📁 项目结构

```
contracts/walrus_events/
├── Move.toml           # 包配置文件
├── sources/            # Move源代码
│   └── event_anchor.move   # 事件锚定合约
└── README.md           # 本文档
```

## 🎯 合约功能

### EventAnchor 对象

存储在链上的事件锚定记录：
- `event_id`: 事件唯一标识符
- `organizer`: 事件组织者地址
- `event_hash`: 事件数据的SHA256哈希
- `blob_id`: Walrus存储的blob ID
- `created_at`: 创建时间戳

### 主要函数

#### 1. `anchor_event` - 锚定新事件

```move
public entry fun anchor_event(
    event_id: vector<u8>,
    event_hash: vector<u8>,  // 64位十六进制SHA256哈希
    blob_id: vector<u8>,      // Walrus blob ID
    ctx: &mut TxContext
)
```

**作用**: 创建新的EventAnchor对象并转移给调用者

#### 2. `update_event` - 更新事件

```move
public entry fun update_event(
    anchor: &mut EventAnchor,
    new_event_hash: vector<u8>,
    new_blob_id: vector<u8>,
    ctx: &mut TxContext
)
```

**作用**: 更新现有事件（仅组织者可更新）

#### 3. View Functions - 查询函数

- `get_event_id()` - 获取事件ID
- `get_organizer()` - 获取组织者地址
- `get_event_hash()` - 获取事件哈希
- `get_blob_id()` - 获取Walrus blob ID
- `get_created_at()` - 获取创建时间

## 🚀 部署指南

### 前置要求

1. 安装Sui CLI:
   ```bash
   cargo install --locked --git https://github.com/MystenLabs/sui.git --branch testnet sui
   ```

2. 创建Sui钱包（如果没有）:
   ```bash
   sui client new-address ed25519
   ```

3. 获取测试网代币:
   访问 https://faucet.testnet.sui.io

### 编译合约

```bash
cd contracts/walrus_events
sui move build
```

### 测试合约

```bash
sui move test
```

### 部署到测试网

```bash
sui client publish --gas-budget 100000000
```

**记录输出的Package ID和Module地址！**

示例输出：
```
Published Objects:
  PackageID: 0x123abc...
  
Transaction Digest: xyz789...
```

### 调用合约

#### 锚定事件

```bash
sui client call \
  --package <PACKAGE_ID> \
  --module event_anchor \
  --function anchor_event \
  --args \
    "event_001" \
    "a1b2c3d4..." \  # 64字符SHA256哈希
    "walrus_blob_xyz" \
  --gas-budget 10000000
```

## 🔗 前端集成

### TypeScript示例

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

// 锚定事件到Sui
const anchorEvent = async (
  eventId: string,
  eventHash: string,
  blobId: string
) => {
  const tx = new Transaction();
  
  tx.moveCall({
    target: `${PACKAGE_ID}::event_anchor::anchor_event`,
    arguments: [
      tx.pure.string(eventId),
      tx.pure.string(eventHash),
      tx.pure.string(blobId),
    ],
  });
  
  const result = await signAndExecuteTransaction({
    transaction: tx,
  });
  
  return result.digest;
};
```

## 📊 事件监听

合约会发出以下事件：

### EventAnchored
```json
{
  "event_id": "evt_001",
  "organizer": "0xabcd...",
  "event_hash": "a1b2c3...",
  "blob_id": "walrus_blob_xyz",
  "timestamp": 12345
}
```

### EventUpdated
```json
{
  "event_id": "evt_001",
  "old_hash": "old_hash_xyz",
  "new_hash": "new_hash_abc",
  "new_blob_id": "new_blob_123",
  "timestamp": 12346
}
```

## 🔐 安全特性

- ✅ 只有事件组织者可以更新事件
- ✅ 输入验证（哈希长度必须为64字符）
- ✅ 不可变的组织者地址
- ✅ 链上时间戳记录

## 📝 更新合约

修改合约后重新部署：

```bash
# 1. 编译
sui move build

# 2. 测试
sui move test

# 3. 部署新版本
sui client publish --gas-budget 100000000

# 4. 更新前端/后端的PACKAGE_ID
```

## 🌐 浏览器验证

部署后可在Sui浏览器查看：

**Testnet**: `https://testnet.suivision.xyz/object/<PACKAGE_ID>`

**Mainnet**: `https://suivision.xyz/object/<PACKAGE_ID>`

## 📚 参考资源

- [Sui Move Book](https://move-book.com/)
- [Sui Documentation](https://docs.sui.io/)
- [Sui Move Examples](https://github.com/MystenLabs/sui/tree/main/examples)
- [Walrus Documentation](https://docs.wal.app/)

---

**注意**: 
- 测试网合约可随时重置，mainnet部署前请充分测试
- 记录并妥善保管Package ID
- 定期备份合约代码
