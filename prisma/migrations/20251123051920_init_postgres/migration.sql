-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'UNIT', 'NASABAH');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('AKTIF', 'DITANGGUHKAN');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('AKTIF', 'DITANGGUHKAN');

-- CreateEnum
CREATE TYPE "WasteStatus" AS ENUM ('AKTIF', 'TIDAK_AKTIF');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "WithdrawalRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'NASABAH',
    "status" "UserStatus" NOT NULL DEFAULT 'AKTIF',
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notificationsLastReadAt" TIMESTAMP(3),
    "unitId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nasabah" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountNo" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "depositCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "unitId" TEXT,

    CONSTRAINT "nasabah_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waste_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerKg" INTEGER NOT NULL,
    "status" "WasteStatus" NOT NULL DEFAULT 'AKTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,

    CONSTRAINT "waste_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "wasteTypeId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_requests" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "WithdrawalRequestStatus" NOT NULL DEFAULT 'PENDING',
    "nasabahId" TEXT NOT NULL,
    "unitId" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unit_nasabah" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "nasabahId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "totalWeight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "unit_nasabah_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_qrCode_key" ON "users"("qrCode");

-- CreateIndex
CREATE UNIQUE INDEX "units_name_key" ON "units"("name");

-- CreateIndex
CREATE UNIQUE INDEX "nasabah_userId_key" ON "nasabah"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "nasabah_accountNo_key" ON "nasabah"("accountNo");

-- CreateIndex
CREATE UNIQUE INDEX "waste_types_name_unitId_key" ON "waste_types"("name", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transactionNo_key" ON "transactions"("transactionNo");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_requests_transactionId_key" ON "withdrawal_requests"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "unit_nasabah_unitId_nasabahId_key" ON "unit_nasabah"("unitId", "nasabahId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nasabah" ADD CONSTRAINT "nasabah_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_types" ADD CONSTRAINT "waste_types_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waste_types" ADD CONSTRAINT "waste_types_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_wasteTypeId_fkey" FOREIGN KEY ("wasteTypeId") REFERENCES "waste_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_nasabah" ADD CONSTRAINT "unit_nasabah_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_nasabah" ADD CONSTRAINT "unit_nasabah_nasabahId_fkey" FOREIGN KEY ("nasabahId") REFERENCES "nasabah"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unit_nasabah" ADD CONSTRAINT "unit_nasabah_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
