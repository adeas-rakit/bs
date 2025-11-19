# Bank Sampah Digital

Aplikasi ini adalah platform digital untuk mengelola operasional bank sampah, mengubah sistem konvensional menjadi lebih modern, efisien, dan transparan.

## Apa itu Sistem Bank Sampah?

Bank sampah adalah sebuah inisiatif pengelolaan sampah berbasis komunitas dengan konsep seperti perbankan. Warga (disebut "nasabah") menyetorkan sampah anorganik yang sudah dipilah (seperti plastik, kertas, logam) ke sebuah lokasi (disebut "unit"). Sampah tersebut akan ditimbang dan dihargai sesuai jenisnya. Nilai dari sampah tersebut kemudian dimasukkan ke dalam rekening tabungan nasabah.

Tujuan utama dari sistem ini adalah:
1.  **Mengurangi Sampah**: Mengurangi volume sampah yang berakhir di Tempat Pembuangan Akhir (TPA).
2.  **Edukasi Lingkungan**: Mendidik masyarakat tentang pentingnya memilah sampah.
3.  **Nilai Ekonomi**: Memberikan insentif ekonomi kepada masyarakat dari sampah yang mereka kumpulkan.

## Bagaimana Sistem Digital Ini Bekerja?

Aplikasi ini mendigitalisasi seluruh proses tersebut dengan tiga peran utama: **Nasabah**, **Unit**, dan **Admin**.

### 1. Alur Nasabah (Warga Penabung Sampah)
- **Pendaftaran**: Nasabah mendaftar dan mendapatkan akun digital beserta Kartu Anggota dengan QR Code unik.
- **Menabung Sampah**: Nasabah datang ke Unit Bank Sampah terdekat membawa sampah yang sudah dipilah.
- **Pencatatan Transaksi**: Petugas Unit akan memindai (scan) QR Code nasabah, lalu menimbang dan mencatat jenis serta berat sampah yang disetor.
- **Saldo Bertambah**: Nilai sampah akan otomatis dikonversi menjadi saldo rupiah dan masuk ke akun nasabah.
- **Monitoring & Penarikan**: Nasabah dapat memantau riwayat transaksi, melihat total saldo, dan mengajukan permintaan penarikan saldo (withdraw) melalui aplikasi.

### 2. Alur Unit (Titik Pengumpul Sampah)
- **Manajemen Nasabah**: Mengelola data nasabah yang terdaftar di unitnya.
- **Pencatatan Setoran**: Melakukan proses "menabung" untuk nasabah dengan memindai QR Code dan menginput data sampah. Proses ini menggantikan pencatatan manual di buku.
- **Approval Penarikan**: Memverifikasi dan menyetujui permintaan penarikan saldo dari nasabah.
- **Operasional**: Memantau total sampah terkumpul dan statistik operasional lainnya di lingkup unitnya.

### 3. Alur Admin (Pengelola Utama)
- **Supervision**: Admin memiliki akses penuh untuk memantau seluruh aktivitas sistem.
- **Manajemen Data Master**: Mengelola data utama seperti daftar semua Unit, Pengguna (Admin, Petugas Unit), dan harga dasar untuk setiap jenis sampah.
- **Monitoring Transaksi**: Melihat seluruh riwayat transaksi yang terjadi di semua unit.
- **Analitik**: Mendapatkan gambaran besar (overview) mengenai total nasabah, total saldo beredar, dan volume sampah secara keseluruhan.

---

## ✨ Fitur Unggulan Aplikasi

- **Autentikasi Multi-peran**: Login tunggal yang secara otomatis mengarahkan pengguna ke dashboard sesuai perannya (Admin, Unit, atau Nasabah).
- **QR Code Scanner**: Mempercepat proses identifikasi nasabah dan pencatatan sampah di Unit.
- **Dashboard Real-time**: Data statistik di setiap dashboard (Admin, Unit, Nasabah) diperbarui secara otomatis untuk menyajikan informasi terkini.
- **Manajemen Terpusat**: Kemudahan bagi Admin untuk mengelola unit, pengguna, dan harga sampah dari satu tempat.
- **Riwayat & Laporan**: Nasabah dan Unit dapat dengan mudah melacak riwayat transaksi dengan filter periode.
- **Desain Responsif**: Tampilan yang dioptimalkan untuk perangkat mobile maupun desktop.

## 🛠 Teknologi yang Digunakan
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Token)
- **QR Scanner**: `html5-qrcode`

## 🔐 Akun Demo Untuk Mencoba

### **Set Akun Demo**
- npx tsx seed-accounts.ts
