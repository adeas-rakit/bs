-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_nasabah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" REAL NOT NULL DEFAULT 0,
    "depositCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "unitId" TEXT,
    CONSTRAINT "nasabah_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "nasabah_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_nasabah" ("accountNo", "balance", "createdAt", "depositCount", "id", "totalWeight", "updatedAt", "userId") SELECT "accountNo", "balance", "createdAt", "depositCount", "id", "totalWeight", "updatedAt", "userId" FROM "nasabah";
DROP TABLE "nasabah";
ALTER TABLE "new_nasabah" RENAME TO "nasabah";
CREATE UNIQUE INDEX "nasabah_userId_key" ON "nasabah"("userId");
CREATE UNIQUE INDEX "nasabah_accountNo_key" ON "nasabah"("accountNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
