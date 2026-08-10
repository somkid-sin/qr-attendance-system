# Test Accounts & Seed Data

ข้อมูลทดสอบสำหรับ Sprint 1 (walking skeleton) — **สำหรับ dev/ทดสอบเท่านั้น**
ค่าจริงตอน deploy ต้องใช้ secret ที่สุ่มใหม่และ Google credential จริง

## Teacher (ล็อกอินได้เลย)

ระบบมีอาจารย์คนเดียว ยืนยันตัวตนผ่าน environment variable (ไม่มีตาราง users)

| Field | ค่า (test) | ที่มา |
|---|---|---|
| อีเมล | `teacher@sru.ac.th` | `TEACHER_EMAIL` ใน `.env.local` |
| รหัสผ่าน | `demo1234` | `TEACHER_PASSWORD` ใน `.env.local` |

เข้าที่ `/login` → กรอกค่าด้านบน

## Students (master list — sheet `students`)

Sprint 1 **ยังไม่มี student login/หน้าสแกน** (เป็นงาน Sprint 2) นักศึกษาจึงมีอยู่
เฉพาะเป็นแถวใน master list (FR7) ที่ใช้ตอนสแกน/ทำรายงานในสปรินต์ถัดไป

รันสคริปต์เพื่อ seed ลง Google Sheet:

```bash
npm run seed
```

สคริปต์จะ (idempotent — รันซ้ำได้):
- สร้าง tab `students`, `sessions`, `attendance_log` ถ้ายังไม่มี พร้อม header ตาม
  [data-dictionary.md](../design/data-dictionary.md)
- เพิ่มนักศึกษาทดสอบต่อไปนี้ (ข้ามรายที่มีอยู่แล้ว)

| student_id | full_name |
|---|---|
| 6804681001001 | นายณัฐวุฒิ ราชฤทธิ์ |
| 6804681001002 | นางสาวปาริชาติ ศรีสุข |
| 6804681001003 | นายธนกร วงศ์เจริญ |
| 6804681001004 | นางสาวชนิกานต์ พรหมมา |
| 6804681001005 | นายอนุชา ทองดี |

> หมายเหตุ: schema `students` มีแค่ `student_id`, `full_name` (ไม่มีคอลัมน์
> section) ตาม data-dictionary — การแบ่งกลุ่มเรียนอยู่ที่ระดับ session

## ข้อกำหนดก่อนรัน seed

ต้องตั้งค่าใน `.env.local` (ดู `.env.example`):
`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEETS_ID`
และแชร์ Google Sheet ให้ service account (สิทธิ์ Editor)
