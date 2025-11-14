# 🏦 Bank Sampah - Aplikasi Digital Manajemen Bank Sampah

Aplikasi modern untuk mengelola bank sampah dengan sistem digital yang efisien dan user-friendly.

## ✨ Fitur Utama

### 🔑 **Autentikasi**
- Login/Register dengan deteksi otomatis jenis akun
- JWT token authentication
- QR Code generation untuk nasabah

### 👑 **Admin Dashboard**
- **Iktisar**: Statistik lengkap (unit, nasabah, transaksi, saldo)
- **Unit**: CRUD data Unit Bank Sampah
- **Transaksi**: Monitoring dengan filter (tanggal/bulan/tahun)
- **Pengguna**: Manajemen user dengan pencarian dan filter
- **Harga**: CRUD harga sampah terkini

### 🏢 **Unit Dashboard**
- **Iktisar**: Statistik dalam scope unit
- **Nasabah**: Manajemen data nasabah dengan edit status
- **Menabung**: Pencatatan tabungan dengan QR Scanner

### 👥 **Nasabah Dashboard**
- **Iktisar**: Saldo, capaian, dan statistik personal
- **Transaksi**: Riwayat dengan filter periode
- **Kartu**: Kartu digital dengan QR Code

## 🔐 **Akun Demo**

### **Admin**
- Email: `admin@banksampah.com`
- Password: `admin123`

### **Unit**
- Email: `unit.jakarta@banksampah.com`
- Password: `unit123`

### **Nasabah**

#### Budi Santoso
- Email: `budi@banksampah.com`
- Password: `nasabah123`
- Saldo: Rp150.000
- Total Sampah: 12.5 kg

#### Siti Nurhaliza
- Email: `siti@banksampah.com`
- Password: `nasabah456`
- Saldo: Rp275.000
- Total Sampah: 23.8 kg

## 🚀 **Cara Mengakses**

1. **Buka browser**: http://localhost:3000
2. **Lihat akun demo**: http://localhost:3000/demo-accounts
3. **Login**: Gunakan akun demo atau register akun baru
4. **Coba fitur**: Eksplorasi semua fitur sesuai role

## 📱 **UI/UX Features**
- ✅ Responsive design untuk mobile dan desktop
- ✅ Bottom navigation dengan Tab yang dinamis
- ✅ Real-time data update (30 detik)
- ✅ Toast notifications untuk feedback
- ✅ Modal/Sheet untuk input form
- ✅ Compact design tanpa top bar
- ✅ QR Scanner integration
- ✅ Auto-refresh data

## 🛠 **Teknologi**
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite
- **Authentication**: JWT
- **QR Scanner**: html5-qrcode
- **Real-time**: Custom hooks dengan polling

## 🔄 **Cara Kerja**

1. **Unit** scan QR Code nasabah untuk identifikasi cepat
2. **Pencatatan** multiple jenis sampah sekaligus
3. **Transaksi** tercatat lengkap dengan detail item
4. **Penarikan** minimal Rp. 50.000 dengan approval Unit
5. **Real-time update** otomatis untuk semua perubahan data

## 🎯 **Highlight Features**

- **QR Code Scanner**: Integrasi seamless untuk identifikasi nasabah
- **Real-time Dashboard**: Update otomatis setiap 30 detik
- **Multi-filter**: Pencarian dan filter berlapis untuk data
- **Responsive Design**: Optimal untuk mobile dan desktop
- **Role-based Access**: Akses dinamis sesuai jenis akun
- **Toast Notifications**: Feedback user-friendly untuk semua aksi
- **Compact Navigation**: Bottom tabs untuk kemudahan mobile
- **Data Persistence**: LocalStorage untuk session management
- **Auto-login**: Dari halaman demo accounts

---

**🎉 Aplikasi siap digunakan untuk demo atau implementasi nyata!**