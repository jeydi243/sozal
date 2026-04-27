<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'

import type { Lookup, Organisation } from '~/types'

const props = defineProps<{
  parent: Organisation | null | string
}>()

const emit = defineEmits(['emplacement-added'])

const schema = z.object({
  nom: z.string().min(3, 'Too short'),
  description: z.string().optional(),
  code: z.string().min(1, 'Required'),
  lookup_id: z.string().optional()
})

const open = ref(false)
const toast = useToast()
const supabase = useSupabaseClient()

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  nom: undefined,
  description: undefined,
  code: undefined,
  lookup_id: undefined
})
const { data: lookups } = await useAsyncData(`lookups-emplacement-${props.parent?.id}`, async () => {
  const { data } = await supabase.from('lookups').select('id, nom, description').eq('description', 'Emplacement')
  return data
})

const itemsEmplacement = computed<SelectMenuItem[]>(() => lookups.value?.map((lookup: Lookup) => ({
  label: lookup.nom,
  id: lookup.id
})) || [])

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.parent?.id) return

  const { error } = await supabase.from('organisations')
    .insert({
      nom: event.data.nom,
      description: event.data.description,
      code: event.data.code,
      lookup_id: event.data.lookup_id,
      organisation_parent_id: props.parent.id
    } as never)


  if (error) {
    toast.add({ title: 'Erreur', description: error.code + ':' + (error.hint || error.message), color: 'error' })
  } else {
    toast.add({ title: 'Succès', description: `Service ${event.data.nom} ajouté`, color: 'success' })
    emit('emplacement-added')
    open.value = false
    // Reset state
    state.nom = undefined
    state.description = undefined
    state.code = undefined
    state.lookup_id = undefined
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Ajouter un emplacement" :dismissible="false"
    description="Ajouter un emplacement dans cette organisation">
    <UButton label="Nouvel Emplacement" icon="i-lucide-plus" size="sm" variant="subtle" />

    <template #body>
      <div v-if="props.parent" class="mb-4 p-3 bg-(--ui-bg-elevated) rounded-lg border border-(--ui-border) text-sm">
        <p class="text-(--ui-text-muted) flex items-center gap-2 mb-1">
          <UIcon name="i-lucide-building" />
          Organisation Parente
        </p>
        <p class="font-medium text-(--ui-text-highlighted)">
          {{ props.parent?.nom || "Toutes les organisations" }}
          <span class="text-xs font-mono opacity-60 ml-1">({{ props.parent?.code || 'N/A' }})</span>
        </p>
      </div>

      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField label="Type d'organisation" name="type">
          <USelectMenu v-model="state.lookup_id" value-key="id" :items="itemsEmplacement" class="w-full" />
        </UFormField>
        <UFormField label="Code" name="code">
          <UInput v-model="state.code" class="w-full" placeholder="Ex: EMP-01" />
        </UFormField>
        <UFormField label="Nom" name="nom">
          <UInput v-model="state.nom" class="w-full" placeholder="Nom de l'emplacement" />
        </UFormField>
        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" class="w-full" placeholder="Description courte..." />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Ajouter" color="primary" variant="solid" type="submit" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
