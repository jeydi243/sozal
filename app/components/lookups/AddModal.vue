<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps({
  classe_id: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['lookup_added'])
const schema = z.object({
  name: z.string().min(3, 'Too short'),
  code: z.string().min(3, 'Too short'),
  classe_id: z.string().min(3, 'Too short'),
  description: z.string()
})
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const state = reactive<Partial<Schema>>({
  name: undefined,
  code: undefined,
  classe_id: props.classe_id,
  description: undefined,
})
const paramStore = useParametresStore()
const classes = computed(() => paramStore.getClasseItems)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { data, error } = await supabase
    .from('lookups')
    .insert(event?.data)
    .select()

  if (error) {
    toast.add({ title: 'Error', description: `Can't add new lookup ${error.message}`, color: 'error' })
  } else {
    toast.add({ title: 'Success', description: `New lookup ${event.data.name} added`, color: 'success' })
    open.value = false
    emit('lookup_added')
  }
}



</script>

<template>
  <UModal v-model:open="open" title="Lookup" description="Add a new lookup to the database">
    <UButton label="New lookup" icon="i-lucide-plus" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Classe" placeholder="_" name="classe_id">
          <USelectMenu disabled  v-model="state.classe_id" value-key="id" :items="classes" class="w-full"  />
        </UFormField>
        <UFormField label="Name" placeholder="John Doe" name="name">
          <UInput v-model="state.name" class="w-full" />
        </UFormField>
        <UFormField label="Code" placeholder="_" name="code">
          <UInput v-model="state.code" class="w-full" />
        </UFormField>
        <UFormField label="Description" placeholder="" name="description">
          <UInput v-model="state.description" class="w-full" />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Create" color="primary" variant="solid" type="submit" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
