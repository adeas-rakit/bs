-- AlterTable
ALTER TABLE "users" ADD COLUMN "notificationsLastReadAt" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_withdrawal_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "nasabahId" TEXT NOT NULL,
    "unitId" TEXT,
    "transactionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "adminId" TEXT,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "withdrawal_requests_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "withdrawal_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_withdrawal_requests" ("adminId", "amount", "createdAt", "createdById", "id", "nasabahId", "status", "transactionId", "unitId", "updatedAt") SELECT "adminId", "amount", "createdAt", "createdById", "id", "nasabahId", "status", "transactionId", "unitId", "updatedAt" FROM "withdrawal_requests";
DROP TABLE "withdrawal_requests";
ALTER TABLE "new_withdrawal_requests" RENAME TO "withdrawal_requests";
CREATE UNIQUE INDEX "withdrawal_requests_transactionId_key" ON "withdrawal_requests"("transactionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
