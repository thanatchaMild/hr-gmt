<script setup lang="ts">
definePageMeta({ layout: 'admin', section: 'คำขอทรัพย์สิน', title: 'ขอทรัพย์สินไอที' })

import RequirePermission from '~/components/admin/RequirePermission.vue'
import AssetRequestList from '~/components/admin/AssetRequestList.vue'
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <AssetRequestList
      title="ขอทรัพย์สินไอที"
      subtitle="คำขอทรัพย์สิน IT ทุกแผนกจาก myapp (ดูอย่างเดียว)"
    />
  </RequirePermission>
</template>
