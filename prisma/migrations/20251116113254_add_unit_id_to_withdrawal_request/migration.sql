/*
  Warnings:

  - Added the required column `unitId` to the `withdrawal_requests` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_withdrawal_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "nasabahId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "adminId" TEXT,
    CONSTRAINT "withdrawal_requests_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_withdrawal_requests" ("adminId", "amount", "createdAt", "id", "nasabahId", "status", "transactionId", "updatedAt") SELECT "adminId", "amount", "createdAt", "id", "nasabahId", "status", "transactionId", "updatedAt" FROM "withdrawal_requests";
DROP TABLE "withdrawal_requests";
ALTER TABLE "new_withdrawal_requests" RENAME TO "withdrawal_requests";
CREATE UNIQUE INDEX "withdrawal_requests_transactionId_key" ON "withdrawal_requests"("transactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
