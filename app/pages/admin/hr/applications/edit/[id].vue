<script setup lang="ts">
import { useRoute } from 'vue-router'

// The standalone edit form has been merged into the applicant detail page,
// where every section is now editable inline via EmployeeProfileTabs.
const route = useRoute()
await navigateTo(`/admin/hr/applications/${route.params.id}`, { replace: true })
</script>

<template>
  <div />
</template>
