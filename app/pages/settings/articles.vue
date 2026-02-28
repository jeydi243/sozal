<template>
    <div>
        <UDashboardPanel id="inbox-900" :ui-pro="{ body: 'p-0' }">
            <template #header>
                <UDashboardNavbar title="Articles">
                    <template #leading>
                        <!-- <UDashboardSidebarCollapse /> -->
                    </template>

                    <template #right>
                        <div class="flex flex-wrap items-center justify-between gap-1.5">
                            <UInput :model-value="(table?.tableApi?.getColumn('nom')?.getFilterValue() as string)"
                                class="max-w-sm" icon="i-lucide-search" placeholder="Rechercher un article..."
                                @update:model-value="table?.tableApi?.getColumn('nom')?.setFilterValue($event)" />

                            <div class="flex flex-wrap items-center gap-1.5">
                                <USelect v-model="statusFilter" :items="[
                                    { label: 'Tous', value: 'all' },
                                    { label: 'Actif', value: 'actif' },
                                    { label: 'Inactif', value: 'inactif' },
                                ]"
                                    :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                                    placeholder="Filtrer le statut" class="min-w-28" />
                                <UDropdownMenu :items="columnDisplayItems" :content="{ align: 'end' }">
                                    <UButton label="Colonnes" color="neutral" variant="outline"
                                        trailing-icon="i-lucide-settings-2" />
                                </UDropdownMenu>
                            </div>
                        </div>
                        <ArticlesAddModal @article-added="refreshArticles" />
                    </template>
                </UDashboardNavbar>
            </template>
            <template #body>
                <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                    v-model:row-selection="rowSelection" v-model:pagination="pagination"
                    :pagination-options="paginationOptions" class="shrink-0 m-2" :data="Articles || []"
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
        <!-- <ArticlesDetails :article="selectedArticle" v-model:open="openDetailsArticle" /> -->
    </div>
</template>
<script setup lang="ts">
import { upperFirst } from 'scule'
import { type Row } from '@tanstack/table-core'
import type { TableColumn } from '@nuxt/ui'
import type { Article } from '~/types'

useHead({
    title: 'Articles',
    meta: [
        { name: 'description', content: 'Gérer les articles de prestation.' }
    ]
})

const supabase = useSupabaseClient()
const { getLookupsById } = useParametresStore()
const toast = useToast()

// ✅ Utilisation du composable centralisé
const {
    table,
    UButton,
    UDropdownMenu,
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
    setPage
} = useDataTable({ filterColumnId: 'nom', pageSize: 10 })

const openDetailsArticle = ref(false)
const selectedArticle = ref<Article | null>(null)

const columns: TableColumn<Article>[] = [
    {
        id: 'details',
        header: 'Détails',
        cell: ({ row }) => h(UButton, {
            color: 'primary',
            variant: 'ghost',
            icon: 'i-lucide-eye',
            onClick: () => {
                selectedArticle.value = row.original
                openDetailsArticle.value = !openDetailsArticle.value
            }
        }),
    },
    {
        accessorKey: 'nom',
        header: 'Nom',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original?.nom),
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
                        content: { align: 'end' },
                        items: getRowItems(row)
                    },
                    () => h(UButton, {
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

function getRowItems(row: Row<Article>) {
    return [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copier l\'ID',
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.original.id.toString())
                toast.add({
                    title: 'Copié',
                    description: `ID article #${row.original.id} copié dans le presse-papiers`
                })
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Voir les détails',
            icon: 'material-symbols:open-in-full-rounded',
            onSelect() {
                selectedArticle.value = row.original
                openDetailsArticle.value = true
            }
        },
        {
            label: 'Voir les affectations',
            icon: 'i-lucide-wallet',
            onSelect() {
                openDetailsArticle.value = !openDetailsArticle.value
            }
        },
        {
            type: 'separator'
        },
        {
            label: 'Supprimer l\'article',
            icon: 'i-lucide-trash',
            color: 'error',
            async onSelect() {
                const { error } = await supabase.from('articles').delete().eq('id', row.original.id)
                if (error) {
                    toast.add({
                        title: 'Erreur',
                        description: `Impossible de supprimer l'article : ${error.message}`,
                        color: 'error'
                    })
                } else {
                    toast.add({
                        title: 'Article supprimé',
                        description: `L'article "${row.original.nom}" a été supprimé.`,
                        color: 'success'
                    })
                    await refreshArticles()
                }
            }
        }
    ]
}

const { data: Articles, pending, refresh: refreshArticles } = await useAsyncData('articles', async () => {
    const { data, error } = await supabase.from('articles').select()
    if (error) {
        throw error
    }
    return data
})
</script>
