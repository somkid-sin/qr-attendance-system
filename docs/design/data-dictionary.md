# Data Dictionary — Google Sheets Schema

## Sheet 1: students (master list — FR7)

| Column | ชื่อ field | ประเภทข้อมูล | จำเป็น | ตัวอย่าง | หมายเหตุ |
|---|---|---|---|---|---|
| A | student_id | text (13 หลัก) | ✓ | 6804681001001 | Primary key, unique |
| B | full_name | text | ✓ | นายณัฐวุฒิ ราชฤทธิ์ | จาก master list ที่อาจารย์อัปโหลด |

## Sheet 2: sessions (FR1, FR2)

| Column | ชื่อ field | ประเภทข้อมูล | จำเป็น | ตัวอย่าง | หมายเหตุ |
|---|---|---|---|---|---|
| A | session_id | text (YYYYMMDD-period) | ✓ | 20260812-N01 | Primary key, unique |
| B | date | date | ✓ | 2026-08-12 | |
| C | period | text | ✓ | 08:30-12:30 | ตรงกับตารางสอน |
| D | status | enum: open / closed | ✓ | open | คุมว่า UC2 รับสแกนได้ไหม |
| E | opened_at | datetime | ✓ | 2026-08-12 08:30:15 | ใช้คำนวณ token window |
| F | closed_at | datetime | – | 2026-08-12 12:35:00 | ว่างจนกว่าจะปิด session |

ไม่มีคอลัมน์ secret ใด ๆ — secret คำนวณจาก session_id + MASTER_SECRET (ดู ADR2)

## Sheet 3: attendance_log (FR5, FR8)

| Column | ชื่อ field | ประเภทข้อมูล | จำเป็น | ตัวอย่าง | หมายเหตุ |
|---|---|---|---|---|---|
| A | student_id | text | ✓ | 6804681001001 | FK → students.student_id |
| B | session_id | text | ✓ | 20260812-N01 | FK → sessions.session_id |
| C | timestamp | datetime | ✓ | 2026-08-12 08:31:42 | เวลาบันทึกจริง (server time) |
| D | status | enum: present | ✓ | present | MVP มีค่าเดียว เผื่อขยายเป็น late ภายหลัง |

**Constraint สำคัญ (บังคับในโค้ด ไม่ใช่ใน Sheets)**: คู่
(student_id, session_id) ห้ามซ้ำ — ต้อง query ก่อน insert ทุกครั้ง
เพื่อกันสแกนซ้ำตาม UC2 exception flow