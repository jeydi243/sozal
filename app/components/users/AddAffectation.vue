<template>
    <UModal v-model:open="open" :title="`Ajouter une affectation pour ${user_id}`" :dismissible="true">
        <UButton icon="i-lucide-plus" label="Ajouter une affectation" color="primary" variant="solid" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Type" name="type">
                    <USelectMenu v-model="state.lookup_id" value-key="id" :items="items" class="w-full" />
                </UFormField>

                <UFormField label="Utilisateur" name="user_id">
                    <UInput v-model="state.user_id" class="w-full" placeholder="John Doe" />
                </UFormField>

                <UFormField label="Organisation" name="organisation_id">
                    <UInput v-model="state.organisation_id" class="w-full" placeholder="John Doe" />
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Create User" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
const supabase = useSupabaseClient()
const schema = z.object({
    user_id: z.string().email('Invalid email'),
    lookup_id: z.string().min(6, 'Password must be at least 6 characters'),
    organisation_id: z.string().min(2, 'Name is too short').optional()
})

const { data: lookups } = await useAsyncData('lookups', async () => {
    const { data } = await supabase.from('lookups').select('id, name, classes!inner(*)').eq('table_name', 'type_affectation')
    return data
})

const items = computed<SelectMenuItem[]>(() => lookups.value?.map(lookup => ({
    label: lookup.name,
    id: lookup.id
})) || [])
const props = defineProps({
    user_id: {
        type: String
    }
})

const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    user_id: undefined,
    lookup_id: undefined,
    organisation_id: undefined,
})
async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('affectations')
        .insert(event?.data)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new affectation ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New affectation added`, color: 'success' })
        open.value = false
    }
}

const emit = defineEmits(['affectation-added'])
</script>