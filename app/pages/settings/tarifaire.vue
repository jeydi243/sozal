<template>
    <div>
        <!-- :default-size="25" :min-size="20" :max-size="25" resizable  -->
        <UDashboardPanel id="inbox-900" :ui-pro="{ body: 'p-0' }">
            <template #header>
                <UDashboardNavbar title="Tarifaires">
                    <template #leading>
                        <!-- <UDashboardSidebarCollapse /> -->
                    </template>

                    <template #right>
                        <div class="flex flex-wrap items-center justify-between gap-1.5">
                            <UInput :model-value="(table?.tableApi?.getColumn('name')?.getFilterValue() as string)"
                                class="max-w-sm" icon="i-lucide-search" placeholder="Filter classes..."
                                @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)" />

                            <div class="flex flex-wrap items-center gap-1.5">

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
                        <TarifairesAddModal @tarifaire-added="refreshTarifaires" />
                    </template>
                </UDashboardNavbar>
            </template>
            <template #body>
                <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                    v-model:row-selection="rowSelection" v-model:pagination="pagination" empty="Aucun tarifaire trouvé"
                    :pagination-options="paginationOptions" class="shrink-0 m-2" :data="Tarifaires || []"
                    :columns="columns" :loading="status === 'pending'" :ui="{
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
        <TarifairesDetails :tarifaire="selectedTarifaire" v-model:open="openDetailsTarifaire" />
    </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { upperFirst } from 'scule'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Tarifaire } from '~/types'

useHead({
    title: 'Tarifaires',
    meta: [
        { name: 'description', content: 'Manage tarifaires.' }
    ]
})

const supabase = useSupabaseClient()
const table = useTemplateRef('table')
const status = ref('success')
const statusFilter = ref('all')
const columnFilters = ref([{
    id: 'name',
    value: ''
}])
const { getLookupsById } = useParametresStore()

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const columnVisibility = ref()
const openDetailsTarifaire = ref(false)
const selectedTarifaire = ref<Tarifaire | null>(null)
const rowSelection = ref({ 2: true })
const toast = useToast()
const pagination = ref({
    pageIndex: 0,
    pageSize: 10
})
const paginationOptions = {
    getPaginationRowModel: getPaginationRowModel()
}
const columns: TableColumn<Tarifaire>[] = [
    {
        id: 'details',
        header: 'Details',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedTarifaire.value = row.original;
                openDetailsTarifaire.value = !openDetailsTarifaire.value;
                // console.log(row.original, openDetailsUser.value)
            }
        }),
    },
    {
        accessorKey: 'name',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.name),
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
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.code),
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
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.description),
                ])
            ])
        }
    },
    {
        accessorKey: 'lookup_id',
        header: 'Type',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, getLookupsById(row.original.lookup_id)),
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

function getRowItems(row: Row<Tarifaire>) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copie ID Tarifaire',
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.original.id.toString())
                toast.add({
                    title: 'Copied to clipboard',
                    description: 'Tarifaire ID copied to clipboard'
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
                openDetailsTarifaire.value = !openDetailsTarifaire.value
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
            label: 'Delete tarifaire',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Tarifaire deleted',
                    description: 'The tarifaire has been deleted.'
                })
            }
        }
    ];
}

const { data: Tarifaires, error, refresh: refreshTarifaires } = await useAsyncData('tarifaires', async () => {
    const { data, error } = await supabase.from('tarifaires').select();
    if (error) {
        throw error;
    }
    return data;
});

</script>
