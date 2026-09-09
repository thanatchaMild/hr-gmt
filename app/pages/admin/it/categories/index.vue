<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import AppPagination from '~/components/admin/AppPagination.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import Modal from '~/components/admin/Modal.vue'

interface CategoryRow {
  id: string
  name: string
  code: string
  status: string
  count: number
}

const { data, refresh } = await useFetch<{ categories: CategoryRow[] }>('/api/asset-categories')
const categories = computed(() => data.value?.categories || [])

const searchQuery = ref('')
const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  const q = searchQuery.value.toLowerCase()
  return categories.value.filter(cat =>
    cat.name.toLowerCase().includes(q) ||
    cat.code.toLowerCase().includes(q)
  )
})

const currentPage = ref(1)
watch(searchQuery, () => { currentPage.value = 1 })
const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * 10
  return filteredCategories.value.slice(start, start + 10)
})

const isSaving = ref(false)

const showFormModal = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ name: '', code: '' })

const openAddModal = () => {
  editingId.value = null
  form.name = ''
  form.code = ''
  showFormModal.value = true
}

const openEditModal = (cat: CategoryRow) => {
  editingId.value = cat.id
  form.name = cat.name
  form.code = cat.code
  showFormModal.value = true
}

const submitForm = async () => {
  if (!form.name || !form.code) {
    alert('กรุณากรอกชื่อและรหัสหมวดหมู่')
    return
  }
  isSaving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/asset-categories/${editingId.value}`, {
        method: 'PATCH',
        body: { name: form.name, code: form.code }
      })
    } else {
      await $fetch('/api/asset-categories', {
        method: 'POST',
        body: { name: form.name, code: form.code }
      })
    }
    showFormModal.value = false
    await refresh()
  } catch {
    alert('บันทึกไม่สำเร็จ อาจมีรหัสหมวดหมู่นี้อยู่แล้ว')
  } finally {
    isSaving.value = false
  }
}

const deleteCategory = async (cat: CategoryRow) => {
  if (!confirm(`ยืนยันลบหมวดหมู่ "${cat.name}"?`)) return
  try {
    await $fetch(`/api/asset-categories/${cat.id}`, { method: 'DELETE' })
    await refresh()
  } catch {
    alert('ลบไม่สำเร็จ')
  }
}
</script>

<template>
  <RequirePermission requiredRole="IT_ADMIN">
    <PageHeader title="หมวดหมู่อุปกรณ์ (Categories)" subtitle="จัดการประเภทของทรัพย์สิน IT ภายในระบบ" color="purple">
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
      </template>
      <template #actions>
        <input v-model="searchQuery" type="text" placeholder="ค้นหาหมวดหมู่..." class="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500">
        <button @click="openAddModal" class="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 shadow-md shadow-purple-500/20 whitespace-nowrap flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          เพิ่มหมวดหมู่
        </button>
      </template>
    </PageHeader>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-xs">
            <tr>
              <th class="px-6 py-3 font-semibold">รหัส (Code)</th>
              <th class="px-6 py-3 font-semibold">ชื่อหมวดหมู่</th>
              <th class="px-6 py-3 font-semibold text-center">จำนวนอุปกรณ์ (ชิ้น)</th>
              <th class="px-6 py-3 font-semibold">สถานะ</th>
              <th class="px-6 py-3 font-semibold text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="cat in paginatedCategories" :key="cat.id" class="hover:bg-purple-50/30 transition-colors">
              <td class="px-6 py-4 font-mono text-slate-600">{{ cat.code }}</td>
              <td class="px-6 py-4 font-medium text-slate-900">{{ cat.name }}</td>
              <td class="px-6 py-4 text-center text-slate-600">{{ cat.count }}</td>
              <td class="px-6 py-4">
                <StatusBadge :text="cat.status" color="green" />
              </td>
              <td class="px-6 py-4 text-right">
                <button @click="openEditModal(cat)" class="text-blue-600 hover:text-blue-800 font-medium text-sm mr-3">แก้ไข</button>
                <button @click="deleteCategory(cat)" class="text-red-600 hover:text-red-800 font-medium text-sm">ลบ</button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="filteredCategories.length === 0" message="ไม่พบข้อมูลหมวดหมู่" />
      </div>
      <AppPagination v-model:currentPage="currentPage" :totalItems="filteredCategories.length" :itemsPerPage="10" />
    </div>

    <!-- Add/Edit Modal -->
    <Modal v-if="showFormModal" :title="editingId ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'" max-width="md" @close="showFormModal = false">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อหมวดหมู่</label>
          <input v-model="form.name" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="เช่น Computer (คอมพิวเตอร์)">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">รหัส (Code)</label>
          <input v-model="form.code" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" placeholder="เช่น COM">
        </div>
      </div>
      <template #footer>
        <button @click="showFormModal = false" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">ยกเลิก</button>
        <button @click="submitForm" :disabled="isSaving" class="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
          {{ isSaving ? 'กำลังบันทึก...' : 'บันทึก' }}
        </button>
      </template>
    </Modal>
  </RequirePermission>
</template>
