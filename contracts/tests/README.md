# Seal Contract Tests

TypeScript 测试套件，用于测试部署的 Seal 访问控制智能合约。

## 安装依赖

```bash
cd contracts/tests
npm install
```

## 运行测试

```bash
npm test
```

## 测试内容

### 1. Create Event Access
创建一个新的活动访问控制对象

### 2. View EventAccess Object
查看创建的 EventAccess 对象详情

### 3. Join Event
用户加入活动

### 4. Check Participant Status
检查用户是否是参与者

### 5. Seal Approve
测试访问控制验证（seal_approve 函数）

## 配置

测试使用的合约信息：

```typescript
const SEAL_CONTRACT = {
  packageId: '0x8b15cd618e98808d2bb3b915e4cfe78d406dfd9e2d345cf0a4d208ac04556680',
  moduleName: 'seal_access',
  network: 'testnet',
};
```

## 使用实际钱包测试

如果要使用实际的 Sui 钱包测试，修改测试文件：

```typescript
// 从环境变量加载私钥
import { fromHEX } from '@mysten/sui/utils';

const privateKey = process.env.SUI_PRIVATE_KEY!;
const keypair = Ed25519Keypair.fromSecretKey(fromHEX(privateKey));
```

然后设置环境变量：

```bash
export SUI_PRIVATE_KEY="your_private_key_hex"
npm test
```

## 输出示例

```
🧪 Seal Access Control Contract Tests
======================================
Package ID: 0x8b15cd618e98808d2bb3b915e4cfe78d406dfd9e2d345cf0a4d208ac04556680
Network: testnet

📝 Test 1: Create Event Access Control
=====================================
✅ Transaction successful
   Digest: ABC123...
   EventAccess ID: 0xDEF456...
   Event ID: test_event_1732345678

📋 Test 2: View EventAccess Object
=====================================
✅ Object retrieved successfully

👥 Test 3: Join Event
=====================================
✅ Successfully joined event

...

==================================================
📊 TEST SUMMARY
==================================================

1. ✅ Create Event Access: PASS
2. ✅ View EventAccess Object: PASS
3. ✅ Join Event: PASS
4. ✅ Check Participant Status: PASS
5. ✅ Seal Approve: PASS

==================================================
Total: 5 | Passed: 5 | Failed: 0 | Skipped: 0
==================================================

✅ All tests passed!
```

## 与前端集成

这些测试也可以在前端项目中使用。将测试文件复制到前端项目的 `tests` 目录：

```bash
cp contracts/tests/* frontbackend/tests/
```

## 故障排除

### 错误: "Insufficient gas"

确保测试地址有足够的 SUI 代币。从水龙头获取测试币：

- Discord: https://discord.gg/sui
- 频道: #testnet-faucet
- 命令: `!faucet <your-address>`

### 错误: "Object not found"

确保 Package ID 和 EventAccess ID 正确。

### 错误: "Module not found"

运行 `npm install` 安装依赖。
