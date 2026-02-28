<template>
    <UModal v-model:open="open" :title="`Ajouter une affectation pour ${user_id}`" :dismissible="true">
        <UButton icon="i-lucide-plus" label="Ajouter une affectation" color="primary" variant="solid" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Utilisateur" name="user_id">
                    <USelectMenu disabled v-model="state.user_id" value-key="id" :items="itemsUsers" class="w-full" />
                </UFormField>

                <UFormField label="Type" name="lookup_id">
                    <USelectMenu v-model="state.lookup_id" value-key="id" :items="items" class="w-full" />
                </UFormField>

                <UFormField label="Organisation" name="organisation_id">
                    <USelectMenu v-model="state.organisation_id" value-key="id" :items="itemsOrganisations"
                        class="w-full" />
                    <!-- <UInput v-model="state.organisation_id" class="w-full" placeholder="John Doe" /> -->
                </UFormField>

                <div class="flex justify-end gap-2">
                    <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Affecter a l'organisation" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Lookup, Organisation } from '~/types'
const supabase = useSupabaseClient()
const schema = z.object({
    user_id: z.string(),
    lookup_id: z.string(),
    organisation_id: z.string()
})

const { data: lookups } = await useAsyncData('add-affectation', async () => {
    const { data } = await supabase.from('lookups').select('id, nom, classes!inner(*)').eq('classes.table_name', 'TYPE_AFFECTATION')
    return data
})
const { data: users } = await useAsyncData('profils', async () => {
    const { data } = await supabase.from('profils').select()
    return data
})

const items = computed<SelectMenuItem[]>(() => lookups.value?.map((lookup: Lookup) => ({
    label: lookup.nom,
    id: lookup.id
})) || [])
const itemsUsers = computed<SelectMenuItem[]>(() => users.value?.map(user => ({
    label: user.prenom + ' ' + user.nom,
    id: user.user_id
})) || [])
const { data: organisations } = await useAsyncData('organisations', async () => {
    const { data } = await supabase.from('organisations').select()
    return data
})
const itemsOrganisations = computed<SelectMenuItem[]>(() => organisations.value?.map((organisation: Organisation) => ({
    label: organisation.nom,
    id: organisation.id
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
    user_id: props.user_id,
    lookup_id: undefined,
    organisation_id: undefined,
})
async function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log(event?.data)
    console.log(props.user_id)
    const { data, error } = await supabase
        .from('affectations')
        .insert(event?.data)
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new affectation ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `New affectation added`, color: 'success' })
        open.value = false
        emit('affectation-added')
    }
}

const emit = defineEmits(['affectation-added'])
</script>