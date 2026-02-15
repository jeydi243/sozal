<template>
    <div class="flex flex-row justify-between">
        <UButton label="Refresh" icon="iconamoon:synchronize-light" @click="refreshPatients()" />
        <div>
            <PartenairesAttachPatientOrg @patient-added="refreshPatients()" class="mr-1"
                :organisation="props.organisation" />
            <PatientsAddModal />
        </div>
    </div>
    {{ props.organisation.id }}
    <UTable ref="table-partenaires-patients" v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility" v-model:row-selection="rowSelection"
        v-model:pagination="pagination" :pagination-options="paginationOptions" class="shrink-0 m-2"
        :data="Patients || []" :columns="columns" :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-1 first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
            td: 'border-b border-(--ui-border) p-2'
        }" />
</template>
<script setup lang="ts">
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Patient, PatientOrg } from '~/types'

const props = defineProps({
    organisation: {
        type: Object,
        required: true
    }
})
const supabase = useSupabaseClient()
const columnFilters = ref([{
    id: 'nom',
    value: ''
}])
const toast = useToast()
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const selectedPatient = ref<Patient | null>(null)
const openDetailsPatient = ref(false)
const paginationOptions = {
    getPaginationRowModel: getPaginationRowModel()
}
const columnVisibility = ref()
const rowSelection = ref({ 2: true })
const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})
function getRowItems(row: Patient) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copie ID Article',
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.id.toString())
                toast.add({
                    title: 'Copied to clipboard',
                    description: 'Article ID copied to clipboard'
                })
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Details',
            icon: 'material-symbols:open-in-full-rounded',
            onSelect() {
                openDetailsPatient.value = !openDetailsPatient.value
            }
        },
        {
            label: 'View customer payments',
            icon: 'i-lucide-wallet'
        },
        {
            type: 'separator'
        },
        {
            label: 'Delete article',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Article deleted',
                    description: 'The article has been deleted.'
                })
            }
        }
    ];
}
const columns: TableColumn<PatientOrg>[] = [
    {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedPatient.value = row.original.patient_id;
                openDetailsPatient.value = !openDetailsPatient.value;
                // console.log(row.original, openDetailsUser.value)
            }
        }),
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.patient_id?.nom),
                ])
            ])
        }
    },
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.patient_id.code),
                ])
            ])
        }
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.patient_id.nom),
                ])
            ])
        }
    },
    {
        header: () => h('div', { class: 'text-center' }, 'Actions'),
        id: 'actions',
        cell: ({ row }) => {
            return h(
                'div',
                { class: 'text-center' },
                h(
                    UDropdownMenu,
                    {
                        content: {
                            align: 'end'
                        },
                        items: getRowItems(row.original.patient_id)
                    },
                    () =>
                        h(UButton, {
                            icon: 'i-lucide-ellipsis-vertical',
                            color: 'neutral',
                            variant: 'ghost',
                            class: 'ml-auto'
                        })
                )
            )
        }
    }
]
const { data: Patients, error, refresh: refreshPatients } = await useAsyncData('patients-by-partenaires', async () => {
    const { data, error } = await supabase.from('patients_organisations').select('id, patients!inner(*)!').eq('organisation_id', props.organisation.id);
    if (error) {
        throw error;
    }
    return data;
});
</script>

<style></style>