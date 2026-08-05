# Use Case Description — QR Attendance System

## UC1: สร้าง Session และแสดง QR

| หัวข้อ | รายละเอียด |
|---|---|
| Actor | อาจารย์ |
| Precondition | อาจารย์ล็อกอินเข้าระบบแล้ว |
| Main flow | 1. อาจารย์เลือกวันที่/คาบเรียน 2. ระบบสร้าง session ใหม่พร้อม secret เฉพาะ session 3. ระบบคำนวณ token ปัจจุบันและแสดงเป็น QR 4. ระบบสร้าง QR ใหม่ทุก 15 วินาทีอัตโนมัติจนกว่าอาจารย์จะปิด session |
| Postcondition | session อยู่ในสถานะ "เปิด" พร้อมรับการสแกน |
| Exception | สร้าง session ซ้ำในวันเดียวกัน → ระบบแจ้งเตือนและถามยืนยัน |

## UC2: สแกนเช็คชื่อ

| หัวข้อ | รายละเอียด |
|---|---|
| Actor | นักศึกษา |
| Precondition | session เปิดอยู่, นักศึกษามีอุปกรณ์ที่สแกน QR ได้ |
| Main flow | 1. นักศึกษาสแกน QR ด้วยกล้องมือถือ 2. ระบบเปิดหน้าเว็บพร้อม token ที่ decode ได้ 3. นักศึกษากรอก/ยืนยันรหัสนักศึกษา 4. ระบบตรวจสอบ token (ปัจจุบัน ± 1 window) และตรวจสอบรหัสกับ master list (FR8) 5. ถ้าถูกต้อง → บันทึกลง Google Sheets และแสดงผล "เช็คชื่อสำเร็จ" |
| Postcondition | มีแถวใหม่ใน Google Sheets (attendance_log): รหัสนักศึกษา, session, timestamp |
| Exception | token หมดอายุ → แจ้ง "QR หมดอายุ ลองสแกนใหม่"; สแกนซ้ำ → แจ้ง "เช็คชื่อไปแล้ว" ไม่บันทึกซ้ำ; รหัสนักศึกษาไม่พบใน master list → แจ้ง "ไม่พบรหัสนักศึกษานี้ในรายวิชา" |

## UC3: ดูรายงานสรุป

| หัวข้อ | รายละเอียด |
|---|---|
| Actor | อาจารย์ |
| Precondition | มี session ที่ปิดแล้วอย่างน้อย 1 session |
| Main flow | 1. อาจารย์เลือก session ที่ต้องการดู 2. ระบบดึงข้อมูลจาก Google Sheets 3. ระบบเทียบกับ master list (students sheet) 4. แสดงสรุป: มา (มีแถวบันทึก) / ขาด (ไม่มีแถวบันทึก) |
| Postcondition | - |
| Exception | ดึงข้อมูลจาก Sheets ไม่สำเร็จ (quota/network) → แจ้ง error และปุ่มลองใหม่ |