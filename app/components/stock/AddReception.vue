<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, SelectMenuItem } from '@nuxt/ui'
import type { Lookup } from '~/types'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

const schema = z.object({
    fournisseur_id: z.string().min(3, 'Too short'),
    in_organisation_id: z.string(),
    numero_commande: z.string(),
    numero_livraison: z.string(),
    date_trx: z.date(),
})
const open = ref(false)
const toast = useToast()
type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const state = reactive<Partial<Schema>>({
    fournisseur_id: undefined,
    in_organisation_id: undefined,
    numero_commande: undefined,
    numero_livraison: undefined,
    date_trx: undefined,
})
const toCalendarDate = (date: Date) => {
    return new CalendarDate(
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
    )
}
const { data: lookups } = await useAsyncData('lookups', async () => {
    const { data } = await supabase.from('lookups').select('id, nom')
    return data
})
const dateTrxModel = computed({
    get: () => state.date_trx ? toCalendarDate(state.date_trx) : undefined,
    set: (value: CalendarDate | null) => {
        state.date_trx = value ? value.toDate(getLocalTimeZone()) : undefined
    }
})
const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
const items = computed<SelectMenuItem[]>(() => lookups.value?.map((lookup: Lookup) => ({
    label: lookup.nom,
    id: lookup.id
})) || [])

const emit = defineEmits(['reception-added'])

async function onSubmit(event: FormSubmitEvent<Schema>) {
    const { data, error } = await supabase
        .from('stk_trx_header')
        .insert([{
            fournisseur_id: event.data.fournisseur_id,
            in_organisation_id: event.data.in_organisation_id,
            numero_commande: event.data.numero_commande,
            numero_livraison: event.data.numero_livraison
        }])
        .select()

    if (error) {
        toast.add({ title: 'Error', description: `Can't add new organisation ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `Nouvelle reception externe créée`, color: 'success' })
        emit('reception-added')
        open.value = false
    }
}
</script>


<template>
    <UModal v-model:open="open" title="Reception Externe" description="Ajouter une reception externe">
        <UButton label="Nouvelle Reception" icon="i-lucide-plus" />

        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Fournisseur" placeholder="_" name="fournisseur_id">
                    <USelectMenu v-model="state.fournisseur_id" value-key="id" :items="items" class="w-full" />
                </UFormField>
                <UFormField label="Organisation" placeholder="" name="in_organisation_id">
                    <USelectMenu v-model="state.in_organisation_id" value-key="id" :items="items" class="w-full" />
                </UFormField>
                <UFormField label="Numero Commande" placeholder="" name="numero_commande">
                    <UInput v-model="state.numero_commande" class="w-full" />
                </UFormField>
                <UFormField label="Numero Livraison" placeholder="" name="numero_livraison">
                    <UInput v-model="state.numero_livraison" class="w-full" />
                </UFormField>
                <UFormField label="Date de reception" placeholder="08/12/2025" name="date_trx">
                    <UInputDate v-model="dateTrxModel" class="w-full" :max-date="maxDate">
                        <template #trailing>
                            <UPopover>
                                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar"
                                    aria-label="Select a date" class="px-0" />

                                <template #content>
                                    <UCalendar v-model="dateTrxModel" class="p-2" :max-date="maxDate" />
                                </template>
                            </UPopover>
                        </template>
                    </UInputDate>
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
                    <UButton label="Ajouter" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
