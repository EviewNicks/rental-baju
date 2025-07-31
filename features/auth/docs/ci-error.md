User Story 2: TSK-02
Title: Sebagai Owner, saya ingin dapat mengontrol akses fitur berdasarkan peran pengguna (Kasir, Producer, Owner) agar aplikasi aman.

Asumsi
Autentikasi sudah diimplementasikan (dari TSK-01).

Clerk mendukung otorisasi berbasis peran melalui custom claims.

Aplikasi menggunakan Next.js untuk routing dan middleware.

Detail
Konfigurasi custom claims di Clerk Dashboard untuk menyertakan atribut "role" dengan nilai Kasir, Producer, atau Owner.

Mengambil informasi peran dari session claims di aplikasi untuk digunakan dalam logika otorisasi.

Mengimplementasikan middleware untuk membatasi akses ke rute atau fitur tertentu berdasarkan peran pengguna, dengan fokus pada peran Admin untuk sprint ini.

Kriteria Penerimaan
Given custom claims untuk peran Admin, Producer, dan Owner dikonfigurasi di Clerk Dashboard, When pengguna masuk, Then aplikasi dapat mengidentifikasi peran mereka.

Given saya adalah pengguna dengan peran Kasir, When saya mencoba mengakses fitur Kasir, Then saya diizinkan untuk mengaksesnya.

Given saya adalah pengguna non-Admin, When saya mencoba mengakses fitur admin, Then saya ditolak akses.

Given sistem otorisasi diimplementasikan, Then sistem mendukung penambahan peran Producer dan Owner di masa depan tanpa perubahan besar.

Flowchart
Start -> [User Logs In] -> [Get User Role from Claims] -> <Is Role Admin?> -> [Yes] -> [Allow Access to Admin Features] -> End

[No] -> [Deny Access to Admin Features] -> End

Evaluasi INVEST
Kriteria

Evaluasi

Independent

Bergantung pada TSK-01 untuk autentikasi, tetapi dapat diimplementasikan setelah autentikasi selesai.

Negotiable

Dapat didiskusikan, misalnya metode otorisasi atau fitur admin spesifik.

Valuable

Memastikan keamanan dengan kontrol akses berbasis peran.

Estimable

Dapat diestimasi dengan total 11 jam berdasarkan task breakdown.

Small

Dapat diselesaikan dalam satu sprint.

Testable

Dapat diuji dengan skenario akses untuk berbagai peran.

Tasks untuk TSK-02
Task 2.1: Mengonfigurasi Custom Claims di Clerk Dashboard
Task ID: T:02.1

Kaitan User Story: US:02

Deskripsi Detail: Mengatur custom claims di Clerk Dashboard untuk menyertakan atribut "role" dengan nilai Admin, Producer, dan Owner.

Checklist:

Akses Clerk Dashboard melalui akun admin.

Konfigurasi custom claims untuk atribut "role" dengan nilai yang sesuai.

Buat pengguna tes dengan peran Admin, Producer, dan Owner untuk verifikasi.

Estimasi Effort: 2 jam

Owner: [Nama Pengembang]

Definition of Done:

Custom claims untuk peran Admin, Producer, dan Owner dikonfigurasi di Clerk.

Pengguna tes memiliki peran yang benar sesuai konfigurasi.

Dependensi: TSK-01 (autentikasi sudah diimplementasikan).

Catatan Tambahan: Dokumentasikan konfigurasi claims untuk referensi tim.

Task 2.2: Mengambil "role" dari Session Claims di Aplikasi
Task ID: T:02.2

Kaitan User Story: US:02

Deskripsi Detail: Memodifikasi aplikasi untuk mengambil atribut "role" dari session claims yang disediakan oleh Clerk untuk digunakan dalam logika otorisasi.

Checklist:

Integrasikan Clerk session management di aplikasi Next.js.

Gunakan Clerk SDK untuk mengakses dan mem-parsing session claims.

Uji pengambilan peran untuk pengguna tes dengan peran berbeda.

Estimasi Effort: 3 jam

Owner: [Nama Pengembang]

Definition of Done:

Aplikasi dapat mengambil atribut "role" dari session claims.

Peran tersedia untuk digunakan dalam logika otorisasi.

Dependensi: T:02.1 (custom claims sudah dikonfigurasi).

Catatan Tambahan: Pastikan data peran ditangani dengan aman untuk mencegah manipulasi.

Task 2.3: Mengimplementasikan Middleware Otorisasi Berdasarkan "role"
Task ID: T:02.3

Kaitan User Story: US:02

Deskripsi Detail: Membuat middleware di Next.js yang memeriksa peran pengguna dan membatasi akses ke rute atau fitur tertentu, dengan fokus pada fitur admin.

Checklist:

Desain logika otorisasi berdasarkan peran.

Implementasikan middleware untuk memeriksa atribut "role" dari session claims.

Terapkan middleware ke rute admin (misalnya, /admin/*).

Uji kontrol akses dengan pengguna Admin dan non-Admin.

Estimasi Effort: 6 jam

Owner: [Nama Pengembang]

Definition of Done:

Middleware otorisasi diimplementasikan dan berfungsi.

Fitur admin hanya dapat diakses oleh pengguna dengan peran Admin.

Pengguna non-Admin menerima respons penolakan (misalnya, 403 Forbidden).

Dependensi: T:02.1 dan T:02.2 (claims dikonfigurasi dan dapat diambil).

Catatan Tambahan: Pastikan middleware fleksibel untuk mendukung peran Producer dan Owner di sprint berikutnya.