<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { PatientListeAttente } from '~/types'
useHead({
    title: 'Consultations'
})

const table = useTemplateRef('table')
const toast = useToast()
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const supabase = useSupabaseClient()
const rowSelection = ref()
const UDropdownMenu = resolveComponent('UDropdownMenu')
const columnVisibility = ref()

const columnFilters = ref([{
    id: 'nom',
    value: ''
}])
const organisations = [
    {
        label: 'Organisation 1',
        value: 'organisation-1'
    },
    {
        label: 'Organisation 2',
        value: 'organisation-2'
    }
]
function getRowItems(row: Row<PatientListeAttente>) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copy partenaire ID',
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.original.id.toString())
                toast.add({
                    title: 'Copied to clipboard',
                    description: 'Patient ID copied to clipboard'
                })
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'View partenaire details',
            icon: 'i-lucide-list'
        },
        {
            label: 'View partenaire payments',
            icon: 'i-lucide-wallet'
        },
        {
            type: 'separator'
        },
        {
            label: 'Delete partenaire',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Patient deleted',
                    description: 'The partenaire has been deleted.'
                })
            }
        }
    ]
}

const columns: TableColumn<PatientListeAttente>[] = [
    {
        id: 'Actions',
        header: 'Actions',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'solid',
            label: 'Consulter',
            to: { name: 'partenaire-id', params: { id: row.original.id } }
        }),
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                // h(UAvatar, {
                //     ...row.original.avatar,
                //     size: 'lg'
                // }),
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom + ' ' + row.original.postnom + ' ' + row.original.prenom)
                ])
            ])
        }
    },
    {
        accessorKey: 'mrn',
        header: 'MRN',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                // h(UAvatar, {
                //     ...row.original.avatar,
                //     size: 'lg'
                // }),
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.mrn)
                ])
            ])
        }
    },
    {
        accessorKey: 'date_naissance',
        header: 'Date de naissance',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.date_naissance)
                ])
            ])
        }
    },
    {
        accessorKey: 'sexe',
        header: 'Sexe',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.sexe)
                ])
            ])
        }
    },
    {
        accessorKey: 'status',
        header: 'Status',
        filterFn: 'equals',
        cell: ({ row }) => {
            const color = {
                subscribed: 'success' as const,
                unsubscribed: 'error' as const,
                bounced: 'warning' as const
            }[row.original?.statut]

            return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
                row.original?.statut
            )
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return h(
                'div',
                { class: 'text-right' },
                h(
                    UDropdownMenu,
                    {
                        content: {
                            align: 'end'
                        },
                        items: getRowItems(row)
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

const statusFilter = ref('all')
const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})
const { data: listePatientsAttente, error, refresh: refreshListePatientsAttente } = await useAsyncData('liste-attente', async () => {
    const { data, error } = await supabase.from('organisations').select('id, nom, description, lookups!inner(*)').eq('lookups.nom', 'Entreprise')
    if (error) {
        throw error;
    }
    return data;
});
const selectedOrganisation = ref(organisations[0])
</script>

<template>
    <UDashboardPanel id="consultations" as="div" :ui="{ body: 'p-5' }">
        <template #header>
            <UDashboardNavbar title="Consultations" :ui="{ right: 'gap-3' }">
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <USelectMenu :items="organisations" v-model="selectedOrganisation" />
                </template>
                <template #right>
                    <UButton label="Ajouter une consultation" icon="i-lucide-plus" color="primary" variant="solid" />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <!-- Card 1 -->
                <div class="bg-(--ui-bg) ring-1 ring-(--ui-border) rounded-xl p-5 flex flex-col justify-between">
                    <div class="flex justify-between items-start">
                        <div class="space-y-1">
                            <p class="text-xs font-semibold text-(--ui-text-muted) tracking-wider uppercase">Total Waiting</p>
                            <div class="text-4xl font-bold text-(--ui-primary)">14</div>
                        </div>
                        <UIcon name="i-lucide-users" class="w-8 h-8 text-(--ui-text-muted)/30" />
                    </div>
                    <div class="mt-4 text-sm">
                        <span class="text-(--ui-error) font-medium">+2&uarr;</span> <span class="text-(--ui-text-muted)">since last hour</span>
                    </div>
                </div>

                <!-- Card 2 -->
                <div class="bg-(--ui-bg) ring-1 ring-(--ui-border) rounded-xl p-5 flex flex-col justify-between">
                    <div class="space-y-1">
                        <p class="text-xs font-semibold text-(--ui-text-muted) tracking-wider uppercase">Avg. Wait Time</p>
                        <div class="text-4xl font-bold text-(--ui-text-highlighted)">22 <span class="text-xl font-medium text-(--ui-text-muted)">mins</span></div>
                    </div>
                    <div class="mt-4 text-sm mt-auto">
                        <span class="text-(--ui-primary) font-medium">-5%&darr;</span> <span class="text-(--ui-text-muted)">vitals processing up</span>
                    </div>
                </div>

                <!-- Card 3 -->
                <div class="bg-(--ui-bg) ring-1 ring-(--ui-border) rounded-xl p-5 flex flex-col justify-between">
                    <div class="space-y-3">
                        <div class="space-y-1">
                            <p class="text-xs font-semibold text-(--ui-text-muted) tracking-wider uppercase">Rooms Occupied</p>
                            <div class="text-4xl font-bold text-(--ui-text-highlighted)">8 <span class="text-2xl font-medium text-(--ui-text-muted)">/ 12</span></div>
                        </div>
                        <div class="block mt-4">
                            <div class="w-full bg-(--ui-bg-elevated) rounded-full h-2">
                                <div class="bg-(--ui-primary) h-2 rounded-full" style="width: 66.6%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card 4 -->
                <div class="bg-(--ui-warning)/10 ring-1 ring-(--ui-warning)/40 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                    <div class="space-y-1">
                        <p class="text-xs font-bold text-(--ui-warning) tracking-wider uppercase drop-shadow-sm">High Priority</p>
                        <div class="text-4xl font-bold text-(--ui-warning) drop-shadow-sm">3</div>
                    </div>
                    <div class="mt-4 text-sm flex items-center gap-2 text-(--ui-warning) font-medium">
                        <div class="w-2 h-2 rounded-full bg-(--ui-warning)"></div>
                        Requires Triage Action
                    </div>
                </div>
            </div>

            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="{
                    getPaginationRowModel: getPaginationRowModel()
                }" class="shrink-0" :data="listePatientsAttente || []" :columns="columns" :ui="{
                    base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg',
                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                    td: 'border-b border-(--ui-border) py-2 m-1'
                }" />
        </template>
    </UDashboardPanel>
</template>

<style scoped></style>