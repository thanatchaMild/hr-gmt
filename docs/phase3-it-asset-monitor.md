# Phase 3 — IT Asset Monitor (ดูข้อมูลร่วมกับ myapp)

> สถานะ (2026-10-21): ทุกเมนูเสร็จแบบ read-only
>
> | เมนู | หน้า | API |
> |---|---|---|
> | A. ข้อมูลทรัพย์สิน | `/admin/it/assets` (ภาพรวม), `/assets/list`, `/assets/transfers`, `/assets/:id` | `/api/appsheet-assets/*` |
> | 1. ขอทรัพย์สินไอที | `/admin/it/asset-requests`, `/asset-requests/:id` | `/api/asset-requests` |
> | 2. รายการที่ยืนยันแล้ว | `/admin/it/asset-requests/queue` | `/api/asset-requests?queue=1` |
> | 3. ข้อมูลพนักงาน (AppSheet) — IT เท่านั้น | `/admin/it/appsheet-employees` | `/api/appsheet-employees/*` |
> | 4. รายการขอทรัพย์สิน (Master) | `/admin/it/asset-catalog` | `/api/asset-catalog` |
>
> - query ฝั่ง gypman-tech ใช้ `h.*` / `l.*` + `gypmanColumns()` จึงใช้ได้ทั้งฐาน dev (migration ยังไม่ครบ) และ production
> - เมนู 3: ถ้าฐานยังไม่มีตาราง `employees` (ของ myapp) จะ fallback ไปอ่าน `appsheet_employees` พร้อมป้ายเตือน
> - ฐาน dev: ตาราง `it_asset_request_*` / `it_asset_catalog_items` ยังว่าง → เมนู 1, 2, 4 ยังไม่ได้ทดสอบกับข้อมูลจริง
>
> เมนู IT เดิม: เก็บ `/admin/it/requests` (คำขอ HR→IT ใน hr-test) แต่เอาแท็บ "คำขอจากระบบภายนอก" ออก (ย้ายไปเมนู 1/2) —
> เอาออก `/admin/it/assets` เดิม + `/admin/it/categories` (ตาราง `assets`/`asset_categories` ใน hr-test ซ้ำกับ AppSheet; model ใน Prisma ยังอยู่ ไม่ได้ลบตาราง) —
> `asset-inventory` ย้ายมาเป็นเมนู A, ลบปุ่ม sync ไป `it_assets` — ลบ `MYAPP_BASE_URL`/`MYAPP_API_KEY`

## เป้าหมาย

- admin01 ทำงานใน **myapp** (Laravel) ตามเดิม, admin02 มอนิเตอร์ใน **hr-management** — ใช้ฐานข้อมูลชุดเดียวกัน
- **ไม่แก้ myapp** — hr-management ต่อฐานข้อมูลตรงด้วย `mssql` แล้วทำ UI ใหม่ (Vue 3 + Tailwind) ตามหน้าของ myapp
- รอบนี้ **ดูอย่างเดียว (read-only)** ทุกเมนู — การแก้ไขค่อยเปิดทีหลังทีละจุด

## ฐานข้อมูลที่ใช้

| ฐาน | ใช้ทำอะไร | Production (ตาม myapp `.env-pro`) | Dev (myapp `.env`) |
|---|---|---|---|
| `gypman-tech` | คำขอทรัพย์สิน IT (`it_asset_request_*`), Master (`it_asset_catalog_items`), `users`, `devs` | 10.1.1.100 | 192.168.8.93 |
| `appsheetdb` | ทะเบียนทรัพย์สิน + พนักงาน AppSheet | 103.40.144.248 | 192.168.8.93 |
| `hr-test` | ข้อมูล HR ของ hr-management (Prisma) | — | 192.168.8.93 |

⚠️ ฐาน dev (192.168.8.93) **ยังไม่ทันกับ myapp**:
- `gypman-tech` รัน migration ของ `it_asset_request_*` ถึงแค่ 2026-08-28 → ยังไม่มีคอลัมน์ `emp_code`, `unit_price`, `it_line_status`, `appsheet_asset_id`, `confirmed_at` ฯลฯ และตารางยังว่าง (0 แถว)
- `appsheetdb` ยังไม่มีตาราง `employees` (ของเมนูข้อมูลพนักงาน AppSheet) — มีแต่ `appsheet_employees` (148 แถว)

→ ต้องตัดสินใจว่าจะพัฒนากับฐานไหน (ดูคำถามท้ายไฟล์)

## สิทธิ์การเห็นเมนู

| เมนู | IT_ADMIN | HR_ADMIN |
|---|---|---|
| A. ข้อมูลทรัพย์สิน | ✅ | — |
| 1. ขอทรัพย์สินไอที | ✅ | — |
| 2. รายการขอทรัพย์สินที่ยืนยันแล้ว | ✅ | — |
| 3. ข้อมูลพนักงาน (AppSheet) | ✅ | — |
| 4. จัดการรายการขอทรัพย์สิน (Master) | ✅ | — |

---

## Phase 0 — เตรียมการเชื่อมต่อ

- `.env`: เพิ่ม `DB_*_GYPMAN` (ใช้ `DB_*_APPSHEET` ที่มีอยู่แล้ว)
- `server/utils/gypmanDb.ts` — connection pool แบบเดียวกับ `appsheetDb.ts`
- `server/utils/itAsset.ts` — ค่าคงที่ที่ต้องตรงกับ myapp: สถานะคำขอ (`draft`, `รอ IT ตรวจสอบ`, `รออนุมัติ`, `อนุมัติแล้ว`, `กำลังจัดสรร`, `เสร็จสิ้น`, `ไม่ผ่านการตรวจสอบ`, `ไม่อนุมัติ`, `ยกเลิก`), ประเภทคำขอ
- API ใหม่ทั้งหมดเป็น `GET` เท่านั้น + `requireRole`
- เมนูใน `app/layouts/admin.vue`: กลุ่ม "ทรัพย์สินไอที" 5 เมนูตามตารางสิทธิ์
- โค้ดเดิมที่จะเลิกใช้/แทนที่: `server/api/asset-requests/*` (เรียก myapp API — ใช้ไม่ได้เพราะ myapp ไม่มี endpoint รายการ), `MYAPP_BASE_URL`/`MYAPP_API_KEY`, `server/api/appsheet-assets/sync.post.ts` + model `ITAsset` (สำเนาข้อมูลใน hr-test — เปลี่ยนเป็นอ่านสดแทน)
- แนะนำ: SQL login แยกสำหรับ hr-management ที่มีสิทธิ์ `SELECT` อย่างเดียวในช่วงนี้

---

## เมนู A — ข้อมูลทรัพย์สิน (ใหม่)

### ข้อมูลที่มีใน `appsheetdb`

| ตาราง | แถว | หมายเหตุ |
|---|---|---|
| `appsheet_assets` | 462 | ทะเบียนหลัก: `AssetTag`, `MachineNumber` (รหัสภายใน เช่น ITS-NB-0033), `AssetName`, `Brand`, `TypeID`, `StatusID`, `AssignedTo` (→ `appsheet_employees`, กรอกแล้ว 461), `BranchID`, `StorageLocationID`, `PurchaseDate`, `WarrantyEndDate` (มี 272), `Vendor`, `Price` (มีแค่ 56), รูป 3 รูป, เอกสาร PR/MEMO/งบ (ลิงก์ Drive), `License1-4`, `SkuID`, `deleted_at` |
| `appsheet_asset_transfers` | 399 | ประวัติการโอนย้าย: `From/ToEmployeeID`, `From/ToBranchID`, `ToLocationID`, `TransferDate`, `Note`, `CreatedBy` — 379 แถวเป็น "เพิ่มข้อมูลครั้งแรก", โอนย้ายจริง ~15 แถว, `FromEmployeeID` มีค่าแค่ 3 แถว |
| `appsheet_asset_transactions` | 0 | ออกแบบไว้สำหรับเหตุการณ์ทั่วไป (`TransactionType`, `EmployeeID`, `Remarks`, `TransactionImage`) แต่ยังไม่เคยใช้ |
| `appsheet_asset_status` | 7 | ใช้งานอยู่, ชำรุด, ซ่อมบำรุง, เลิกใช้งาน, สูญหาย, สำรอง, คืน |
| `appsheet_asset_types` | 15 | NoteBook, Printer, Computer-PC, จอ, UPS, มือถือ ฯลฯ |
| `appsheet_asset_licenses` | 15 | License ผูกกับ `AssetID` |
| `appsheet_branches` / `appsheet_branch_storage_locations` / `appsheet_departments` / `appsheet_skus` | 6 / 45 / 33 / 12 | ข้อมูลอ้างอิง |

สถานะปัจจุบัน: ใช้งานอยู่ 449, ชำรุด 5, คืน 2, สำรอง 2, ไม่มีสถานะ 4
คอลัมน์ `CurrentBranchID/CurrentLocationID/CurrentEmployeeID` ว่างทั้งหมด → ใช้ `AssignedTo/BranchID/StorageLocationID` เป็นค่าปัจจุบัน

### ข้อสังเกต

- **การโอนย้าย** มีโครงสร้างรองรับแล้ว แต่ "จากใคร" ส่วนใหญ่ไม่ได้บันทึก → แสดงโดยอนุมานจาก `ToEmployeeID` ของแถวก่อนหน้าของทรัพย์สินเดียวกัน
- **การส่งซ่อม** ยังไม่มีที่เก็บรายละเอียด (ร้าน, ค่าซ่อม, วันส่ง/รับคืน) — มีแค่สถานะ "ซ่อมบำรุง"
  (ตาราง `maintenance_repair_rounds` ใน gypman-tech เป็นงานซ่อมของฝ่ายซ่อมบำรุง ไม่ใช่ IT — ไม่ควรเอามาปน)
- รูปทรัพย์สินเก็บเป็น path ภายใน AppSheet (`dbo.appsheet_assets_Images/...`) — ต้องรู้ชื่อแอป AppSheet ถึงจะประกอบเป็น URL แสดงรูปได้
- `it_asset_request_lines.appsheet_asset_id` เชื่อมคำขอใน myapp กับทรัพย์สินตัวจริง → ดูได้ว่าทรัพย์สินนี้มาจากคำขอไหน

### หน้าจอ (รอบนี้ read-only)

1. **ภาพรวม** — การ์ดนับตามสถานะ, ตามประเภท, ตามสาขา; รายการประกันใกล้หมด (≤ 90 วัน); รายการชำรุด/ซ่อมบำรุง/สูญหาย
2. **รายการทรัพย์สิน** — ค้นหา (Tag / MachineNumber / ชื่อ / ยี่ห้อ / ผู้ถือ), กรองประเภท/สถานะ/สาขา/แผนก, แบ่งหน้า, export Excel (ต่อยอดจาก `admin/it/asset-inventory` เดิม)
3. **รายละเอียดทรัพย์สิน** — ข้อมูลหลัก, ผู้ถือ + สาขา + ที่เก็บ, License, เอกสาร (ลิงก์ Drive), **Timeline** จาก transfers (+ transactions), คำขอใน myapp ที่ผูกกับทรัพย์สินนี้
4. **ทรัพย์สินตามพนักงาน** — ลิงก์ไปเมนู 3

### เฟสถัดไป (เมื่อเปิดให้แก้ไข)

- **โอนย้าย**: ใน transaction เดียว — `INSERT appsheet_asset_transfers` (บันทึก From/To ให้ครบ) + `UPDATE appsheet_assets` (`AssignedTo`, `BranchID`, `StorageLocationID`, `UpdatedAt`, `UpdatedBy`)
- **ส่งซ่อม/รับคืน**: เปลี่ยน `StatusID` (ซ่อมบำรุง ↔ ใช้งานอยู่) + บันทึกเหตุการณ์ใน `appsheet_asset_transactions` (`TransactionType` = `REPAIR_OUT` / `REPAIR_IN`)
  รายละเอียดงานซ่อม (ร้าน, ค่าใช้จ่าย, วันที่คาดว่าจะเสร็จ, ใบเสนอราคา) เก็บเป็นตารางใหม่ — ตัวเลือก: `hr-test` (Prisma, ไม่กระทบ AppSheet) หรือ `appsheetdb`
- เปลี่ยนสถานะ: ชำรุด / เลิกใช้งาน / สูญหาย / คืน

---

## เมนู 1 — ขอทรัพย์สินไอที (อ้างอิง myapp `ItAssetRequestIndex.vue`, `ItAssetRequestShow.vue`)

- รายการคำขอทุกแผนก: ตัวกรองสถานะ / ประเภท / แผนก / คำค้น, แบ่งหน้า 15 แถว
- รายละเอียด: หัวคำขอ, รายการ (`form_data` JSON), ลายเซ็น 4 ช่อง, MEMO, ไฟล์แนบ (ลิงก์ Google Drive)
- ตาราง: `it_asset_request_headers` + `lines` + `attachments` + `memos`, join `users` (ผู้สร้าง), `devs` (แผนก)

## เมนู 2 — รายการขอทรัพย์สินที่ยืนยันแล้ว (อ้างอิง `ItAssetRequestReviewIndex.vue`)

- เหมือนเมนู 1 แต่ `status <> 'draft'` + ตัวนับ "ด่วนมาก"
- แสดงผลตัดสินใจรายบรรทัดของ IT (`it_line_status`, `it_line_remark`) + ทรัพย์สินที่จับคู่ (`appsheet_asset_id` → เมนู A)
- ใช้หน้ารายละเอียดร่วมกับเมนู 1

## เมนู 3 — ข้อมูลพนักงาน (AppSheet) (อ้างอิง `appsheet-employee-import/index.blade.php`)

- ตาราง `appsheetdb.employees` (20 คอลัมน์ตาม Excel ของ AppSheet): ค้นหา, กรอง, จำนวนทรัพย์สินต่อคน, ดูรายการทรัพย์สินของคน (→ เมนู A), export Excel
- IT เท่านั้น (เดิมให้ HR เห็นด้วย — ปิดแล้ว 2026-10-21)
- เชื่อมกับ `Employee` ของ hr-test ผ่านรหัสพนักงาน (`EmployeeCode` ↔ `employeeCode`)

## เมนู 4 — จัดการรายการขอทรัพย์สิน (Master) (อ้างอิง `ItAssetCatalogManage.vue`)

- ตาราง `it_asset_catalog_items` (`name`, `active`) — แสดงรายการ + จำนวนครั้งที่ถูกใช้ในคำขอ

---

## ลำดับงาน

Phase 0 → เมนู A → 1 → 2 → 3 → 4 (เสร็จทีละเมนูให้ตรวจก่อนไปเมนูถัดไป)

## คำถามที่ต้องตอบก่อนเริ่ม

1. ช่วงพัฒนาจะต่อฐานไหน — (ก) ฐาน production แบบ read-only หรือ (ข) ฐาน dev 192.168.8.93 หลังรัน migration ของ myapp ให้ครบ
2. แอป AppSheet ตัวจริงยังใช้งานอยู่ไหม (มีผลกับการเขียนข้อมูลในเฟสถัดไป และการแสดงรูป)
3. เมนู IT เดิมใน hr-management (`/admin/it/requests`, `assets`, `categories`, `asset-inventory`) — เอาออกหรือเก็บไว้
