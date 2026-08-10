# Sprint 1 — Walking Skeleton

## วันที่
2569-08-05

## เป้าหมาย
เชื่อม flow ตั้งแต่ อาจารย์ล็อกอิน → สร้าง session (ระบุกลุ่มเรียน) →
บันทึกลง Google Sheets → แสดง QR ให้ครบเป็นเส้นทางเดียว (walking skeleton)

## สิ่งที่ทำ (ตาม scope Sprint 1)
1. **หน้า login อาจารย์ (แบบง่าย)** — `app/login/`
   - ตรวจ credential กับ env (`TEACHER_EMAIL`, `TEACHER_PASSWORD`), เทียบแบบ
     constant-time, ออก cookie session แบบ HMAC-signed (`AUTH_SECRET`)
   - guard หน้า `/teacher/*` ด้วย `requireTeacher()`
2. **หน้าสร้าง session** — `app/teacher/sessions/new/`
   - ฟอร์มระบุ **กลุ่มเรียน (section) + วันที่ + คาบ**
   - บันทึกลง tab `sessions` ตาม schema data-dictionary (6 คอลัมน์ A–F:
     session_id, date, period, status=open, opened_at, closed_at ว่าง)
   - UC1 exception: ถ้ามี session ของกลุ่ม/วันเดิมอยู่แล้ว → เตือนและให้ไป
     session เดิม
3. **แสดง QR (token คงที่)** — `app/teacher/sessions/[sessionId]/`
   - QR เข้ารหัส URL เช็คอินในอนาคต + token
   - Token derive แบบ stateless ตาม ADR2 แต่ล็อกเป็น window `"static"`
     (ยังไม่หมุน — Sprint 2)

## การตัดสินใจสำคัญ
- **หลายกลุ่มเรียนโดยไม่แก้ schema**: encode section ลงใน `session_id` =
  `YYYYMMDD-<section>` (เช่น `20260812-N01`) — ตรงกับตัวอย่างใน data-dictionary
  พอดี จึงคง 6 คอลัมน์เดิมไว้ ไม่ต้องเพิ่มคอลัมน์ section
- **Google Sheets แบบไม่มี dependency หนัก**: เซ็น JWT ด้วย service-account
  private key (RS256 ผ่าน `node:crypto`) แลก access token แล้วเรียก REST API
  โดยตรง — เลี่ยง `googleapis` package
- **Secret จาก env เท่านั้น**: ไม่มี secret ใน source เลย (ดู `.env.example`)

## ยังไม่ทำ (ตาม scope — เป็น Sprint ถัดไป)
- หน้าสแกนของนักศึกษา (`/checkin`) + การเขียน `attendance_log`
- การหมุน token ทุก 15 วินาที + ตรวจ window ±1 (Sprint 2)
- รายงานสรุปมา/ขาด และหน้าสถิตินักศึกษา

## ปัญหาที่เจอ
- **Node เวอร์ชันบนเครื่องคือ v18.17.0 แต่ Next.js 16 ต้องการ ≥ 20.9.0** →
  `next build`/`next dev` รันไม่ได้ (ตรวจโค้ดผ่าน `tsc --noEmit` แทน)
  ต้องอัปเกรด Node ก่อนรันจริง/ deploy

## สิ่งที่เรียนรู้
- Next.js 16: request APIs (`cookies()`, `headers()`, `params`) เป็น async
  ทั้งหมด, mutation ใช้ Server Actions (`"use server"`) + `useActionState`

## วิธีรัน (หลังอัปเกรด Node ≥ 20.9)
1. `cp .env.example .env.local` แล้วกรอกค่า (teacher, secrets, Google SA, Sheet ID)
2. เตรียม Google Sheet ที่มี tab ชื่อ `sessions` และแชร์ให้ service account
3. `npm run dev` → เปิด `/login`
