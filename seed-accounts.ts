import { PrismaClient, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'
import qrcode from 'qrcode'

const db = new PrismaClient()

async function createSeedAccounts() {
  try {
    console.log('⏳ Start creating seed accounts...')

    // 1. Create ADMIN
    const admin = await db.user.upsert({
      where: { email: 'admin@banksampah.com' },
      update: {},
      create: {
        email: 'admin@banksampah.com',
        password: await bcrypt.hash('admin123', 10),
        name: 'Admin Utama',
        role: 'ADMIN',
        status: UserStatus.ACTIVE,
      },
    })

    // 2. Create UNIT
    const unitJakarta = await db.unit.upsert({
      where: { name: 'Bank Sampah Unit Jakarta Pusat' },
      update: {},
      create: {
        name: 'Bank Sampah Unit Jakarta Pusat',
        address: 'Jl. Merdeka No. 1, Jakarta Pusat',
        contactPerson: 'Ahmad Dahlan',
        phone: '081234567890',
      },
    })

    await db.user.upsert({
      where: { email: 'unit.jakarta@banksampah.com' },
      update: {},
      create: {
        email: 'unit.jakarta@banksampah.com',
        password: await bcrypt.hash('unit123', 10),
        name: 'Unit Jakarta Pusat',
        role: 'UNIT',
        status: UserStatus.ACTIVE,
        unitId: unitJakarta.id,
      },
    })

    // 3. Create NASABAH
    const nasabahData = [
      {
        email: 'budi@banksampah.com',
        password: 'nasabah123',
        name: 'Budi Santoso',
        phone: '081122334455',
        initialBalance: 150000,
      },
      {
        email: 'siti@banksampah.com',
        password: 'nasabah456',
        name: 'Siti Nurhaliza',
        phone: '085566778899',
        initialBalance: 275000,
      },
    ]

    for (const data of nasabahData) {
      const accountNo = 'NSB' + Date.now().toString().slice(-8) + Math.random().toString().slice(-2)
      const qrCode = await qrcode.toDataURL(accountNo)

      const user = await db.user.upsert({
        where: { email: data.email },
        update: {
            unitId: unitJakarta.id, // Ensure existing users are linked
        },
        create: {
          email: data.email,
          password: await bcrypt.hash(data.password, 10),
          name: data.name,
          phone: data.phone,
          role: 'NASABAH',
          status: UserStatus.ACTIVE,
          qrCode: qrCode,
          unitId: unitJakarta.id, // Link new user to the unit
        },
      })

      await db.nasabah.upsert({
        where: { userId: user.id },
        update: {
            unitId: unitJakarta.id, // Ensure existing nasabah are linked
        },
        create: {
          accountNo: accountNo,
          balance: data.initialBalance,
          userId: user.id,
          unitId: unitJakarta.id, // Link new nasabah to the unit
        },
      })
    }

    // 4. Create Waste Types
    const wasteTypes = [
        { name: 'Plastik', pricePerKg: 2500, unitId: unitJakarta.id },
        { name: 'Kertas', pricePerKg: 1500, unitId: unitJakarta.id },
        { name: 'Botol Kaca', pricePerKg: 800, unitId: unitJakarta.id },
        { name: 'Logam', pricePerKg: 5000, unitId: unitJakarta.id },
        { name: 'Kardus', pricePerKg: 1200, unitId: unitJakarta.id },
    ];

    for (const waste of wasteTypes) {
        await db.wasteType.upsert({
            where: { name_unitId: { name: waste.name, unitId: waste.unitId } },
            update: { pricePerKg: waste.pricePerKg },
            create: waste,
        });
    }

    console.log('\n')
    console.log('✅ Seed accounts created successfully!')
    console.log('\n📋 Account Details:')
    console.log('\n🔑 ADMIN ACCOUNT:')
    console.log('Email: admin@banksampah.com')
    console.log('Password: admin123')
    
    console.log('\n🏢 UNIT ACCOUNT:')
    console.log('Email: unit.jakarta@banksampah.com')
    console.log('Password: unit123')
    
    console.log('\n👥 NASABAH ACCOUNTS:')
    console.log('1. Budi Santoso')
    console.log('   Email: budi@banksampah.com')
    console.log('   Password: nasabah123')
    console.log('   Saldo: Rp150.000')
    
    console.log('2. Siti Nurhaliza')
    console.log('   Email: siti@banksampah.com')
    console.log('   Password: nasabah456')
    console.log('   Saldo: Rp275.000')

  } catch (error) {
    console.error('❌ Error creating seed accounts:', error)
  } finally {
    await db.$disconnect()
  }
}

createSeedAccounts()
