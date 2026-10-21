<script setup lang="ts">
definePageMeta({ layout: 'admin', section: 'คำขอทรัพย์สิน', title: 'รายการที่ยืนยันแล้ว' })

import RequirePermission from '~/components/admin/RequirePermission.vue'
import AssetRequestList from '~/components/admin/AssetRequestList.vue'
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <AssetRequestList
      title="รายการขอทรัพย์สิน ที่มีการยืนยันมาแล้ว"
      subtitle="คำขอที่ส่งแล้ว (ไม่รวมร่าง) — ติดตามการตรวจสอบและจับคู่ทรัพย์สินของ IT ใน myapp"
      queue
    />
  </RequirePermission>
</template>
