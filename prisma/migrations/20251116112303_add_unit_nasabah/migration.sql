-- CreateTable
CREATE TABLE "unit_nasabah" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "unit_nasabah_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "unit_nasabah_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "unit_nasabah_unitId_nasabahId_key" ON "unit_nasabah"("unitId", "nasabahId");
