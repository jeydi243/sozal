<template>
    <UDashboardPanel id="organisations" :ui-pro="{ body: 'p-0' }">
        <template #header>
            <UDashboardNavbar title="Organisations">
                <template #leading>
                    <!-- <UDashboardSidebarCollapse /> -->
                </template>

                <template #right>
                    <div class="flex flex-wrap items-center justify-between gap-1.5">
                        <UInput :model-value="(table?.tableApi?.getColumn('description')?.getFilterValue() as string)"
                            class="max-w-sm" icon="i-lucide-search" placeholder="Rechercher une organisation..."
                            @update:model-value="table?.tableApi?.getColumn('description')?.setFilterValue($event)" />

                        <div class="flex flex-wrap items-center gap-1.5">
                            <USelect v-model="statusFilter" :items="[
                                { label: 'Toutes', value: 'all' },
                                { label: 'Subscribed', value: 'subscribed' },
                                { label: 'Actif', value: 'actif' },
                                { label: 'Bounced', value: 'bounced' }
                            ]" :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                                placeholder="Filtrer par statut" class="min-w-28"
                                @update:model-value="setStatusFilter('status', $event)" />

                            <UDropdownMenu :items="columnDisplayItems" :content="{ align: 'end' }">
                                <UButton label="Affichage" color="neutral" variant="outline"
                                    trailing-icon="i-lucide-settings-2" />
                            </UDropdownMenu>
                        </div>
                    </div>
                    <OrganisationsAddModal @organisation-added="refreshOrganisations" />
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                v-model:row-selection="rowSelection" v-model:pagination="pagination"
                :pagination-options="paginationOptions" class="shrink-0 m-2" :data="organisations || []"
                :columns="columns" :loading="pending" :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-1 first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                    td: 'border-b border-(--ui-border) p-2'
                }" />

            <div class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4 mt-auto">
                <div class="text-sm text-(--ui-text-muted)">
                    {{ selectedRowCount }} sur {{ totalFilteredRows }} ligne(s) sélectionnée(s).
                </div>

                <div class="flex items-center gap-1.5">
                    <UPagination :default-page="currentPage" :items-per-page="currentPageSize"
                        :total="totalFilteredRows" @update:page="setPage" />
                </div>
            </div>
        </template>
    </UDashboardPanel>

    <USlideover v-model:open="openSlideOver" title="Détails de l'organisation" :ui="{ content: 'max-w-2xl' }">
        <template #content>
            <div class="p-4">
                <p v-if="selectedOrganisation" class="text-lg font-semibold">{{ selectedOrganisation.nom }}</p>
                <div v-if="selectedOrganisation" class="mt-4 space-y-2 text-sm text-(--ui-text-muted)">
                    <p><strong>Code:</strong> {{ selectedOrganisation.code || 'N/A' }}</p>
                    <p><strong>Description:</strong> {{ selectedOrganisation.description || 'N/A' }}</p>
                    <p><strong>Statut:</strong> {{ selectedOrganisation.status || 'Actif' }}</p>
                </div>
            </div>
        </template>
    </USlideover>
</template>

<script setup lang="ts">
import { type Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Organisation } from '~/types'
import { storeToRefs } from 'pinia'

useHead({
    title: 'Organisations - Paramètres',
    meta: [
        { name: 'description', content: 'Gérer les organisations.' }
    ]
})

const supabase = useSupabaseClient()
const toast = useToast()
const parametresStore = useParametresStore()
const { lookups } = storeToRefs(parametresStore)

// Utilisation du composable centralisé
const {
    table,
    UButton,
    UBadge,
    UDropdownMenu,
    UCheckbox,
    columnFilters,
    columnVisibility,
    rowSelection,
    pagination,
    paginationOptions,
    statusFilter,
    columnDisplayItems,
    selectedRowCount,
    totalFilteredRows,
    currentPage,
    currentPageSize,
    setPage,
    setStatusFilter
} = useDataTable({ filterColumnId: 'description', pageSize: 10 })

const openSlideOver = ref(false)
const selectedOrganisation = ref<Organisation | null>(null)

const columns: TableColumn<Organisation>[] = [
    {
        id: 'select',
        header: ({ table }) =>
            h(UCheckbox, {
                modelValue: table.getIsAllPageRowsSelected(),
                indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
                'onUpdate:modelValue': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
                'aria-label': 'Tout sélectionner'
            }),
        cell: ({ row }) =>
            h('div', { class: 'flex items-center justify-center' }, h(UCheckbox, {
                modelValue: row.getIsSelected(),
                'onUpdate:modelValue': (value: boolean) => row.toggleSelected(!!value),
                'aria-label': 'Sélectionner ligne'
            }))
    },
    {
        id: 'details',
        header: 'Détails',
        cell: ({ row }) => h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            icon: 'i-lucide-maximize-2',
            class: '-mx-2.5',
            onClick: () => {
                selectedOrganisation.value = row.original
                openSlideOver.value = true
            }
        }),
    },
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.code)
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom)
    },
    {
        accessorKey: 'description',
        header: ({ column }) => {
            const isSorted = column.getIsSorted()
            return h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                label: 'Description',
                icon: isSorted
                    ? isSorted === 'asc'
                        ? 'i-lucide-arrow-up-narrow-wide'
                        : 'i-lucide-arrow-down-wide-narrow'
                    : 'i-lucide-arrow-up-down',
                class: '-mx-2.5',
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
            })
        }
    },
    {
        id: 'type',
        header: 'Type',
        cell: ({ row }) => {
            const lookup = (row.original as any).lookup
            const lookupNom = Array.isArray(lookup) ? lookup[0]?.nom : lookup?.nom
            return lookupNom || lookups.value.find(l => l.id === (row.original as any).lookup_id)?.nom || 'N/A'
        }
    },
    {
        accessorKey: 'status',
        header: 'Statut',
        filterFn: 'equals',
        cell: ({ row }) => {
            const statusStr = row.original.status || 'actif'
            const color = {
                subscribed: 'success' as const,
                actif: 'success' as const,
                unsubscribed: 'error' as const,
                bounced: 'warning' as const
            }[statusStr] || 'neutral'

            return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => statusStr)
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
                        content: { align: 'end' },
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

function getRowItems(row: Row<Organisation>) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copie ID Organisation',
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.original.id.toString())
                toast.add({
                    title: 'Copié !',
                    description: 'ID de l\'organisation copié dans le presse-papiers'
                })
            }
        },
        { type: 'separator' },
        {
            label: 'Détails',
            icon: 'i-lucide-maximize-2',
            onSelect() {
                selectedOrganisation.value = row.original
                openSlideOver.value = true
            }
        },
        { type: 'separator' },
        {
            label: 'Supprimer',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Action non disponible',
                    description: 'La suppression sera implémentée prochainement.'
                })
            }
        }
    ]
}

const { data: organisations, pending, refresh: refreshOrganisations } = await useAsyncData('organisations', async () => {
    const { data, error } = await supabase.from('organisations').select('*, lookup:lookup_id(*)')
    if (error) {
        throw error
    }
    return data
})
</script>
