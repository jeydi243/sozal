<script setup lang="ts">
import { type Row } from '@tanstack/table-core'
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { STKHeader, STKLine } from '~/types'

const props = defineProps({
    open: { type: Boolean, required: true },
    stk_trx_header: { type: Object as PropType<STKHeader | null>, required: true }
})
const emit = defineEmits(['update:open'])

// 1. SEO
// (Skip SEO as it's a slideover component)

// 2. Services et composables
const supabase = useSupabaseClient()
const toast = useToast()

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

// 3. resolveComponent() — obligatoire avant tout usage dans h()
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

// 4. Refs d'état UI
const openAddModal = ref(false)

// 5. useDataTable
const {
    table,
    columnFilters,
    columnVisibility,
    rowSelection,
    pagination,
    paginationOptions,
    selectedRowCount,
    totalFilteredRows,
    currentPage,
    currentPageSize,
    setPage,
} = useDataTable({ pageSize: 5 })

// 6. Définition des colonnes
const columns: TableColumn<STKLine>[] = [
    {
        accessorKey: 'article.nom',
        header: 'Article',
        cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
            h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.article?.nom || 'N/A'),
            h('p', { class: 'text-xs text-(--ui-text-muted)' }, row.original.article?.code || '')
        ])
    },
    {
        accessorKey: 'quantite_trx',
        header: 'Quantité',
        cell: ({ row }) => h('p', { class: 'text-center' }, row.original.quantite_trx)
    },
    {
        accessorKey: 'prix',
        header: 'Prix Unit.',
        cell: ({ row }) => h('p', { class: 'text-right' }, `${row.original.prix.toLocaleString()} FCFA`)
    },
    {
        id: 'total',
        header: 'Total',
        cell: ({ row }) => {
            const total = (row.original.quantite_trx || 0) * (row.original.prix || 0)
            return h('p', { class: 'text-right font-bold' }, `${total.toLocaleString()} FCFA`)
        }
    },
    {
        id: 'actions',
        header: () => h('div', { class: 'text-center' }, 'Actions'),
        cell: ({ row }) => h('div', { class: 'text-center' }, 
            h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row) },
                () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost' })
            )
        )
    }
]

// 7. Fonctions utilitaires
function getRowItems(row: Row<STKLine>): DropdownMenuItem[][] {
    return [[
        {
            type: 'label' as const,
            label: 'Ligne Actions'
        },
        {
            label: 'Supprimer',
            icon: 'i-lucide-trash',
            color: 'error' as const,
            async onSelect() {
                const { error } = await supabase.from('stk_trx_lines').delete().eq('id', (row.original as any).id)
                if (error) {
                    toast.add({ title: 'Erreur', description: error.message, color: 'error' })
                } else {
                    toast.add({ title: 'Supprimé', description: 'Ligne supprimée', color: 'success' })
                    await refresh()
                }
            }
        }
    ]]
}

// 8. Chargement des données — SEMPRE EN DERNIER
const { data: lines, pending, refresh } = await useAsyncData(
    `stk_trx_lines-${props.stk_trx_header?.id}`,
    async () => {
        if (!props.stk_trx_header?.id) return []
        const { data, error } = await supabase
            .from('stk_trx_lines')
            .select('*, article:article_id(*)')
            .eq('header_id', props.stk_trx_header.id)
        if (error) throw error
        return data as STKLine[]
    },
    { watch: [() => props.stk_trx_header?.id], immediate: true }
)
</script>

<template>
    <USlideover v-model:open="isOpen" title="Détails de la Réception" :ui="{ content: 'max-w-4xl' }" inset>
        <template #body>
            <div v-if="stk_trx_header" class="space-y-6">
                <!-- Région Info Header -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border border-(--ui-border) rounded-xl bg-(--ui-bg-elevated)/50">
                    <div class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Numéro Document</p>
                        <p class="font-bold text-(--ui-text-highlighted)">{{ stk_trx_header.numero_document }}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Date</p>
                        <p>{{ new Date(stk_trx_header.date_trx).toLocaleDateString() }}</p>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Statut</p>
                        <UBadge :color="stk_trx_header.statut === 'valide' ? 'success' : stk_trx_header.statut === 'actif' ? 'warning' : 'neutral'" variant="subtle" class="capitalize">
                            {{ stk_trx_header.statut }}
                        </UBadge>
                    </div>
                    <div class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Magasin</p>
                        <p>{{ (stk_trx_header.in_organisation as any)?.nom || 'N/A' }}</p>
                    </div>
                    <div v-if="stk_trx_header.fournisseur" class="space-y-1">
                        <p class="text-xs text-(--ui-text-muted) uppercase font-semibold">Fournisseur</p>
                        <p>{{ (stk_trx_header.fournisseur as any)?.nom || 'N/A' }}</p>
                    </div>
                </div>

                <!-- Section Lignes -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-bold">Articles reçus</h3>
                        <UButton label="Ajouter une ligne" icon="i-lucide-plus" color="primary" @click="openAddModal = true" />
                    </div>

                    <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
                        v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="paginationOptions"
                        :data="lines || []" :columns="columns" :loading="pending" :ui="{
                            base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg w-full',
                            thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                            tbody: '[&>tr]:last:[&>td]:border-b-0',
                            th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                            td: 'border-b border-(--ui-border) p-2'
                        }" />

                    <div class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4">
                        <div class="text-sm text-(--ui-text-muted)">
                            {{ totalFilteredRows }} ligne(s) au total.
                        </div>

                        <div class="flex items-center gap-1.5">
                            <UPagination :default-page="currentPage" :items-per-page="currentPageSize"
                                :total="totalFilteredRows" @update:page="setPage" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal Ajout Ligne -->
            <StockAddLineModal v-model:open="openAddModal" :header-id="stk_trx_header?.id" @line-added="refresh" />
        </template>
    </USlideover>
</template>