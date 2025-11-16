/*
  Warnings:

  - You are about to drop the `waste_categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `wasteCategoryId` on the `waste_types` table. All the data in the column will be lost.
  - Added the required column `unitId` to the `waste_types` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "waste_categories_name_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "waste_categories";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_waste_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "pricePerKg" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AKTIF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "unitId" TEXT NOT NULL,
    CONSTRAINT "waste_types_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_waste_types" ("createdAt", "id", "name", "pricePerKg", "status", "updatedAt") SELECT "createdAt", "id", "name", "pricePerKg", "status", "updatedAt" FROM "waste_types";
DROP TABLE "waste_types";
ALTER TABLE "new_waste_types" RENAME TO "waste_types";
CREATE UNIQUE INDEX "waste_types_name_unitId_key" ON "waste_types"("name", "unitId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
