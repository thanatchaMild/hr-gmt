<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import Modal from '~/components/admin/Modal.vue'

interface CategoryOption {
  id: string
  name: string
}

interface AssetRow {
  id: string
  assetTag: string
  assetType: string
  status: 'IN_STOCK' | 'ASSIGNED' | 'MAINTENANCE'
  assignedTo: string | null
  department: string | null
  category: { id: string; name: string } | null
}

const { data: assetsData, refresh } = await useFetch<{ assets: AssetRow[] }>('/api/assets')
const { data: categoriesData } = await useFetch<{ categories: CategoryOption[] }>('/api/asset-categories')

const assets = computed(() => assetsData.value?.assets || [])
const categories = computed(() => categoriesData.value?.categories || [])

const searchQuery = ref('')
const filteredAssets = computed(() => {
  if (!searchQuery.value) return assets.value
  const q = searchQuery.value.toLowerCase()
  return assets.value.filter(asset =>
    asset.assetTag.toLowerCase().includes(q) ||
    asset.assetType.toLowerCase().includes(q) ||
    (asset.assignedTo || '').toLowerCase().includes(q)
  )
})

const statusLabel: Record<string, { text: string; color: 'blue' | 'green' | 'orange' }> = {
  IN_STOCK: { text: 'มีในสต็อก', color: 'blue' },
  ASSIGNED: { text: 'ถูกใช้งาน', color: 'green' },
  MAINTENANCE: { text: 'ซ่อมบำรุง', color: 'orange' }
}

const showAddModal = ref(false)
const newAsset = reactive({ assetTag: '', assetType: '', categoryId: '' })
const isSaving = ref(false)

const submitAddAsset = async () => {
  if (!newAsset.assetTag || !newAsset.assetType) {
    alert('กรุณากรอกรหัสทรัพย์สินและประเภท/รุ่น')
    return
  }
  isSaving.value = true
  try {
    await $fetch('/api/assets', {
      method: 'POST',
      body: { assetTag: newAsset.assetTag, assetType: newAsset.assetType, categoryId: newAsset.categoryId || undefined }
    })
    showAddModal.value = false
    newAsset.assetTag = ''
    newAsset.assetType = ''
    newAsset.categoryId = ''
    await refresh()
  } catch {
    alert('เพิ่มทรัพย์สินไม่สำเร็จ อาจมีรหัสทรัพย์สินนี้อยู่แล้ว')
  } finally {
    isSaving.value = false
  }
}

const showAssignModal = ref(false)
const assigningAsset = ref<AssetRow | null>(null)
const assignForm = reactive({ assignedTo: '', department: '' })

const openAssignModal = (asset: AssetRow) => {
  assigningAsset.value = asset
  assignForm.assignedTo = ''
  assignForm.department = ''
  showAssignModal.value = true
}

const submitAssign = async () => {
  if (!assigningAsset.value || !assignForm.assignedTo) {
    alert('กรุณาระบุชื่อผู้ถือครอง')
    return
  }
  isSaving.value = true
  try {
    await $fetch(`/api/assets/${assigningAsset.value.id}`, {
      method: 'PATCH',
      body: { status: 'ASSIGNED', assignedTo: assignForm.assignedTo, department: assignForm.department || undefined }
    })
    showAssignModal.value = false
    await refresh()
  } catch {
    alert('กำหนดผู้ถือครองไม่สำเร็จ')
  } finally {
    isSaving.value = false
  }
}

const returnAsset = async (asset: AssetRow) => {
  if (!confirm(`ยืนยันรับคืนอุปกรณ์ ${asset.assetTag} จาก ${asset.assignedTo}?`)) return
  isSaving.value = true
  try {
    await $fetch(`/api/assets/${asset.id}`, {
      method: 'PATCH',
      body: { status: 'IN_STOCK', assignedTo: null, department: null }
    })
    await refresh()
  } catch {
    alert('รับคืนอุปกรณ์ไม่สำเร็จ')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <PageHeader title="ติดตามทรัพย์สิน IT" subtitle="รายการอุปกรณ์และการถือครองทั้งหมดในระบบ" color="purple">
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
      </template>
      <template #actions>
        <input v-model="searchQuery" type="text" placeholder="ค้นหารหัส, รุ่น หรือชื่อผู้ใช้..." class="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500">
        <button @click="showAddModal = true" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 shadow-md shadow-purple-500/20 whitespace-nowrap">เพิ่มทรัพย์สิน</button>
      </template>
    </PageHeader>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-xs">
            <tr>
              <th class="px-6 py-3 font-semibold">รหัสทรัพย์สิน</th>
              <th class="px-6 py-3 font-semibold">ประเภท/รุ่น</th>
              <th class="px-6 py-3 font-semibold">สถานะ</th>
              <th class="px-6 py-3 font-semibold">ผู้ใช้งาน</th>
              <th class="px-6 py-3 font-semibold">แผนก</th>
              <th class="px-6 py-3 font-semibold text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="asset in filteredAssets" :key="asset.id" class="hover:bg-purple-50/30 transition-colors">
              <td class="px-6 py-4 font-mono text-slate-600">{{ asset.assetTag }}</td>
              <td class="px-6 py-4 font-medium text-slate-900">{{ asset.assetType }}</td>
              <td class="px-6 py-4">
                <StatusBadge :text="statusLabel[asset.status]?.text" :color="statusLabel[asset.status]?.color" />
              </td>
              <td class="px-6 py-4" :class="asset.assignedTo ? 'text-slate-600' : 'text-slate-400'">{{ asset.assignedTo || '-' }}</td>
              <td class="px-6 py-4" :class="asset.department ? 'text-slate-600' : 'text-slate-400'">{{ asset.department || '-' }}</td>
              <td class="px-6 py-4 text-right">
                <button v-if="asset.status === 'ASSIGNED'" @click="returnAsset(asset)" class="font-medium text-sm text-orange-600 hover:text-orange-800">รับคืนอุปกรณ์</button>
                <button v-else @click="openAssignModal(asset)" class="font-medium text-sm text-purple-600 hover:text-purple-800">กำหนดผู้ถือครอง</button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="filteredAssets.length === 0" message="ไม่พบทรัพย์สินที่ค้นหา" />
      </div>
    </div>

    <!-- Add Asset Modal -->
    <Modal v-if="showAddModal" title="เพิ่มทรัพย์สิน" max-width="md" @close="showAddModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">รหัสทรัพย์สิน (Asset Tag)</label>
          <input v-model="newAsset.assetTag" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="เช่น NB-2026-003">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">ประเภท/รุ่น</label>
          <input v-model="newAsset.assetType" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="เช่น Laptop (ThinkPad T14)">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่</label>
          <select v-model="newAsset.categoryId" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option value="">-- ไม่ระบุ --</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button @click="showAddModal = false" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">ยกเลิก</button>
        <button @click="submitAddAsset" :disabled="isSaving" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
          {{ isSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </template>
    </Modal>

    <!-- Assign Modal -->
    <Modal v-if="showAssignModal" :title="`กำหนดผู้ถือครอง: ${assigningAsset?.assetTag}`" max-width="md" @close="showAssignModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ถือครอง</label>
          <input v-model="assignForm.assignedTo" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">แผนก</label>
          <input v-model="assignForm.department" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
        </div>
      </div>
      <template #footer>
        <button @click="showAssignModal = false" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">ยกเลิก</button>
        <button @click="submitAssign" :disabled="isSaving" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
          {{ isSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </template>
    </Modal>
  </RequirePermission>
</template>
