# Sistem Informasi Pariwisata Lampung (SIPALUNG)

| Nama                | NIM       |
| ------------------- | --------- |
| Andreas G Sihotang  | 121140168 |
| Ihsan Triyadi       | 121140163 |
| Ghaza M. Al Ghifari | 121140215 |
| Alfath Elnandra     | 121140175 |
| Abdur Rohman        | 121140136 |

## Deskripsi Proyek

SIPALUNG merupakan platform berbasis web yang berfungsi untuk memvisualisasikan berbagai objek wisata di Provinsi Lampung. Sistem ini menggunakan peta interaktif untuk membantu pengguna menelusuri lokasi wisata secara intuitif, menemukan rute, dan memperoleh informasi detail mengenai setiap titik maupun area wisata.

## Fitur Utama

1. **Peta Interaktif & Routing**

    - Peta dinamis dengan berbagai layer (OpenStreetMap, Satellite, Topographic)
    - Navigasi, penentuan rute, serta estimasi jarak dan waktu tempuh
    - Tampilan ikon marker yang berbeda untuk setiap kategori wisata

2. **Manajemen Data Wisata**

    - Penambahan titik lokasi wisata
    - Pembentukan area wisata dengan polygon
    - Perubahan data secara real-time

3. **Pencarian & Kategori**
    - Pencarian lokasi wisata dengan fitur auto-suggest
    - Filter kategori (misal Pantai, Taman, Museum, dll.)
    - Daftar wisata terorganisir untuk memudahkan eksplorasi

## Teknologi yang Digunakan

-   **Frontend**: HTML, CSS, JavaScript
-   **Backend**: Python (Flask)
-   **Database**: PostgreSQL dengan ekstensi PostGIS
-   **Map Library**: Leaflet.js
-   **Routing**: Leaflet Routing Machine

## Struktur Proyek

```
SistemInformasiGeografis/
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── addData.js
│   │   ├── category.js
│   │   ├── geolocation.js
│   │   ├── map.js
│   │   ├── popup.js
│   │   ├── routing.js
│   │   └── search.js
│   └── images/
├── templates/
│   └── index.html
├── app.py
├── config.py
└── README.md
```

## Instalasi dan Penggunaan

1. Clone repository ini
2. Install dependencies Python:
    ```bash
    pip install -r requirements.txt
    ```
3. Siapkan database PostgreSQL dengan PostGIS
4. Sesuaikan konfigurasi database di `config.py`
5. Jalankan aplikasi:
    ```bash
    python app.py
    ```

## Panduan Penggunaan

1. Pastikan semua dependensi (Flask, psycopg2, dll.) sudah diinstal.
2. Jalankan server dengan perintah:
    ```
    python app.py
    ```
3. Buka browser pada alamat http://127.0.0.1:5000
4. Gunakan sidebar untuk mencari dan memfilter lokasi wisata.
5. Klik "Login", "Tambah Titik", "Tambah Area", ataupun "Hapus Data" untuk mengupdate data wisata baru.
