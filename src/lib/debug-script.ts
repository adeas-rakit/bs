'use strict';

/**
 * DEBUG SCRIPT
 * 
 * This script will attempt to perform the core database operation from the 
 * withdrawal rejection API endpoint in isolation. It will connect to the database, 
 * find the necessary records, and try to execute the update.
 * 
 * If this script fails, the error message will be highly specific to the 
 * database problem.
 */

import { db } from './db';

async function debugReject() {
  console.log("--- Starting Withdrawal Rejection Debug Script ---");

  try {
    // 1. Find a valid UNIT user to simulate as the processor
    console.log("1/4: Searching for a valid UNIT user...");
    const unitUser = await db.user.findFirst({
      where: {
        role: 'UNIT',
        unitId: {
          not: null
        }
      },
    });

    if (!unitUser || !unitUser.unitId) {
      console.error("❌ FAILED: Could not find any user with role 'UNIT' that is assigned to a unit. Please ensure at least one exists for testing.");
      return;
    }
    console.log(`  -> Found UNIT user: '${unitUser.name}' (ID: ${unitUser.id}) for Unit ID: ${unitUser.unitId}`);

    // 2. Find a PENDING withdrawal request for that user's unit
    console.log("2/4: Searching for a PENDING withdrawal request...");
    const withdrawalToTest = await db.withdrawalRequest.findFirst({
      where: {
        status: 'PENDING',
        unitId: unitUser.unitId,
      },
    });

    if (!withdrawalToTest) {
      console.error(`❌ FAILED: Could not find any PENDING withdrawal for Unit ID ${unitUser.unitId}. Please create a new withdrawal request from a Nasabah account for this unit to test the 'reject' functionality.`);
      return;
    }
    console.log(`  -> Found PENDING withdrawal to test: ID ${withdrawalToTest.id}, Amount: ${withdrawalToTest.amount}`);

    const idToUpdate = withdrawalToTest.id;
    const rejectionReasonForTest = "Debug script test at " + new Date().toISOString();

    // 3. Attempt the exact same update call from the API
    console.log("3/4: Attempting to update the withdrawal request in the database...");
    const updatedWithdrawal = await db.withdrawalRequest.update({
      where: { id: idToUpdate },
      data: {
        status: 'REJECTED',
        processedById: unitUser.id, 
        rejectionReason: rejectionReasonForTest,
      },
    });

    // 4. Verify the result
    console.log("4/4: Verifying the update...");
    if (updatedWithdrawal.status === 'REJECTED' && updatedWithdrawal.processedById === unitUser.id) {
        console.log("✅ SUCCESS! The database update operation was successful.");
        console.log("  -> Status correctly changed to REJECTED.");
        console.log(`  -> Processed by user ${updatedWithdrawal.processedById}.`);
        console.log(`  -> Rejection reason set to: '${updatedWithdrawal.rejectionReason}'`);
    } else {
        console.error("❌ FAILED: The update operation ran but the final data is incorrect.", updatedWithdrawal);
    }

  } catch (error) {
    console.error("❌ FATAL ERROR: The update operation threw an unhandled exception.");
    console.error("--- This is the root cause of the 500 Internal Server Error ---");
    console.error(error);
    console.error("---------------------------------------------------------------------");
  } finally {
    await db.$disconnect();
    console.log("--- Debug Script Finished ---");
  }
}

debugReject();
