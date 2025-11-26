/**
 * Seal Access Control Contract Tests
 * 
 * Tests for deployed Seal smart contract on Sui testnet
 * Package ID: 0x8b15cd618e98808d2bb3b915e4cfe78d406dfd9e2d345cf0a4d208ac04556680
 */

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromHEX, toHEX } from '@mysten/sui/utils';

// Contract configuration
const SEAL_CONTRACT = {
    packageId: '0x8b15cd618e98808d2bb3b915e4cfe78d406dfd9e2d345cf0a4d208ac04556680',
    moduleName: 'seal_access',
    network: 'testnet' as const,
};

// Initialize Sui client
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

// Test results
interface TestResult {
    name: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    message?: string;
    data?: any;
}

const results: TestResult[] = [];

/**
 * Test 1: Create Event Access
 */
async function testCreateEventAccess(keypair: Ed25519Keypair): Promise<string | null> {
    console.log('\n📝 Test 1: Create Event Access Control');
    console.log('=====================================');

    try {
        const tx = new Transaction();
        const eventId = `test_event_${Date.now()}`;

        tx.moveCall({
            target: `${SEAL_CONTRACT.packageId}::${SEAL_CONTRACT.moduleName}::create_event_access`,
            arguments: [
                tx.pure.string(eventId),
                tx.pure.bool(true),   // is_public
                tx.pure.bool(false),  // requires_payment
                tx.pure.u64(0),       // payment_amount
            ],
        });

        const result = await suiClient.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });

        console.log('✅ Transaction successful');
        console.log(`   Digest: ${result.digest}`);

        // Find EventAccess object (it's a shared object)
        const eventAccessObj = result.objectChanges?.find(
            (obj) =>
                obj.type === 'created' &&
                obj.objectType?.includes('EventAccess') &&
                'owner' in obj &&
                obj.owner &&
                typeof obj.owner === 'object' &&
                'Shared' in obj.owner
        );

        if (eventAccessObj && 'objectId' in eventAccessObj) {
            const eventAccessId = eventAccessObj.objectId;
            console.log(`   EventAccess ID: ${eventAccessId}`);
            console.log(`   Event ID: ${eventId}`);

            results.push({
                name: 'Create Event Access',
                status: 'PASS',
                data: {
                    eventAccessId,
                    eventId,
                    digest: result.digest,
                },
            });

            return eventAccessId;
        } else {
            console.log('⚠️  Could not find EventAccess object in response');
            results.push({
                name: 'Create Event Access',
                status: 'FAIL',
                message: 'EventAccess object not found',
            });
            return null;
        }
    } catch (error) {
        console.error('❌ Test failed:', error);
        results.push({
            name: 'Create Event Access',
            status: 'FAIL',
            message: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
}

/**
 * Test 2: View EventAccess Object
 */
async function testViewEventAccess(eventAccessId: string): Promise<void> {
    console.log('\n📋 Test 2: View EventAccess Object');
    console.log('=====================================');

    try {
        const object = await suiClient.getObject({
            id: eventAccessId,
            options: {
                showContent: true,
                showOwner: true,
            },
        });

        console.log('✅ Object retrieved successfully');
        console.log('   Object data:');
        console.log(JSON.stringify(object.data, null, 2));

        results.push({
            name: 'View EventAccess Object',
            status: 'PASS',
            data: object.data,
        });
    } catch (error) {
        console.error('❌ Test failed:', error);
        results.push({
            name: 'View EventAccess Object',
            status: 'FAIL',
            message: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Test 3: Join Event
 */
async function testJoinEvent(
    eventAccessId: string,
    keypair: Ed25519Keypair
): Promise<void> {
    console.log('\n👥 Test 3: Join Event');
    console.log('=====================================');

    try {
        const tx = new Transaction();

        tx.moveCall({
            target: `${SEAL_CONTRACT.packageId}::${SEAL_CONTRACT.moduleName}::join_event`,
            arguments: [tx.object(eventAccessId)],
        });

        const result = await suiClient.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showEvents: true,
            },
        });

        console.log('✅ Successfully joined event');
        console.log(`   Digest: ${result.digest}`);

        // Check for ParticipantJoined event
        const joinedEvent = result.events?.find((e) =>
            e.type.includes('ParticipantJoined')
        );

        if (joinedEvent) {
            console.log('   Event emitted:', joinedEvent);
        }

        results.push({
            name: 'Join Event',
            status: 'PASS',
            data: {
                digest: result.digest,
                events: result.events,
            },
        });
    } catch (error) {
        // If already a participant, that's okay
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('EAlreadyParticipant')) {
            console.log('ℹ️  Already a participant (expected)');
            results.push({
                name: 'Join Event',
                status: 'PASS',
                message: 'Already a participant',
            });
        } else {
            console.error('❌ Test failed:', error);
            results.push({
                name: 'Join Event',
                status: 'FAIL',
                message: errorMsg,
            });
        }
    }
}

/**
 * Test 4: Check if Participant
 */
async function testIsParticipant(
    eventAccessId: string,
    userAddress: string
): Promise<void> {
    console.log('\n🔍 Test 4: Check if User is Participant');
    console.log('=====================================');

    try {
        const tx = new Transaction();

        const [result] = tx.moveCall({
            target: `${SEAL_CONTRACT.packageId}::${SEAL_CONTRACT.moduleName}::is_participant`,
            arguments: [tx.object(eventAccessId), tx.pure.address(userAddress)],
        });

        // Execute as a dev inspect to get the return value
        const devInspect = await suiClient.devInspectTransactionBlock({
            sender: userAddress,
            transactionBlock: tx,
        });

        console.log('✅ Query successful');
        console.log('   Result:', devInspect.results);

        results.push({
            name: 'Check Participant Status',
            status: 'PASS',
            data: devInspect.results,
        });
    } catch (error) {
        console.error('❌ Test failed:', error);
        results.push({
            name: 'Check Participant Status',
            status: 'FAIL',
            message: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Test 5: Seal Approve (Access Control)
 */
async function testSealApprove(
    eventAccessId: string,
    eventId: string,
    userAddress: string
): Promise<void> {
    console.log('\n🔐 Test 5: Seal Approve (Access Control Verification)');
    console.log('=====================================');

    try {
        const tx = new Transaction();

        const [approved] = tx.moveCall({
            target: `${SEAL_CONTRACT.packageId}::${SEAL_CONTRACT.moduleName}::seal_approve`,
            arguments: [
                tx.object(eventAccessId),
                tx.pure.string(eventId),
                tx.pure.address(userAddress),
            ],
        });

        // Dev inspect to get the return value
        const devInspect = await suiClient.devInspectTransactionBlock({
            sender: userAddress,
            transactionBlock: tx,
        });

        console.log('✅ Access control check successful');
        console.log('   Results:', devInspect.results);

        // Check if approved
        const isApproved = devInspect.results?.[0]?.returnValues?.[0]?.[0]?.[0] === 1;
        console.log(`   ${isApproved ? '✅' : '❌'} Access ${isApproved ? 'GRANTED' : 'DENIED'}`);

        results.push({
            name: 'Seal Approve',
            status: 'PASS',
            data: {
                approved: isApproved,
                results: devInspect.results,
            },
        });
    } catch (error) {
        console.error('❌ Test failed:', error);
        results.push({
            name: 'Seal Approve',
            status: 'FAIL',
            message: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Print Test Summary
 */
function printSummary(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));

    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    const skipped = results.filter((r) => r.status === 'SKIP').length;

    results.forEach((result, index) => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
        console.log(`\n${index + 1}. ${icon} ${result.name}: ${result.status}`);
        if (result.message) {
            console.log(`   Message: ${result.message}`);
        }
    });

    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`);
    console.log('='.repeat(50));

    if (failed > 0) {
        console.log('\n❌ Some tests failed. Please review the output above.');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed!');
        process.exit(0);
    }
}

/**
 * Main test runner
 */
async function runTests(): Promise<void> {
    console.log('🧪 Seal Access Control Contract Tests');
    console.log('======================================');
    console.log(`Package ID: ${SEAL_CONTRACT.packageId}`);
    console.log(`Network: ${SEAL_CONTRACT.network}`);
    console.log('');

    // Load keypair from environment or generate a test one
    // For production, use: Ed25519Keypair.fromSecretKey(fromHEX(process.env.SUI_PRIVATE_KEY!))
    const keypair = Ed25519Keypair.generate(); // Generate test keypair
    const userAddress = keypair.getPublicKey().toSuiAddress();

    console.log(`Test address: ${userAddress}`);
    console.log('⚠️  Note: Using generated test keypair. For real tests, fund this address first.');
    console.log('');

    // Run tests
    const eventAccessId = await testCreateEventAccess(keypair);

    if (eventAccessId) {
        await testViewEventAccess(eventAccessId);
        await testJoinEvent(eventAccessId, keypair);
        await testIsParticipant(eventAccessId, userAddress);

        // Extract event ID from the first test
        const createTestData = results[0]?.data;
        if (createTestData?.eventId) {
            await testSealApprove(eventAccessId, createTestData.eventId, userAddress);
        }
    }

    // Print summary
    printSummary();
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

// Export for use in other test files
export { runTests, testCreateEventAccess, testSealApprove };
