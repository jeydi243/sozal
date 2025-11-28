<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'

const schema = z.object({
  name: z.string().min(3, 'Too short'),
  description: z.string(),
  code: z.string(),
  lookup_id: z.string(),
})
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const state = reactive<Partial<Schema>>({
  name: undefined,
  description: undefined,
  code: undefined,
  lookup_id: undefined,
})
const { data: lookups } = await useAsyncData('lookups', async () => {
  const { data } = await supabase.from('lookups').select('id, name')
  return data
})

const items = computed<SelectMenuItem[]>(() => lookups.value?.map(lookup => ({
  label: lookup.name,
  id: lookup.id
})) || [])

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { data, error } = await supabase
    .from('organisations')
    .insert(event?.data)
    .select()

  if (error) {
    toast.add({ title: 'Error', description: `Can't add new organisation ${error.message}`, color: 'error' })
  } else {
    toast.add({ title: 'Success', description: `New classe ${event.data.name} added`, color: 'success' })
    open.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Organisation" description="Add a new organisation to the database">
    <UButton label="New organisation" icon="i-lucide-plus" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Type d'organisation" placeholder="_" name="lookup_id">
          <USelectMenu v-model="state.lookup_id" value-key="id" :items="items" class="w-full" />
        </UFormField>
        <UFormField label="Code" placeholder="Code d'organisation" name="code">
          <UInput v-model="state.code" class="w-full" />
        </UFormField>
        <UFormField label="Name" placeholder="John Doe" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Description" placeholder="" name="description">
          <UTextarea v-model="state.description" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Add" color="primary" variant="solid" type="submit" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
