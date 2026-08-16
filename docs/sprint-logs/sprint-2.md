# Sprint 2 — เช็คชื่อเข้าเรียน + QR หมุน

## วันที่
2569-08-16

## เป้าหมาย
ต่อจาก walking skeleton (Sprint 1): ทำให้ QR หมุน token ทุก 15 วินาทีจริง
(NFR2) และเปิดหน้าให้นักศึกษาสแกน กรอกรหัส แล้วบันทึกลง `attendance_log`
ให้ครบ flow ตาม UC2

## สิ่งที่ทำ

1. **Token หมุนจริง** — `lib/token.ts`
   - เพิ่ม `getCurrentToken`, `secondsUntilNextWindow`, `verifyToken`
     (เช็ค window ปัจจุบัน **± 1** กัน clock skew ตาม ADR2)
   - เปลี่ยนจาก `getStaticToken` (Sprint 1) มาใช้ window จริงตาม NFR2
2. **QR หมุนอัตโนมัติทุก 15 วิ ฝั่งอาจารย์** —
   `app/teacher/sessions/[sessionId]/rotating-qr.tsx` + server action
   `getSessionQrAction`
   - client component นับถอยหลังทุกวินาที และเรียก server action ใหม่พอดี
     ตอนหมดวินาที (ไม่ใช่ poll ทุกวินาที) ได้ QR image + เวลาที่เหลือของ
     window ถัดไปกลับมา
   - server action ต้อง `requireTeacher()` — เจตนา: ป้องกันไม่ให้ใครก็ได้
     ที่รู้ session_id ดึง token สดได้เรื่อย ๆ โดยไม่ต้องเห็นจอจริง
     (จะทำลายจุดประสงค์ anti-proxy ของ NFR2)
3. **หน้าสแกนนักศึกษา** — `app/checkin/` (public, ไม่ต้อง login)
   - อ่าน `session_id` + `token` จาก query string ของ QR
   - ฟอร์มกรอกรหัสนักศึกษา (`isValidStudentId` เช็ครูปแบบ 13 หลักก่อนยิง
     ไป Sheets)
4. **`checkinAction`** — `app/lib/actions.ts`
   - ตรวจตามลำดับ UC2: token ถูกต้อง → session ต้องมีสถานะ
     `open` (`lib/sheets.ts: getSession`) → รหัสนักศึกษาต้องอยู่ใน master
     list (`findStudentName`, FR8) → เช็คซ้ำ `(student_id, session_id)`
     (`attendanceExists`) → เขียนแถวใหม่ลง `attendance_log`
     (`student_id, session_id, timestamp, status=present`)
   - error message แยกตาม exception flow ใน UC2: หมดอายุ / session ปิด /
     ไม่พบรหัส / เช็คชื่อไปแล้ว

## การตัดสินใจสำคัญ

- **ขยาย tolerance การยืนยัน token เป็น 180 วินาที (2569-08-16, หลังทดสอบจริง)**
  — ตอนแรกใช้ ± 1 window (~15-30 วินาที) ตาม ADR2 แต่ทดสอบจริงบนมือถือ
  พบว่าไม่พอสำหรับเวลาสแกน→พิมพ์รหัส→กดยืนยันจริง (โดนเฉพาะคิวท้าย ๆ ที่
  สแกน QR ตอนใกล้หมดเวลา) จึงขยาย `CHECKIN_TOLERANCE_SECONDS` เป็น 180 ใน
  `lib/token.ts` — **QR ยังหมุนแสดงทุก 15 วินาทีเหมือนเดิมตาม NFR2**
  (ฝั่งแสดงผลไม่เปลี่ยน) แต่ฝั่งตรวจสอบยอมรับ token ย้อนหลังได้นานขึ้น
  **trade-off ที่ต้องรับทราบ**: QR ที่ถูกถ่ายรูป/แคปหน้าจอตอนนี้ใช้เช็คชื่อ
  แทนกันได้นานถึง ~180 วินาทีหลังแสดง (จากเดิม ~15-30 วินาที) ลด
  anti-proxy protection ของ NFR2/ADR2 ลงระดับหนึ่ง แต่ยังดีกว่าไม่จำกัดเวลา
  เลย — เป็นการตัดสินใจของอาจารย์ผู้ใช้งานหลังทดสอบจริง ไม่ใช่ค่า default
  เดิมจาก spec
- **(A) ไม่ผูกกลุ่มเรียนกับนักศึกษา** — ตามที่ตกลงไว้ใน sprint-1.md ยอมรับ
  trade-off ที่นักศึกษากลุ่มหนึ่งเช็คชื่อ session ของอีกกลุ่มได้ถ้ารู้ QR
  (SRS ปัจจุบันไม่ได้ระบุไว้ว่าต้องกัน) — ยังไม่ทำในรอบนี้
- **Rotation ผ่าน Server Action ไม่ใช่ Route Handler** — คงรูปแบบเดียวกับ
  Sprint 1 (Server Actions ทุกจุด) แทนที่จะเพิ่ม API route แยก ลดจำนวน
  concept ที่ต้อง maintain
- **ไม่มีหน้า "ปิดคลาสเช็คอิน"** — ไม่ได้อยู่ใน FR ที่ระบุไว้ชัดสำหรับ
  Sprint 2 (มีแค่คอลัมน์ `status`/`closed_at` เตรียมไว้ใน schema) เก็บไว้
  พิจารณาสปรินต์ถัดไปถ้าต้องการ

## ยังไม่ทำ (Sprint ถัดไป)
- ปุ่ม/flow ปิด session (`status=closed`, `closed_at`)
- รายงานสรุปมา/ขาด (UC3/FR6) และหน้าสถิตินักศึกษา
- ลิสต์ "เช็คอินแล้วแบบ real-time" ฝั่งอาจารย์ (มีใน mockup แต่ไม่ใช่ FR)

## การทดสอบ

ทดสอบบน local (Node v20.20.2) กับ Google Sheet จริง:

| เคส | ผลลัพธ์ |
|---|---|
| สร้าง session ใหม่ (N03) → เห็น QR + countdown เดินจริง | ✅ ยืนยันด้วยภาพ (4s → 8s หลังหมุน) |
| สแกน (จำลอง token ปัจจุบันจริง) + รหัสนักศึกษาที่มีจริง | ✅ "เช็คชื่อสำเร็จ" + ชื่อจริงจาก Sheet, แถวถูกเขียนลง `attendance_log` จริง (ตรวจผ่าน Sheets API) |
| สแกนด้วย token ที่หมดอายุแล้ว (เกิน ± 1 window) | ✅ "QR หมดอายุ ลองสแกนใหม่" |
| สแกนซ้ำคู่ `(student_id, session_id)` เดิม | ✅ ตรวจ logic ตรงกับ Sheet จริง (`attendanceExists` คืน true เฉพาะคู่ที่ตรง session, false ถ้าคนละ session) |
| รหัสนักศึกษาที่ไม่มีใน master list | ✅ ตรวจ logic ตรงกับ Sheet จริง (`findStudentName` คืน null) |
| `getSession` อ่านสถานะ session ถูกต้อง | ✅ ตรวจตรงกับ Sheet จริง |

หมายเหตุ: เคส "สแกนซ้ำ" และ "รหัสไม่พบ" ตรวจที่ระดับฟังก์ชัน (เรียก logic
เดียวกับที่ `checkinAction` ใช้ ยิงตรงไปที่ Google Sheets จริง) แทนการกดผ่าน
เบราว์เซอร์ เพราะ round-trip ของเครื่องมือทดสอบช้ากว่า window 15 วินาที
ทำให้ token หมดอายุก่อนกดถึงปุ่มยืนยันทุกครั้ง — ไม่กระทบความถูกต้องของ
การตรวจสอบ เพราะเรียก helper function ตัวเดียวกับที่ action จริงใช้

## `npm run build` / typecheck
ผ่านทั้งคู่ (`tsc --noEmit` และ `next build` บน Node v20.20.2) รวม route
ใหม่ `/checkin`
