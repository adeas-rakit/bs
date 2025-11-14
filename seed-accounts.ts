import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function createSeedAccounts() {
  try {
      // Create Admin Account
    const adminPassword = await bcrypt.hash('admin123', 10)
    
    const existingAdmin = await db.user.findUnique({
      where: { email: 'admin@banksampah.com' }
    })
    
    if (!existingAdmin) {
      await db.user.create({
        data: {
          email: 'admin@banksampah.com',
          password: adminPassword,
          name: 'Admin Bank Sampah',
          phone: '08123456789',
          role: 'ADMIN',
          status: 'AKTIF'
        }
      })
    }

    // Create Unit Account
    const unitPassword = await bcrypt.hash('unit123', 10)
    
    // Check if unit already exists
    let unit = await db.unit.findFirst({
      where: { name: 'Unit Pusat Jakarta' }
    })
    
    if (!unit) {
      unit = await db.unit.create({
        data: {
          name: 'Unit Pusat Jakarta',
          address: 'Jl. Sudirman No. 123, Jakarta Pusat',
          phone: '02112345678'
        }
      })
    }

    const existingUnitUser = await db.user.findUnique({
      where: { email: 'unit.jakarta@banksampah.com' }
    })
    
    if (!existingUnitUser) {
      await db.user.create({
        data: {
          email: 'unit.jakarta@banksampah.com',
          password: unitPassword,
          name: 'Petugas Unit Jakarta',
          phone: '08123456790',
          role: 'UNIT',
          status: 'AKTIF',
          unitId: unit.id
        }
      })
    }

    // Create Nasabah Account 1
    const nasabah1Password = await bcrypt.hash('nasabah123', 10)
    const nasabah1AccountNo = 'NSB' + Date.now().toString().slice(-8)
    
    const existingNasabah1 = await db.user.findUnique({
      where: { email: 'budi@banksampah.com' }
    })
    
    let nasabah1User
    if (!existingNasabah1) {
      nasabah1User = await db.user.create({
        data: {
          email: 'budi@banksampah.com',
          password: nasabah1Password,
          name: 'Budi Santoso',
          phone: '08123456791',
          role: 'NASABAH',
          status: 'AKTIF',
          unitId: unit.id
        }
      })
    } else {
      nasabah1User = existingNasabah1
    }

    const existingNasabah1Data = await db.nasabah.findUnique({
      where: { userId: nasabah1User.id }
    })
    
    if (!existingNasabah1Data) {
      await db.nasabah.create({
        data: {
          userId: nasabah1User.id,
          accountNo: nasabah1AccountNo,
          balance: 150000,
          totalWeight: 12.5,
          depositCount: 3
        }
      })
    }

    // Update QR Code for Nasabah 1
    const qrcode = await import('qrcode')
    const qrCode1 = await qrcode.toDataURL(nasabah1AccountNo)
    await db.user.update({
      where: { id: nasabah1User.id },
      data: { qrCode: qrCode1 }
    })

    // Create Nasabah Account 2
    const nasabah2Password = await bcrypt.hash('nasabah456', 10)
    const nasabah2AccountNo = 'NSB' + (Date.now() + 1).toString().slice(-8)
    
    const existingNasabah2 = await db.user.findUnique({
      where: { email: 'siti@banksampah.com' }
    })
    
    let nasabah2User
    if (!existingNasabah2) {
      nasabah2User = await db.user.create({
        data: {
          email: 'siti@banksampah.com',
          password: nasabah2Password,
          name: 'Siti Nurhaliza',
          phone: '08123456792',
          role: 'NASABAH',
          status: 'AKTIF',
          unitId: unit.id
        }
      })
    } else {
      nasabah2User = existingNasabah2
    }

    const existingNasabah2Data = await db.nasabah.findUnique({
      where: { userId: nasabah2User.id }
    })
    
    if (!existingNasabah2Data) {
      await db.nasabah.create({
        data: {
          userId: nasabah2User.id,
          accountNo: nasabah2AccountNo,
          balance: 275000,
          totalWeight: 23.8,
          depositCount: 5
        }
      })
    }

    // Update QR Code for Nasabah 2
    const qrCode2 = await qrcode.toDataURL(nasabah2AccountNo)
    await db.user.update({
      where: { id: nasabah2User.id },
      data: { qrCode: qrCode2 }
    })

    // Create Sample Waste Types
    const wasteTypes = [
      { name: 'Kertas', pricePerKg: 1500 },
      { name: 'Plastik', pricePerKg: 2000 },
      { name: 'Kaca', pricePerKg: 1000 },
      { name: 'Logam', pricePerKg: 5000 },
      { name: 'Kardus', pricePerKg: 1200 }
    ]

    for (const wasteType of wasteTypes) {
      const existingWasteType = await db.wasteType.findFirst({
        where: { name: wasteType.name }
      })
      
      if (!existingWasteType) {
        await db.wasteType.create({
          data: {
            name: wasteType.name,
            pricePerKg: wasteType.pricePerKg,
            status: 'AKTIF'
          }
        })
      }
    }

    // Create Sample Transactions
    const kertas = await db.wasteType.findFirst({ where: { name: 'Kertas' } })
    const plastik = await db.wasteType.findFirst({ where: { name: 'Plastik' } })
    const logam = await db.wasteType.findFirst({ where: { name: 'Logam' } })

    if (kertas && plastik && logam) {
      // Get nasabah data
      const nasabah1Data = await db.nasabah.findUnique({ where: { userId: nasabah1User.id } })
      const nasabah2Data = await db.nasabah.findUnique({ where: { userId: nasabah2User.id } })
      
      if (nasabah1Data) {
        // Sample transaction for Budi
        await db.transaction.create({
          data: {
            transactionNo: 'TRX' + Date.now().toString().slice(-8),
            nasabahId: nasabah1Data.id,
            unitId: unit.id,
            userId: existingUnitUser?.id || unitUser.id,
            type: 'DEPOSIT',
            totalAmount: 27500,
            totalWeight: 7.5,
            status: 'SUCCESS',
            notes: 'Tabungan rutin',
            items: {
              create: [
                {
                  wasteTypeId: kertas.id,
                  weight: 5.0,
                  amount: 5.0 * kertas.pricePerKg
                },
                {
                  wasteTypeId: plastik.id,
                  weight: 2.5,
                  amount: 2.5 * plastik.pricePerKg
                }
              ]
            }
          }
        })
      }

      if (nasabah2Data) {
        // Sample transaction for Siti
        await db.transaction.create({
          data: {
            transactionNo: 'TRX' + (Date.now() + 1).toString().slice(-8),
            nasabahId: nasabah2Data.id,
            unitId: unit.id,
            userId: existingUnitUser?.id || unitUser.id,
            type: 'DEPOSIT',
            totalAmount: 45000,
            totalWeight: 15.0,
            status: 'SUCCESS',
            notes: 'Tabungan besar',
            items: {
              create: [
                {
                  wasteTypeId: logam.id,
                  weight: 5.0,
                  amount: 5.0 * logam.pricePerKg
                },
                {
                  wasteTypeId: plastik.id,
                  weight: 10.0,
                  amount: 10.0 * plastik.pricePerKg
                }
              ]
            }
          }
        })
      }
    }

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