/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `units` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");
