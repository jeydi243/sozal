<template>
  <UDashboardPanel id="reception-externe" :ui-pro="{ body: 'p-5', header: 'p-0' }">
    <template #header>
      <UDashboardNavbar title="Reception Externe">
        <template #leading>
          <!-- <UDashboardSidebarCollapse /> -->
        </template>

        <template #right>
          <div class="flex flex-wrap items-center justify-between gap-1.5">
            <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search"
              placeholder="Rechercher un document..." />

            <div class="flex flex-wrap items-center gap-1.5">
              <USelect v-model="statusFilter" :items="[
                { label: 'Toutes', value: 'all' },
                { label: 'En cours', value: 'en_cours' },
                { label: 'Validé', value: 'valide' },
                { label: 'Annulé', value: 'annule' }
              ]" :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
                placeholder="Statut" class="min-w-28" @update:model-value="setStatusFilter('statut', $event)" />

              <UDropdownMenu :items="columnDisplayItems" :content="{ align: 'end' }">
                <UButton label="Affichage" color="neutral" variant="outline" trailing-icon="i-lucide-settings-2" />
              </UDropdownMenu>
            </div>
          </div>

        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection" v-model:pagination="pagination" empty="Aucune reception disponible"
        :pagination-options="paginationOptions" class="shrink-0 m-2" :data="stock || []" :columns="columns"
        :loading="pending" :ui="{
          base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg w-full',
          thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r pl-2',
          td: 'border-b border-(--ui-border) p-2'
        }" />
      <!-- <StockDetailsReception v-model:open="openSlideOver" :stk_trx_header="selectedStock"
        @reception-finished="refreshStock" /> -->

      <UModal v-model:open="openConfirmDelete" title="Confirmation de suppression"
        description="Êtes-vous sûr de vouloir supprimer cette réception ? Cette action est irréversible.">
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="openConfirmDelete = false" />
            <UButton label="Supprimer" color="error" @click="confirmDelete" />
          </div>
        </template>
      </UModal>

      <div class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4 mt-auto">
        <div class="text-sm text-(--ui-text-muted)">
          {{ selectedRowCount }} sur {{ totalFilteredRows }} ligne(s) sélectionnée(s).
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination :default-page="currentPage" :items-per-page="currentPageSize" :total="totalFilteredRows"
            @update:page="setPage" />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import { type Row } from '@tanstack/table-core'
import type { TableColumn, DropdownMenuItem } from '@nuxt/ui'
import type { STKHeader, Stock } from '~/types'

// 1. SEO
useHead({
  title: 'Stock',
  meta: [
    { name: 'description', content: 'Consulter les stocks.' }
  ]
})

// 2. Services et composables
const supabase = useSupabaseClient()
const toast = useToast()
const { copy } = useClipboard()

// 3. resolveComponent() — obligatoire avant tout usage dans h()
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

// 4. Refs d'état UI
const openSlideOver = ref(false)
const openConfirmDelete = ref(false)
const selectedStock = ref<Stock | null>(null)
const receptionToDelete = ref<Stock | null>(null)
const searchInput = ref('')

// 5. useDataTable
const {
  table,
  columnFilters,
  columnVisibility,
  rowSelection,
  pagination,
  paginationOptions,
  statusFilter,
  buildColumnDisplayItems,
  selectedRowCount,
  totalFilteredRows,
  currentPage,
  currentPageSize,
  setPage,
  setStatusFilter
} = useDataTable({ filterColumnId: 'numero_document', pageSize: 100 })

// IDs des colonnes cachables
const columnDisplayItems = buildColumnDisplayItems(['select', 'details', 'numero_document', 'numero_commande', 'in_organisation', 'date_trx', 'statut', 'actions'])

// logic de recherche
const debouncedSearch = useDebounceFn((val: string) => {
  table.value?.tableApi?.getColumn('numero_document')?.setFilterValue(val)
}, 300)

watch(searchInput, (val) => {
  debouncedSearch(val)
})

// 6. Définition des colonnes
const columns: TableColumn<Stock>[] = [
  {
    id: 'details',
    header: 'Détails',
    cell: ({ row }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      icon: 'solar:pen-line-duotone',
      // class: '-mx-2.5',
      onClick: () => {
        selectedStock.value = row.original
        openSlideOver.value = true
      }
    }),
  },
  {
    accessorKey: 'organisation',
    header: 'Magasin',
    cell: ({ row }) => h('p', undefined, row.original.organisation?.nom)
  },
  {
    accessorKey: 'location',
    header: 'Emplacement',
    cell: ({ row }) => h('p', undefined, row.original.location?.nom)
  },
  {
    accessorKey: 'numero_lot',
    header: 'N° Lot',
    cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.numero_lot)
  },

  {
    accessorKey: 'quantite',
    header: 'Quantité',
    cell: ({ row }) => h('p', { class: 'text-(--ui-text-muted)' }, row.original.quantite)
  },
  {
    accessorKey: 'date_trx',
    header: 'Date',
    cell: ({ row }) => {
      const date = row.original.date_trx ? new Date(row.original.date_trx) : null
      return h('p', undefined, date ? date.toLocaleDateString() : 'N/A')
    }
  },
  {
    accessorKey: 'statut',
    header: 'Statut',
    filterFn: 'equals',
    cell: ({ row }) => {
      const statusStr = row.original.statut || 'actif'
      const color = {
        valide: 'warning' as const,
        actif: 'success' as const,
        annule: 'error' as const
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

// 7. Fonctions utilitaires
function getRowItems(row: Row<Stock>): DropdownMenuItem[][] {
  return [[
    {
      type: 'label' as const,
      label: 'Actions'
    },
    {
      label: 'Copie ID',
      icon: 'i-lucide-copy',
      onSelect() {
        copy(row.original.id.toString())
        toast.add({
          title: 'Copié !',
          description: 'ID copié dans le presse-papiers'
        })
      }
    },
    { type: 'separator' as const },
    {
      label: 'Détails',
      icon: 'i-lucide-maximize-2',
      onSelect() {
        selectedStock.value = row.original
        openSlideOver.value = true
      }
    },
    { type: 'separator' as const },
    {
      label: 'Supprimer',
      icon: 'i-lucide-trash',
      color: 'error' as const,
      disabled: row.original.statut === 'Terminé',
      onSelect() {
        receptionToDelete.value = row.original
        openConfirmDelete.value = true
      }
    }
  ]]
}

async function confirmDelete() {
  if (!receptionToDelete.value) return

  const { error } = await supabase
    .from('stk_trx_headers')
    .delete()
    .eq('id', receptionToDelete.value.id)

  if (error) {
    toast.add({
      title: 'Erreur',
      description: error.message,
      color: 'error'
    })
  } else {
    toast.add({
      title: 'Succès',
      description: 'Réception supprimée avec succès',
      color: 'success'
    })
    await refreshStock()
  }
  openConfirmDelete.value = false
  receptionToDelete.value = null
}

// 8. Chargement des données — SEMPRE EN DERNIER
const { data: stock, pending, refresh: refreshStock } = await useLazyAsyncData('stk_trx_headers_list',
  async () => {
    const { data, error } = await supabase
      .from('stk_data')
      .select('*, organisation:organisation_id(*), location:location_id(*)')
    if (error) {
      throw error
    }
    return data as Stock[]
  })

// Écouter les changements en temps réel
onMounted(() => {
  const channel = supabase.channel('stk_data_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'stk_data' }, () => {
      refreshStock()
    })
    .subscribe()

  onUnmounted(() => {
    supabase.removeChannel(channel)
  })
})
</script>
