# AI Usage Log

## รูปแบบการบันทึก
| วันที่ | เครื่องมือ | Prompt โดยสรุป | ผลที่ได้ | ส่วนที่แก้ไขเอง |
|---|---|---|---|---|
| 2569-07-20 | Claude | วางแผน setup GitHub repo | ขั้นตอน 8 ขั้น + template README | ปรับ path โฟลเดอร์ให้ตรงเครื่อง |
| 2569-08-05 | Claude Code | Sprint 1 walking skeleton (login + สร้าง session + QR) | login อาจารย์, ฟอร์มสร้าง session ระบุกลุ่ม เขียนลง Sheet tab sessions, QR token คงที่ (ADR2), Sheets client แบบ JWT ไม่มี dependency | ตรวจ scope/schema, ยืนยัน encode section ใน session_id, ทดสอบ `tsc` |
