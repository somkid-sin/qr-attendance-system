# AI Usage Log

## รูปแบบการบันทึก
| วันที่ | เครื่องมือ | Prompt โดยสรุป | ผลที่ได้ | ส่วนที่แก้ไขเอง |
|---|---|---|---|---|
| 2569-07-20 | Claude | วางแผน setup GitHub repo | ขั้นตอน 8 ขั้น + template README | ปรับ path โฟลเดอร์ให้ตรงเครื่อง |
| 2569-08-05 | Claude Code | Sprint 1 walking skeleton (login + สร้าง session + QR) | login อาจารย์, ฟอร์มสร้าง session ระบุกลุ่ม เขียนลง Sheet tab sessions, QR token คงที่ (ADR2), Sheets client แบบ JWT ไม่มี dependency | ตรวจ scope/schema, ยืนยัน encode section ใน session_id, ทดสอบ `tsc` |
| 2569-08-16 | Claude Code | Sprint 2 (QR หมุนทุก 15 วิ + หน้าสแกนนักศึกษา + เขียน attendance_log) | verifyToken แบบ ± 1 window, rotating QR ผ่าน server action, หน้า /checkin public, checkinAction ตรวจครบตาม UC2 exception flow | ยืนยัน trade-off (A) ไม่ผูกกลุ่มเรียน, ทดสอบ end-to-end กับ Google Sheets จริง (สำเร็จ/หมดอายุผ่านเบราว์เซอร์, ซ้ำ/ไม่พบรหัสตรวจที่ระดับ logic เพราะ tool latency ช้ากว่า window) |
| 2569-08-16 | Claude Code | ขยาย token tolerance เป็น 180 วิ + เพิ่มตรวจกลุ่มเรียน (เปลี่ยนจาก decision A → B) | `CHECKIN_TOLERANCE_SECONDS=180`, `parseSessionId` ย้ายมาเป็น shared helper, `findStudent` คืน section, `checkinAction` เทียบ section กับ session | อาจารย์เพิ่มคอลัมน์ Section ใน sheet เอง, ยืนยัน trade-off ของ tolerance ที่กว้างขึ้น, ทดสอบทั้งกลุ่มตรง/ไม่ตรงกับ Sheet จริงผ่านเบราว์เซอร์ |
