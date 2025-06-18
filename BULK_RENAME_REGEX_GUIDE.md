
# Bulk Rename - Regex Guide

## Pengenalan Regex

Regular Expression (Regex) adalah pola pencarian yang powerful untuk menemukan dan mengganti teks. Fitur ini memungkinkan Anda untuk melakukan rename yang sangat fleksibel pada file-file Anda.

## Dasar-dasar Regex

### Karakter Khusus

| Karakter | Deskripsi | Contoh |
|----------|-----------|---------|
| `.` | Cocok dengan karakter apapun | `a.c` cocok dengan "abc", "axc" |
| `*` | 0 atau lebih karakter sebelumnya | `a*` cocok dengan "", "a", "aaa" |
| `+` | 1 atau lebih karakter sebelumnya | `a+` cocok dengan "a", "aaa" tapi tidak "" |
| `?` | 0 atau 1 karakter sebelumnya | `a?` cocok dengan "", "a" |
| `^` | Awal string | `^abc` cocok dengan "abc" di awal |
| `$` | Akhir string | `abc$` cocok dengan "abc" di akhir |

### Character Classes

| Pattern | Deskripsi | Contoh |
|---------|-----------|---------|
| `\d` | Digit (0-9) | `\d+` cocok dengan "123", "5" |
| `\w` | Word character (a-z, A-Z, 0-9, _) | `\w+` cocok dengan "hello", "test_123" |
| `\s` | Whitespace (space, tab, newline) | `\s+` cocok dengan " ", "   " |
| `[A-Z]` | Huruf kapital | `[A-Z]+` cocok dengan "HELLO" |
| `[a-z]` | Huruf kecil | `[a-z]+` cocok dengan "hello" |
| `[0-9]` | Digit (sama dengan \d) | `[0-9]+` cocok dengan "123" |

### Quantifiers

| Quantifier | Deskripsi |
|------------|-----------|
| `{n}` | Tepat n kali |
| `{n,}` | n kali atau lebih |
| `{n,m}` | Antara n sampai m kali |

## Contoh Penggunaan Praktis

### 1. Menghapus Angka dari Nama File

**Kasus:** File bernama "document_2023_final.pdf" → "document_final.pdf"

- **Find Pattern:** `_\d{4}`
- **Replace With:** *(kosong)*
- **Flags:** `g`

### 2. Mengganti Spasi dengan Underscore

**Kasus:** "my document.txt" → "my_document.txt"

- **Find Pattern:** `\s+`
- **Replace With:** `_`
- **Flags:** `g`

### 3. Menghapus Ekstensi File

**Kasus:** "document.pdf" → "document"

- **Find Pattern:** `\.[^.]+$`
- **Replace With:** *(kosong)*
- **Flags:** `g`

### 4. Mengubah Format Tanggal

**Kasus:** "report_2023-12-25.xlsx" → "report_25-12-2023.xlsx"

- **Find Pattern:** `(\d{4})-(\d{2})-(\d{2})`
- **Replace With:** `$3-$2-$1`
- **Flags:** `g`

### 5. Menambahkan Prefix pada File dengan Ekstensi Tertentu

**Kasus:** "image.jpg" → "photo_image.jpg"

- **Find Pattern:** `^(.+\.(jpg|jpeg|png))$`
- **Replace With:** `photo_$1`
- **Flags:** `gi`

### 6. Menghapus Karakter Khusus

**Kasus:** "file@#$%.txt" → "file.txt"

- **Find Pattern:** `[@#$%]`
- **Replace With:** *(kosong)*
- **Flags:** `g`

### 7. Mengubah Case dengan Capture Groups

**Kasus:** "myFile.TXT" → "MyFile.txt"

- **Find Pattern:** `^([a-z])(.+)\.([A-Z]+)$`
- **Replace With:** `${1.toUpperCase()}$2.${3.toLowerCase()}`
- **Flags:** `g`

## Flags Penting

| Flag | Deskripsi | Contoh |
|------|-----------|---------|
| `g` | Global - ganti semua match | Tanpa `g`: hanya yang pertama, dengan `g`: semua |
| `i` | Case insensitive | `test` akan cocok dengan "Test", "TEST", "test" |
| `m` | Multiline | `^` dan `$` berlaku untuk setiap baris |

## Tips untuk Pemula

### 1. Mulai Sederhana
Jangan langsung menggunakan regex yang kompleks. Mulai dengan pattern sederhana dan test dulu.

### 2. Gunakan Escape untuk Karakter Khusus
Jika ingin mencari karakter khusus secara literal, gunakan backslash:
- `.` → `\.`
- `+` → `\+`
- `*` → `\*`
- `?` → `\?`
- `[` → `\[`
- `]` → `\]`
- `(` → `\(`
- `)` → `\)`

### 3. Test Pattern Anda
Gunakan preview untuk melihat hasil sebelum apply ke semua file.

### 4. Backup Data
Selalu backup file penting sebelum melakukan bulk rename dengan regex.

## Contoh Skenario Lengkap

### Skenario: Merapikan Nama File Download

Anda memiliki file-file download dengan nama seperti:
- "Document (1).pdf"
- "Image_copy_2.jpg"
- "file-final-FINAL.docx"

**Tujuan:** Menjadi nama yang bersih tanpa karakter tidak perlu.

**Langkah 1: Hapus angka dalam kurung**
- Find: `\s*\(\d+\)`
- Replace: *(kosong)*

**Langkah 2: Hapus kata "copy" dan "final"**
- Find: `[_-]*(copy|final|FINAL)[_-]*`
- Replace: *(kosong)*
- Flags: `gi`

**Langkah 3: Bersihkan multiple underscore/dash**
- Find: `[-_]{2,}`
- Replace: `_`

## Troubleshooting

### Error "Invalid Regex"
- Periksa apakah ada karakter khusus yang tidak di-escape
- Pastikan kurung buka `(` memiliki pasangan kurung tutup `)`
- Periksa syntax quantifier seperti `{n,m}`

### Tidak Ada Match
- Coba test pattern dengan flag `i` untuk case insensitive
- Periksa apakah pattern terlalu spesifik
- Gunakan `.` untuk match karakter yang tidak pasti

### Replace Tidak Sesuai Harapan
- Periksa urutan capture groups `$1`, `$2`, dll.
- Pastikan menggunakan flag `g` untuk replace semua match
- Test dengan sample kecil terlebih dahulu

## Referensi Cepat

### Pattern Umum untuk Nama File

```
# Hapus angka
\d+

# Hapus spasi berlebih
\s{2,}

# Hapus karakter khusus kecuali titik dan underscore
[^a-zA-Z0-9._-]

# Match ekstensi file
\.[^.]+$

# Match nama file tanpa ekstensi
^(.+)\.[^.]+$

# Hapus duplicate words
\b(\w+)\s+\1\b
```

Selamat mencoba! Mulai dengan pattern sederhana dan explore fitur-fitur advanced setelah merasa nyaman.
