<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Patient } from '~/types'

definePageMeta({
    pageTransition: false
})

useHead({
    title: 'Patients',
    meta: [
        { name: 'description', content: 'Manage your patients.' }
    ]
})

const table = useTemplateRef('table')
const toast = useToast()
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UAvatar = resolveComponent('UAvatar')
const supabase = useSupabaseClient()
const UCheckbox = resolveComponent('UCheckbox')
const rowSelection = ref()
const UDropdownMenu = resolveComponent('UDropdownMenu')
const columnVisibility = ref()

const columnFilters = ref([{
    id: 'nom',
    value: ''
}])

//use useasyncData to fetch patients data from supabase
const { data: patients, error, refresh: refreshPatients } = await useAsyncData('patients', async () => {
    const { data, error } = await supabase.from('patients').select();
    if (error) {
        throw error;
    }
    return data;
});


function getRowItems(row: Row<Patient>) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copy patient ID',
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
            label: 'View patient details',
            icon: 'i-lucide-list'
        },
        {
            label: 'View patient payments',
            icon: 'i-lucide-wallet'
        },
        {
            type: 'separator'
        },
        {
            label: 'Delete patient',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Patient deleted',
                    description: 'The patient has been deleted.'
                })
            }
        }
    ]
}

const columns: TableColumn<Patient>[] = [
    {
        id: 'select',
        header: ({ table }) =>
            h(UCheckbox, {
                'modelValue': table.getIsSomePageRowsSelected()
                    ? 'indeterminate'
                    : table.getIsAllPageRowsSelected(),
                'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
                    table.toggleAllPageRowsSelected(!!value),
                'ariaLabel': 'Select all'
            }),
        cell: ({ row }) =>
            h(UCheckbox, {
                'modelValue': row.getIsSelected(),
                'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
                'ariaLabel': 'Select row'
            })
    },
    {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            to: { name: 'patients-id', params: { id: row.original.id } }
        }),
    },
    {
        accessorKey: 'mrn',
        header: 'Patient ID'
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h(UAvatar, {
                    src: row.original.avatar ?? undefined,
                    size: 'lg'
                }),
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom + ' ' + row.original.postnom),
                    h('p', { class: '' }, `@${row.original.nom}`)
                ])
            ])
        }
    },
    {
        accessorKey: 'prenom',
        header: 'Prenom'
    },
    {
        accessorKey: 'sexe',
        header: ({ column }) => {
            const isSorted = column.getIsSorted()

            return h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                label: 'Genre',
                icon: isSorted
                    ? isSorted === 'asc'
                        ? 'i-lucide-arrow-up-narrow-wide'
                        : 'i-lucide-arrow-down-wide-narrow'
                    : 'i-lucide-arrow-up-down',
                class: '-mx-2.5',
                onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
            })
        },
        cell: ({ row }) => row.original.sexe
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
            }[row.original.status]

            return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
                row.original.status
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

watch(() => statusFilter.value, (newVal) => {
    if (!table?.value?.tableApi) return

    const statusColumn = table.value.tableApi.getColumn('status')
    if (!statusColumn) return

    if (newVal === 'all') {
        statusColumn.setFilterValue(undefined)
    } else {
        statusColumn.setFilterValue(newVal)
    }
})

const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})
</script>

<template>
    <UDashboardPanel id="patients" as="div" :ui="{ body: 'p-5', root: 'p-5' }">
        <template #header>
            <UDashboardNavbar>
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UBreadcrumb :items="[{ label: 'Home', to: '/' }, { label: 'Patients', to: '/patients' }]" />
                </template>

                <template #right>
                    <PatientsAddModal @patient-added="refreshPatients()" />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="flex flex-wrap items-center justify-between gap-1.5">
                <UInput :model-value="(table?.tableApi?.getColumn('nom')?.getFilterValue() as string)" class="max-w-sm"
                    icon="i-lucide-search" placeholder="Filter noms..."
                    @update:model-value="table?.tableApi?.getColumn('nom')?.setFilterValue($event)" />

                <div class="flex flex-wrap items-center gap-1.5">
                    <PatientsDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
                        <UButton v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length" label="Delete"
                            color="error" variant="subtle" icon="i-lucide-trash">
                            <template #trailing>
                                <UKbd>
                                    {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                                </UKbd>
                            </template>
                        </UButton>
                    </PatientsDeleteModal>

                    <USelect v-model="statusFilter" :items="[
                        { label: 'All', value: 'all' },
                        { label: 'Subscribed', value: 'subscribed' },
                        { label: 'Unsubscribed', value: 'unsubscribed' },
                        { label: 'Bounced', value: 'bounced' }
                    ]" :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                        placeholder="Filter status" class="min-w-28" />
                    <UDropdownMenu :items="table?.tableApi
                        ?.getAllColumns()
                        .filter((column) => column.getCanHide())
                        .map((column) => ({
                            label: upperFirst(column.id),
                            type: 'checkbox' as const,
                            checked: column.getIsVisible(),
                            onUpdateChecked(checked: boolean) {
                                table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                            },
                            onSelect(e?: Event) {
                                e?.preventDefault()
                            }
                        }))
                        " :content="{ align: 'end' }">
                        <UButton label="Display" color="neutral" variant="outline"
                            trailing-icon="i-lucide-settings-2" />
                    </UDropdownMenu>
                </div>
            </div>

            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="{
                    getPaginationRowModel: getPaginationRowModel()
                }" class="shrink-0" :data="patients" :columns="columns" :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-1 first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                    td: 'border-b border-(--ui-border)'
                }" />

            <div class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4 mt-auto">
                <div class="text-sm text-(--ui-text-muted)">
                    {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
                    {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
                </div>

                <div class="flex items-center gap-1.5">
                    <UPagination :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
                        :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                        :total="table?.tableApi?.getFilteredRowModel().rows.length"
                        @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)" />
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
