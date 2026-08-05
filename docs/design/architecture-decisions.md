# Architecture Decision Records — QR Attendance System

## ADR1: เลือก Google Sheets เป็น Data Store

**บริบท**: ต้องเก็บ master list นักศึกษาและ attendance log สำหรับวิชาเดียว
~33 คน ผู้ใช้งานหลักคืออาจารย์ท่านเดียว

**ตัวเลือกที่พิจารณา**: Google Sheets vs relational database (เช่น
PostgreSQL บน Vercel/Neon) vs Firebase

**การตัดสินใจ**: Google Sheets

**เหตุผล**:
- อาจารย์เข้าถึง/ตรวจสอบ/แก้ไขข้อมูลได้ทันทีโดยไม่ต้องมี admin UI แยก
- ไม่มีต้นทุน hosting database เพิ่ม
- ปริมาณข้อมูลเล็ก (นักศึกษา 33 คน, ~15 สัปดาห์) ไม่เกินขีดจำกัดที่ทำให้
  Sheets มีปัญหา

**Trade-off ที่ยอมรับ (technical debt)**:
- Concurrency: เขียนพร้อมกันหลายสิบครั้งเสี่ยงชน API quota →
  บรรเทาด้วย retry เท่านั้นใน MVP
- ไม่มี transaction/foreign key จริง → ต้องตรวจสอบความถูกต้องของข้อมูล
  ในฝั่งแอปพลิเคชันเอง
- Query ซับซ้อนทำได้จำกัดกว่า SQL

**เมื่อไรควรย้ายออกจาก Sheets**: ถ้าขยายเป็นหลายวิชา/หลายอาจารย์
พร้อมกัน หรือข้อมูลเกินหลักพันแถวที่ query บ่อย

---

## ADR2: Stateless Token (TOTP-style) แทนการเก็บ Token ใน Memory

**บริบท**: QR ต้องหมุน token ทุก 15 วินาทีเพื่อกัน proxy attendance
(NFR2) แต่ deploy บน Vercel ซึ่งเป็น serverless — ไม่มี memory ที่แชร์
ข้าม request ได้ (NFR3)

**ตัวเลือกที่พิจารณา**: เก็บ token ปัจจุบันใน in-memory variable vs
เก็บใน Sheets/database ทุกครั้งที่หมุน vs คำนวณ token แบบ stateless
จากเวลา

**การตัดสินใจ**: คำนวณ token แบบ stateless ด้วยหลักการเดียวกับ TOTP
(RFC 6238)

token = HMAC(session_secret, floor(current_time / 15_sec_window)) → ตัดให้สั้น
session_secret = HMAC(MASTER_SECRET, session_id)

MASTER_SECRET เก็บใน Environment Variable บน Vercel เท่านั้น
ไม่เก็บ secret ใด ๆ ไว้ใน Google Sheets

**เหตุผล**:
- ทำงานถูกต้องบน serverless โดยไม่ต้องมี state กลาง
- ไม่ต้องเขียน/อ่าน Sheets เพิ่มเพื่อ track token ปัจจุบัน
- เป็นมาตรฐานที่ตรวจสอบได้ ไม่ใช่กลไกที่คิดขึ้นเอง

**Trade-off ที่ยอมรับ**: ต้องรองรับ clock skew (ตรวจสอบ window ปัจจุบัน
± 1) และ MASTER_SECRET ต้องไม่หลุดออกจากฝั่ง server