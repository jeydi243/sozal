<script setup lang="ts">
import type { Member } from '~/types'

useHead({
  title: 'Members - Settings',
  meta: [
    { name: 'description', content: 'Manage your team members.' }
  ]
})

const { data: members } = await useFetch<Member[]>('/api/members', { default: () => [] })

const q = ref('')

const filteredMembers = computed(() => {
  return members.value.filter((member) => {
    return member.prenom.search(new RegExp(q.value, 'i')) !== -1 || member.nom.search(new RegExp(q.value, 'i')) !== -1
  })
})
</script>

<template>
  <div>
    <UPageCard title="Members" description="Invite new members by email address." variant="naked"
      orientation="horizontal" class="mb-4">
      <UButton label="Invite people" color="neutral" class="w-fit lg:ms-auto" />
    </UPageCard>

    <UPageCard variant="subtle"
      :ui="{ container: 'p-0 sm:p-0 gap-y-0', header: 'p-4 mb-0 border-b border-(--ui-border)' }">
      <template #header>
        <UInput v-model="q" icon="i-lucide-search" placeholder="Search members" autofocus class="w-full" />
      </template>

      <SettingsMembersList :members="filteredMembers" />
    </UPageCard>
  </div>
</template>
