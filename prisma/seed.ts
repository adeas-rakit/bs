import bcrypt from 'bcryptjs';
import { db } from '@/lib/db'; 
import { UserStatus } from '@/generated/prisma/client';
async function createSeedAccounts() {
  try {
    console.log('⏳ Start creating seed accounts...')

    // 1. Create ADMIN
    const admin = await db.user.upsert({
      where: { email: 'admin@bs.id' },
      update: {},
      create: {
        email: 'admin@bs.id',
        password: await bcrypt.hash('admin@bs.id', 10),
        name: 'Admin Utama',
        role: 'ADMIN',
        status: UserStatus.AKTIF,
      },
    })

    // 2. Create Units and Nasabah

    // A.1. Create UNIT1
    const unit1 = await db.unit.upsert({
      where: { name: 'Bank Sampah Unit RT 1/1' },
      update: {},
      create: {
        name: 'Bank Sampah Unit RT 1/1',
        address: 'Jl. Bank Sampah Berhasil',
        phone: '087654321012',
        createdBy: { connect: { id: admin.id } },
      },
    })

    await db.user.upsert({
      where: { email: 'unit@bs.id' },
      update: {},
      create: {
        email: 'unit@bs.id',
        password: await bcrypt.hash('unit@bs.id', 10),
        name: 'Unit Setiawan',
        role: 'UNIT',
        status: UserStatus.AKTIF,
        unit: { connect: { id: unit1.id } },
      },
    })

    // A.1.1. Create NASABAH for UNIT1
    const nasabahData1 = [
      {
        email: 'ade@bs.id',
        password: 'ade@bs.id',
        name: 'Adeas',
        phone: '08987654321',
        initialBalance: 0,
      },
      {
        email: 'indri@bs.id',
        password: 'indri@bs.id',
        name: 'Indri',
        phone: '087658765433',
        initialBalance: 0,
      },
    ]

    for (const data of nasabahData1) {
      const accountNo = 'NSB' + Date.now().toString().slice(-8) + Math.random().toString().slice(-2)

      const user = await db.user.upsert({
        where: { email: data.email },
        update: {
          unit: { connect: { id: unit1.id } },
        },
        create: {
          email: data.email,
          password: await bcrypt.hash(data.password, 10),
          name: data.name,
          phone: data.phone,
          role: 'NASABAH',
          status: UserStatus.AKTIF,
          qrCode: accountNo,
          unit: { connect: { id: unit1.id } },
        },
      })

      await db.nasabah.upsert({
        where: { userId: user.id },
        update: {
          unit: { connect: { id: unit1.id } },
        },
        create: {
          accountNo: accountNo,
          balance: data.initialBalance,
          user: { connect: { id: user.id } },
          unit: { connect: { id: unit1.id } },
          createdBy: { connect: { id: admin.id } },
        },
      })
    }

    // A.2. Create UNIT2
    const unit2 = await db.unit.upsert({
      where: { name: 'Bank Sampah Unit RT 2/1' },
      update: {},
      create: {
        name: 'Bank Sampah Unit RT 2/1',
        address: 'Jl. Bank Sampah Sukses',
        phone: '087654321012',
        createdBy: { connect: { id: admin.id } },
      },
    })

    await db.user.upsert({
      where: { email: 'unit2@bs.id' },
      update: {},
      create: {
        email: 'unit2@bs.id',
        password: await bcrypt.hash('unit2@bs.id', 10),
        name: 'Unit2 Setiawan',
        role: 'UNIT',
        status: UserStatus.AKTIF,
        unit: { connect: { id: unit2.id } },
      },
    })

    // A.2.1. Create NASABAH for UNIT2
    const nasabahData2 = [
      {
        email: 'ade2@bs.id',
        password: 'ade2@bs.id',
        name: 'Adeas2',
        phone: '08987654321',
        initialBalance: 0,
      },
      {
        email: 'indri2@bs.id',
        password: 'indri2@bs.id',
        name: 'Indri2',
        phone: '087658765433',
        initialBalance: 0,
      },
    ]

    for (const data of nasabahData2) {
      const accountNo = 'NSB' + Date.now().toString().slice(-8) + Math.random().toString().slice(-2)

      const user = await db.user.upsert({
        where: { email: data.email },
        update: {
          unit: { connect: { id: unit2.id } },
        },
        create: {
          email: data.email,
          password: await bcrypt.hash(data.password, 10),
          name: data.name,
          phone: data.phone,
          role: 'NASABAH',
          status: UserStatus.AKTIF,
          qrCode: accountNo,
          unit: { connect: { id: unit2.id } },
        },
      })

      await db.nasabah.upsert({
        where: { userId: user.id },
        update: {
          unit: { connect: { id: unit2.id } },
        },
        create: {
          accountNo: accountNo,
          balance: data.initialBalance,
          user: { connect: { id: user.id } },
          unit: { connect: { id: unit2.id } },
          createdBy: { connect: { id: admin.id } },
        },
      })
    }

    // 3. Create Waste Types
    const wasteTypes1 = [
      { name: 'Plastik', pricePerKg: 2500, unitId: unit1.id },
      { name: 'Kertas', pricePerKg: 1500, unitId: unit1.id },
      { name: 'Botol Kaca', pricePerKg: 800, unitId: unit1.id },
      { name: 'Logam', pricePerKg: 5000, unitId: unit1.id },
      { name: 'Kardus', pricePerKg: 1200, unitId: unit1.id },
    ];

    const wasteTypes2 = [
      { name: 'Plastik', pricePerKg: 2600, unitId: unit2.id },
      { name: 'Kertas', pricePerKg: 1600, unitId: unit2.id },
      { name: 'Botol Kaca', pricePerKg: 900, unitId: unit2.id },
    ];

    const allWasteTypes = [...wasteTypes1, ...wasteTypes2];

    for (const waste of allWasteTypes) {
      await db.wasteType.upsert({
        where: { name_unitId: { name: waste.name, unitId: waste.unitId } },
        update: { pricePerKg: waste.pricePerKg },
        create: {
            name: waste.name,
            pricePerKg: waste.pricePerKg,
            unit: { connect: { id: waste.unitId } },
            createdBy: { connect: { id: admin.id } },
        },
      });
    }

    console.log('\n')
    console.log('✅ Seed accounts created successfully!')
  } catch (error) {
    console.error('❌ Error creating seed accounts:', error)
  } finally {
    await db.$disconnect()
  }
}

createSeedAccounts()
