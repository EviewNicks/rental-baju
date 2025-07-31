---
description: 
globs: 
alwaysApply: false
---
# Event-Driven Hybrid di Maguru

Dokumen ini menjelaskan implementasi Event-Driven Hybrid architecture pada proyek Maguru secara lebih detail.

## Konsep Dasar

Seperti yang dijelaskan dalam dokumen arsitektur utama, Maguru menggunakan pendekatan **Event-Driven Hybrid** untuk melengkapi komunikasi sinkron (Request/Response) dengan komunikasi asinkron berbasis event.

Konsep kuncinya meliputi:

- **Events:** Representasi dari sesuatu yang telah terjadi dalam sistem (misalnya, `UserCreated`, `ModulePublished`, `CommentAdded`). Events bersifat _immutable facts_.
- **Event Emitters/Publishers:** Komponen atau layanan yang memancarkan event ketika suatu aksi atau perubahan status penting terjadi.
- **Event Listeners/Subscribers:** Komponen atau layanan yang mendengarkan event tertentu dan bereaksi terhadapnya tanpa kopling langsung ke emitter.
- **Event Bus/Broker:** Mekanisme perantara yang merutekan event dari emitter ke listener. Dalam konteks monolit, ini bisa berupa in-memory event bus atau sistem yang lebih canggih seperti message queue eksternal jika diperlukan di masa depan. Pada frontend, React Context atau state management library juga dapat digunakan untuk mendistribusikan UI-specific events atau state changes.

## Penerapan dalam Maguru

- **Decoupling:** Fitur atau layanan dapat bereaksi terhadap perubahan di fitur lain tanpa memanggil service atau API-nya secara langsung. Contoh: Ketika sebuah `ModulePublished` (event dari fitur `manage-module`), fitur `notification-service` dapat mendengarkan event tersebut dan mengirim notifikasi tanpa fitur `manage-module` perlu tahu tentang `notification-service`.
- **Scalability & Responsiveness:** Tugas yang memakan waktu dapat ditangani asinkron oleh listener, membebaskan thread request/response.
- **Flexibility:** Mudah menambahkan listener baru yang bereaksi terhadap event yang sudah ada tanpa memodifikasi emitter.

## Implementasi Teknis

### Mekanisme Event Bus

Saat ini, Maguru menggunakan **in-memory event bus** sederhana yang diimplementasikan dengan library `mitt` (atau yang setara). Ini memungkinkan komponen dan service untuk memancarkan dan mendengarkan event tanpa ketergantungan langsung.

```typescript
// Contoh penggunaan event bus (simplified)
import mitt from 'mitt';

const emitter = mitt();

export default emitter;

// Di service yang memancarkan event
import emitter from './eventBus';

emitter.emit('module:published', { moduleId: '123' });

// Di service yang mendengarkan event
import emitter from './eventBus';

emitter.on('module:published', (data) => {
  // Lakukan sesuatu, misal kirim notifikasi
  console.log('Module published:', data.moduleId);
});
```

### Contoh Event dalam Sistem

Berikut adalah beberapa contoh event yang mungkin digunakan dalam Maguru:

- `auth:user-created`: Dipancarkan ketika user baru berhasil dibuat.
- `module:published`: Dipancarkan ketika modul pembelajaran dipublikasikan.
- `module:updated`: Dipancarkan ketika modul diperbarui.
- `page:created`: Dipancarkan ketika halaman baru dibuat dalam modul.
- `comment:added`: Dipancarkan ketika komentar baru ditambahkan.

### Contoh Penerapan pada Modul `manage-module`

Berikut adalah contoh bagaimana Event-Driven diterapkan pada modul `manage-module`:

**Event yang Dipancarkan:**

- `folder:created`: Dipancarkan ketika folder baru dibuat. Payload: `{ folderId: string, moduleId: string }`
- `page:created`: Dipancarkan ketika halaman baru dibuat. Payload: `{ pageId: string, folderId: string, moduleId: string }`
- `page:published`: Dipancarkan ketika halaman dipublikasikan. Payload: `{ pageId: string, moduleId: string }`
- `page:updated`: Dipancarkan ketika konten halaman diperbarui. Payload: `{ pageId: string, moduleId: string }`

**Event yang Didengarkan:**

- (Saat ini belum ada contoh konkret. Di masa depan, `manage-module` mungkin mendengarkan event `user:deleted` untuk membersihkan data terkait jika ada pemilik modul/halaman).

## Masa Depan: Message Queue

Untuk aplikasi yang lebih besar, in-memory event bus mungkin tidak cukup. Di masa depan, Maguru dapat menggunakan message queue eksternal seperti RabbitMQ atau Kafka untuk meningkatkan skalabilitas dan keandalan.

## Kesimpulan

Event-Driven Hybrid architecture memberikan fleksibilitas dan decoupling yang penting untuk pengembangan Maguru di masa depan. Dengan menggunakan event, kita dapat membuat fitur yang lebih responsif dan mudah dipelihara.
