<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { RendezVous } from '~/types'

const table = useTemplateRef('table')
const toast = useToast()
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const supabase = useSupabaseClient()
const UCheckbox = resolveComponent('UCheckbox')
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
function getRowItems(row: Row<RendezVous>) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copier le rendez-vous ID',
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
            label: 'Voir les details du patient',
            icon: 'i-lucide-list'
        },
        {
            label: 'Voir les paiements du patient',
            icon: 'i-lucide-wallet'
        },
        {
            type: 'separator'
        },
        {
            label: 'Supprimer le rendez-vous',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Rendez-vous supprimé',
                    description: 'The partenaire has been deleted.'
                })
            }
        }
    ]
}

const columns: TableColumn<RendezVous>[] = [
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
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.patient?.nom + ' ' + row.original.patient?.postnom + ' ' + row.original.patient?.prenom)
                ])
            ])
        }
    },
    {
        accessorKey: 'mrn',
        header: 'MRN',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.patient?.mrn)
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
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.patient?.date_naissance)
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
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.patient?.sexe)
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
const { data: ListeRendezVous, error, refresh: refreshListeRendezVous } = await useAsyncData('organisations', async () => {
    const { data, error } = await supabase.from('organisations').select('id, nom, description, lookups!inner(*)').eq('lookups.name', 'Entreprise')
    if (error) {
        throw error;
    }
    console.log({ data })
    return data;
});
const selectedOrganisation = ref(organisations[0])
</script>

<template>
    <UDashboardPanel id="rendez-vous" as="div" :ui="{ body: 'p-5' }">
        <template #header>
            <UDashboardNavbar title="Rendez-vous" :ui="{ right: 'gap-3' }">
                <template #leading>

                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <template #left>
                    <USelectMenu :items="organisations" v-model="selectedOrganisation" />
                </template>
                <template #right>
                    <UButton label="Ajouter un rendez-vous" icon="lucide:calendar-plus" color="primary"
                        variant="solid" />
                        <RdvAddModal />
                </template>
            </UDashboardToolbar>
        </template>

        <template #body>
            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="{
                    getPaginationRowModel: getPaginationRowModel()
                }" class="shrink-0" :data="ListeRendezVous || []" :columns="columns" :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-1 first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                    td: 'border-b border-(--ui-border) py-2 m-1'
                }" />
        </template>
    </UDashboardPanel>
</template>

<style scoped></style>