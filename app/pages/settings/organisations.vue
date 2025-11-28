<template>
    <!-- :default-size="25" :min-size="20" :max-size="25" resizable  -->
    <UDashboardPanel id="inbox-70" :ui-pro="{ body: 'p-0' }">
        <template #header>
            <UDashboardNavbar title="Organisations">
                <template #leading>
                    <!-- <UDashboardSidebarCollapse /> -->
                </template>

                <template #right>
                    <div class="flex flex-wrap items-center justify-between gap-1.5">
                        <UInput :model-value="(table?.tableApi?.getColumn('email')?.getFilterValue() as string)"
                            class="max-w-sm" icon="i-lucide-search" placeholder="Filter classes..."
                            @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)" />

                        <div class="flex flex-wrap items-center gap-1.5">
                            <CustomersDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
                                <UButton v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
                                    label="Delete" color="error" variant="subtle" icon="i-lucide-trash">
                                    <template #trailing>
                                        <UKbd>
                                            {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length }}
                                        </UKbd>
                                    </template>
                                </UButton>
                            </CustomersDeleteModal>

                            <USelect v-model="statusFilter" :items="[
                                { label: 'All', value: 'all' },
                                { label: 'Subscribed', value: 'subscribed' },
                                { label: 'Actif', value: 'actif' },
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
                    <OrganisationsAddModal />
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="{
                    getPaginationRowModel: getPaginationRowModel()
                }" class="shrink-0 m-2" :data="organisations" :columns="columns" :loading="status === 'pending'" :ui="{
                    base: 'table-fixed border-separate border-spacing-0',
                    thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                    tbody: '[&>tr]:last:[&>td]:border-b-0',
                    th: 'py-1 first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                    td: 'border-b border-(--ui-border) p-2'
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
    <UDrawer v-model:open="openDetailsClasse" title="Drawer with description"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit.">
        <template #body>
            <Placeholder class="h-48 m-4" />
        </template>
    </UDrawer>
    <USlideover v-model:open="openSlideOver" title="Details de classe" :ui="{ content: 'max-w-2xl' }">
        <UButton label="Open" color="neutral" variant="subtle" />

        <template #content>
            <div class="max-w-2xl">
                <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                    v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="{
                        getPaginationRowModel: getPaginationRowModel()
                    }" class="shrink-0 m-2" :data="organisations" :columns="columns" :loading="status === 'pending'"
                    :ui="{
                        base: 'table-fixed border-separate border-spacing-0',
                        thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-1 first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                        td: 'border-b border-(--ui-border) p-2'
                    }" />
            </div>
        </template>
    </USlideover>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import { breakpointsTailwind } from '@vueuse/core'
import * as z from 'zod'

import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Classe } from '~/types'

const supabase = useSupabaseClient()
const table = useTemplateRef('table')
const statusFilter = ref('all')
const columnFilters = ref([{
    id: 'email',
    value: ''
}])
// const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
// const UCheckbox = resolveComponent('UCheckbox')
const columnVisibility = ref()
const openDetailsClasse = ref(false)
const openSlideOver = ref(false)
const rowSelection = ref({ 2: true })
const toast = useToast()
const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})
const columns: TableColumn<Classe>[] = [
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
            h('div', { class: 'text-center items-center align-center' }, h(UCheckbox, {
                'modelValue': row.getIsSelected(),
                'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
                'ariaLabel': 'Select row'
            }))

    },
    {
        id: 'details',
        header: 'Details',
        // icon: 'material-symbols:open-in-full-rounded',
        cell: ({ row }) => h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            icon: 'material-symbols:open-in-full-rounded text-center',
            class: '-mx-2.5',
            onClick: () => {
                // openDetailsClasse.value = !openDetailsClasse.value;
                openSlideOver.value = !openSlideOver.value;
            }
        }),
    },

    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.code),
                    // h('p', { class: '' }, `@${row.original.name}`)
                ])
            ])
        }
    },
    {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.name),
                    // h('p', { class: '' }, `@${row.original.name}`)
                ])
            ])
        }
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
        accessorKey: 'lookup_id',
        header: 'Type',
        cell: ({ row }) => row.original.lookup_id
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
function getRowItems(row: Row<Classe>) {
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
                    title: 'Copied to clipboard',
                    description: 'Classe ID copied to clipboard'
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
                openDetailsClasse.value = !openDetailsClasse.value
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
            label: 'Delete classe',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Customer deleted',
                    description: 'The customer has been deleted.'
                })
            }
        }
    ]
}

async function addClasse(event: FormSubmitEvent<Schema>) {
    toast.add({ title: 'Success', description: 'The form has been submitted.', color: 'success' })
    console.log(event.data)
}

// const selectedMail = ref<Mail | null>()
const { data: organisations, error } = await supabase.from('organisations').select()
const defaultOrganisationSchema = z.object({
    description: z.string().email('Invalid email'),
    code: z.string().email('Invalid email'),
    name: z.string().email('Invalid email'),
})
type OrganisationSchema = z.output<typeof defaultOrganisationSchema>

// Reset selected mail if it's not in the filtered mails
const defaultOrganisation = reactive({
    description: '',
    code: '',
    name: ''
})
const breakpoints = useBreakpoints(breakpointsTailwind)

</script>
