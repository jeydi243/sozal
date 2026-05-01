<template>
  <UDashboardPanel id="stock-view" :ui-pro="{ body: 'p-6', header: 'p-0' }">
    <template #header>
      <UDashboardNavbar title="Stock" :ui-pro="{ root: 'py-1' }">
        <template #left>
          <!-- <UDashboardSidebarCollapse /> -->
          <USelectMenu v-model="organisation_id" value-key="id" :items="itemsOrganisationsAffectes" class="w-64"
            placeholder="Selectionner une organisation" searchable  />
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
                <UButton label="Exporter" icon="i-lucide-download" color="neutral" variant="subtle" size="sm" />
                <UButton label="Imprimer" icon="i-lucide-printer" color="neutral" variant="subtle" size="sm" />
              </UDropdownMenu>
            </div>
          </div>

        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      <!-- Statistiques et Indicateurs -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 m-2">
        <UCard :ui="{ body: 'p-4' }"
          class="bg-(--ui-bg-elevated)/50 border-(--ui-border) shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-primary/10 rounded-lg">
              <UIcon name="i-lucide-package" class="w-5 h-5 text-primary" />
            </div>
            <div>
              <p class="text-xs font-medium text-(--ui-text-muted) uppercase">Total Références</p>
              <p class="text-2xl font-bold text-(--ui-text-highlighted)">{{ totalSKUs }}</p>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-4' }"
          class="bg-(--ui-bg-elevated)/50 border-(--ui-border) shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-info/10 rounded-lg">
              <UIcon name="i-lucide-boxes" class="w-5 h-5 text-info" />
            </div>
            <div>
              <p class="text-xs font-medium text-(--ui-text-muted) uppercase">Quantité Totale</p>
              <p class="text-2xl font-bold text-(--ui-text-highlighted)">{{ totalQuantity }}</p>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-4' }"
          class="bg-(--ui-bg-elevated)/50 border-(--ui-border) shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-warning/10 rounded-lg">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-warning" />
            </div>
            <div>
              <p class="text-xs font-medium text-(--ui-text-muted) uppercase">Stock Faible</p>
              <p class="text-2xl font-bold text-(--ui-text-highlighted)">{{ lowStockCount }}</p>
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-4' }"
          class="bg-(--ui-bg-elevated)/50 border-(--ui-border) shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-error/10 rounded-lg">
              <UIcon name="i-lucide-x-circle" class="w-5 h-5 text-error" />
            </div>
            <div>
              <p class="text-xs font-medium text-(--ui-text-muted) uppercase">En Rupture</p>
              <p class="text-2xl font-bold text-(--ui-text-highlighted)">{{ outOfStockCount }}</p>
            </div>
          </div>
        </UCard>
      </div>
      <div class="flex flex-row justify-end bg-(--ui-bg-elevated)/50 p-2 rounded-lg m-2">
        <OrganisationsAddEmplacementModal :parent="organisation_id" />
      </div>

      <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection" v-model:pagination="pagination" empty="Aucune reception disponible"
        :pagination-options="paginationOptions" class="shrink-0 m-2" :data="stock || []" :columns="columns"
        :loading="pending" :ui="tableUI" />

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
import type { TableColumn, DropdownMenuItem, SelectMenuItem } from '@nuxt/ui'
import type { Affectation, Organisation, STKHeader, Stock } from '~/types'

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
const UIcon = resolveComponent('UIcon')

// 4. Refs d'état UI
const openSlideOver = ref(false)
const openConfirmDelete = ref(false)
const selectedStock = ref<Stock | null>(null)
const receptionToDelete = ref<Stock | null>(null)
const searchInput = ref('')
const organisation_id = ref<string | null>(null)

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
} = useDataTable({ filterColumnId: 'article_id', pageSize: 100 })

// Statistiques calculées
const totalSKUs = computed(() => {
  if (!stock.value) return 0
  return new Set(stock.value.map(s => s.article?.id)).size
})

const totalQuantity = computed(() => {
  if (!stock.value) return 0
  return stock.value.reduce((acc, curr) => acc + (Number(curr.quantite) || 0), 0)
})

const lowStockCount = computed(() => {
  if (!stock.value) return 0
  // On considère < 10 comme stock faible pour la démo
  return stock.value.filter(s => s.quantite > 0 && s.quantite < 10).length
})

const outOfStockCount = computed(() => {
  if (!stock.value) return 0
  return stock.value.filter(s => s.quantite <= 0).length
})

// IDs des colonnes cachables
const columnDisplayItems = buildColumnDisplayItems(['select', 'details', 'numero_document', 'numero_commande', 'in_organisation', 'date_trx', 'statut', 'actions'])

// logic de recherche
const debouncedSearch = useDebounceFn((val: string) => {
  table.value?.tableApi?.getColumn('numero_document')?.setFilterValue(val)
}, 300)

watch(searchInput, (val) => {
  debouncedSearch(val)
})

// const { data: organisations } = await useLazyAsyncData('stk-organisations-select', async () => {
//   const { data } = await supabase.from('affectations')
//     .select('*, organisation:organisation_id(*, lookup:lookup_id(*))')
//     .eq('lookup.code', '')
//     console.log(data)
//   return data || []
// })

const { getAffectationsMagasin: organisations } = useParametresStore()

const itemsOrganisationsAffectes = computed<SelectMenuItem[]>(() =>
  organisations?.map((org: Affectation) => ({
    label: org.organisation?.nom,
    id: org.id
  })) || []
)

// 6. Définition des colonnes
const columns: TableColumn<Stock>[] = [
  // {
  //   id: 'details',
  //   header: 'Détails',
  //   cell: ({ row }) => h(UButton, {
  //     color: 'neutral',
  //     variant: 'ghost',
  //     icon: 'solar:pen-line-duotone',
  //     // class: '-mx-2.5',
  //     onClick: () => {
  //       selectedStock.value = row.original
  //       openSlideOver.value = true
  //     }
  //   }),
  // },
  {
    accessorKey: 'article_id',
    header: 'Article',
    meta: {
      class: { td: 'min-w-[300px] w-[300px]', th: 'w-[300px]' }
    },
    cell: ({ row }) => h('p', { class: 'whitespace-nowrap' }, row.original.article?.nom)
  },
  {
    accessorKey: 'organisation',
    header: 'Magasin',
    meta: {
      class: { td: 'min-w-48' }
    },
    cell: ({ row }) => h('p', undefined, row.original.organisation?.nom)
  },
  {
    accessorKey: 'location',
    header: 'Emplacement',
    meta: {
      class: { td: 'min-w-48' }
    },
    cell: ({ row }) => h('p', undefined, row.original.location?.nom)
  },
  {
    accessorKey: 'numero_lot',
    header: 'N° Lot',
    meta: {
      class: { td: 'min-w-48' }
    },
    cell: ({ row }) => h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.numero_lot)
  },

  {
    accessorKey: 'quantite',
    header: 'Quantité',
    meta: {
      class: { td: 'min-w-48' }
    },
    cell: ({ row }) => {
      const qty = Number(row.original.quantite) || 0
      let colorClass = 'text-(--ui-text-muted)'
      let icon = ''

      if (qty <= 0) {
        colorClass = 'text-error font-bold'
        icon = 'i-lucide-alert-circle'
      } else if (qty < 10) {
        colorClass = 'text-warning font-semibold'
        icon = 'i-lucide-alert-triangle'
      }

      return h('div', { class: 'flex items-center gap-2' }, [
        icon ? h(UIcon, { name: icon, class: 'w-4 h-4' }) : null,
        h('p', { class: colorClass }, qty.toString())
      ])
    }
  },
  // {
  //   accessorKey: 'date_trx',
  //   header: 'Date',
  //   cell: ({ row }) => {
  //     const date = row.original.date_trx ? new Date(row.original.date_trx) : null
  //     return h('p', undefined, date ? date.toLocaleDateString() : 'N/A')
  //   }
  // },
  {
    accessorKey: 'statut',
    header: 'Statut',
    filterFn: 'equals',
    meta: {
      class: { td: 'w-[1%] justify-center text-center m-auto', th: 'w-[1%]' }
    },
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
    meta: {
      class: { td: 'w-[1%]', th: 'w-[1%]' }
    },
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
const { data: stock, pending, refresh: refreshStock } = await useLazyAsyncData('stk_data_list',
  async () => {
    const { data, error } = await supabase
      .from('stk_data')
      .select('*, article:article_id(*), organisation:organisation_id(*), location:location_id(*)')
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
