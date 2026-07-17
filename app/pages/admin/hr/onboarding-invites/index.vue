<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})
import RequirePermission from '~/components/admin/RequirePermission.vue'
import PageHeader from '~/components/admin/PageHeader.vue'
import StatusBadge from '~/components/admin/StatusBadge.vue'
import EmptyState from '~/components/admin/EmptyState.vue'
import Modal from '~/components/admin/Modal.vue'

interface Invite {
  id: string
  token: string
  employeeCode: string
  firstName: string
  lastName: string
  status: 'PENDING' | 'SUBMITTED' | 'EXPIRED' | 'REVOKED'
  expiresAt: string
  submittedAt: string | null
  createdBy: string
  createdAt: string
}

const { data, refresh } = await useFetch<{ invites: Invite[] }>('/api/onboarding-invites')
const invites = computed(() => data.value?.invites || [])

const searchQuery = ref('')
const filteredInvites = computed(() => {
  if (!searchQuery.value) return invites.value
  const q = searchQuery.value.toLowerCase()
  return invites.value.filter(inv => `${inv.firstName} ${inv.lastName} ${inv.employeeCode}`.toLowerCase().includes(q))
})

const statusMeta: Record<Invite['status'], { text: string; color: 'blue' | 'green' | 'slate' | 'red' }> = {
  PENDING: { text: 'รอผู้สมัครกรอก', color: 'blue' },
  SUBMITTED: { text: 'กรอกแล้ว', color: 'green' },
  EXPIRED: { text: 'หมดอายุ', color: 'slate' },
  REVOKED: { text: 'ยกเลิกแล้ว', color: 'red' }
}

const linkFor = (invite: Invite) => `${window.location.origin}/onboarding/pdpa?token=${invite.token}`

const isExpiringSoon = (invite: Invite) => {
  if (invite.status !== 'PENDING') return false
  const daysLeft = (new Date(invite.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return daysLeft >= 0 && daysLeft <= 1
}

const copiedId = ref<string | null>(null)
const copyLink = async (invite: Invite) => {
  await navigator.clipboard.writeText(linkFor(invite))
  copiedId.value = invite.id
  setTimeout(() => { if (copiedId.value === invite.id) copiedId.value = null }, 2000)
}

// Create invite modal
const showCreateModal = ref(false)
const isSubmitting = ref(false)
const createForm = reactive({ employeeCode: '', firstName: '', lastName: '' })
const createdInvite = ref<Invite | null>(null)

const openCreateModal = () => {
  createForm.employeeCode = ''
  createForm.firstName = ''
  createForm.lastName = ''
  createdInvite.value = null
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createdInvite.value = null
}

const submitCreate = async () => {
  if (!createForm.employeeCode.trim() || !createForm.firstName.trim() || !createForm.lastName.trim()) {
    alert('กรุณากรอกรหัสพนักงานและชื่อ-นามสกุลให้ครบถ้วน')
    return
  }
  isSubmitting.value = true
  try {
    const { invite } = await $fetch<{ invite: Invite }>('/api/onboarding-invites', {
      method: 'POST',
      body: { ...createForm }
    })
    createdInvite.value = invite
    await refresh()
  } catch {
    alert('สร้างลิงก์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  } finally {
    isSubmitting.value = false
  }
}

const revoking = ref<string | null>(null)
const revokeInvite = async (invite: Invite) => {
  if (!confirm(`ยกเลิกลิงก์ของ ${invite.firstName} ${invite.lastName}?`)) return
  revoking.value = invite.id
  try {
    await $fetch(`/api/onboarding-invites/${invite.id}`, { method: 'PATCH', body: { action: 'revoke' } })
    await refresh()
  } catch {
    alert('ยกเลิกลิงก์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  } finally {
    revoking.value = null
  }
}

const regenerating = ref<string | null>(null)
const regenerateInvite = async (invite: Invite) => {
  regenerating.value = invite.id
  try {
    const { invite: newInvite } = await $fetch<{ invite: Invite }>(`/api/onboarding-invites/${invite.id}`, { method: 'PATCH', body: { action: 'regenerate' } })
    await refresh()
    createdInvite.value = newInvite
    showCreateModal.value = true
  } catch {
    alert('สร้างลิงก์ใหม่ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
  } finally {
    regenerating.value = null
  }
}
</script>

<template>
  <RequirePermission requiredRole="HR_ADMIN">
    <PageHeader title="ลิงก์สมัครงาน" subtitle="สร้างลิงก์สำหรับผู้สมัครแต่ละคนกรอกใบสมัคร ลิงก์มีอายุ 3 วัน" color="blue">
      <template #icon>
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 010 5.656l-4 4a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l4-4a4 4 0 015.656 5.656l-1.5 1.5"></path></svg>
      </template>
      <template #actions>
        <input v-model="searchQuery" type="text" placeholder="ค้นหาชื่อ/รหัสพนักงาน..." class="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
        <button @click="openCreateModal" class="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/20 flex items-center gap-2 whitespace-nowrap">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
          สร้างลิงก์ใหม่
        </button>
      </template>
    </PageHeader>

    <div class="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase text-xs">
            <tr>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">รหัสพนักงาน</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">ชื่อ-นามสกุล</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">สถานะ</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">สร้างเมื่อ</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">หมดอายุ</th>
              <th class="px-6 py-3 font-semibold whitespace-nowrap">สร้างโดย</th>
              <th class="px-6 py-3 font-semibold text-right whitespace-nowrap">การจัดการ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="inv in filteredInvites" :key="inv.id" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">{{ inv.employeeCode }}</td>
              <td class="px-6 py-4 text-slate-700 whitespace-nowrap">{{ inv.firstName }} {{ inv.lastName }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <StatusBadge :text="statusMeta[inv.status].text" :color="statusMeta[inv.status].color" />
              </td>
              <td class="px-6 py-4 text-slate-600 whitespace-nowrap">{{ inv.createdAt?.slice(0, 10) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center gap-1.5" :class="isExpiringSoon(inv) ? 'text-red-600 font-semibold' : 'text-slate-600'">
                  <svg v-if="isExpiringSoon(inv)" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path></svg>
                  {{ inv.expiresAt?.slice(0, 10) }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-600 whitespace-nowrap">{{ inv.createdBy }}</td>
              <td class="px-6 py-4 text-right whitespace-nowrap">
                <div class="flex items-center justify-end gap-2">
                  <button v-if="inv.status === 'PENDING'" @click="copyLink(inv)" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    {{ copiedId === inv.id ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์' }}
                  </button>
                  <button v-if="inv.status === 'PENDING'" @click="revokeInvite(inv)" :disabled="revoking === inv.id" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50">
                    {{ revoking === inv.id ? 'กำลังยกเลิก...' : 'ยกเลิก' }}
                  </button>
                  <button v-if="inv.status === 'EXPIRED' || inv.status === 'REVOKED'" @click="regenerateInvite(inv)" :disabled="regenerating === inv.id" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors disabled:opacity-50">
                    {{ regenerating === inv.id ? 'กำลังสร้าง...' : 'สร้างลิงก์ใหม่' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="filteredInvites.length === 0" message="ยังไม่มีลิงก์สมัครงานที่สร้างไว้" />
      </div>
    </div>

    <!-- Create / Regenerate Invite Modal -->
    <Modal v-if="showCreateModal" :title="createdInvite ? 'สร้างลิงก์สำเร็จ' : 'สร้างลิงก์สมัครงาน'" @close="closeCreateModal">
      <div v-if="!createdInvite" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">รหัสพนักงาน <span class="text-red-500">*</span></label>
          <input v-model="createForm.employeeCode" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none" placeholder="ระบุรหัสพนักงาน...">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">ชื่อ <span class="text-red-500">*</span></label>
            <input v-model="createForm.firstName" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">นามสกุล <span class="text-red-500">*</span></label>
            <input v-model="createForm.lastName" type="text" class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:outline-none">
          </div>
        </div>
        <p class="text-xs text-slate-400">ลิงก์ที่สร้างจะมีอายุใช้งาน 3 วันนับจากตอนนี้</p>
      </div>

      <div v-else class="space-y-4">
        <p class="text-sm text-slate-600">ลิงก์สำหรับ <span class="font-semibold text-slate-800">{{ createdInvite.firstName }} {{ createdInvite.lastName }}</span> ({{ createdInvite.employeeCode }}) — หมดอายุ {{ createdInvite.expiresAt?.slice(0, 10) }}</p>
        <div class="flex items-center gap-2">
          <input readonly :value="linkFor(createdInvite)" class="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50 text-slate-600">
          <button @click="copyLink(createdInvite)" class="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex-shrink-0">
            {{ copiedId === createdInvite.id ? 'คัดลอกแล้ว' : 'คัดลอก' }}
          </button>
        </div>
      </div>

      <template #footer>
        <button v-if="!createdInvite" @click="closeCreateModal" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 text-slate-700">ยกเลิก</button>
        <button v-if="!createdInvite" @click="submitCreate" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {{ isSubmitting ? 'กำลังสร้าง...' : 'สร้างลิงก์' }}
        </button>
        <button v-else @click="closeCreateModal" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">เสร็จสิ้น</button>
      </template>
    </Modal>
  </RequirePermission>
</template>
