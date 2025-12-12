<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Organisation } from '~/types'

const schema = z.object({
  name: z.string().min(3, 'Too short'),
  description: z.string(),
  code: z.string(),
  organisation_id: z.string(),
})
const emit = defineEmits(['tarifaire-added'])
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const state = reactive<Partial<Schema>>({
  name: undefined,
  description: undefined,
  organisation_id: undefined,
})
const { data: organisations } = await useAsyncData<Organisation[]>('organisation-tarifaire', async () => {
    const { data } = await supabase.from('organisations').select('id, name, lookups!inner(*)').eq('lookups.code', 'clinique')
    return (data || []) as unknown as Organisation[]
})

const items = computed<SelectMenuItem[]>(() => organisations.value?.map(organisation => ({
    label: organisation?.name,
    id: String(organisation?.id)
})) || [])

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { data, error } = await supabase
        .from('tarifaires')
        .insert(event?.data as any)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new tarifaire ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New tarifaire ${event.data.name} added`, color: 'success' })
        open.value = false
        emit('tarifaire-added')
}
</script>

<template>
  <UModal v-model:open="open" title="Tarifaire" description="Add a new tarifaire to the database">
    <UButton label="New tarifaire" icon="i-lucide-plus" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Name" placeholder="John Doe" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Description" placeholder="" name="description">
          <UInput v-model="state.description" class="w-full" />
        </UFormField>
        <UFormField label="Organisation" placeholder="_" name="organisation_id">
          <USelectMenu v-model="state.organisation_id" value-key="id" :items="items" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Create" color="primary" variant="solid" type="submit" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
