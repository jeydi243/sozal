<template>
  <div>
    <!-- :default-size="25" :min-size="20" :max-size="25" resizable  -->
    <UDashboardPanel id="inbox-70" :ui-pro="{ body: 'p-0' }">
      <template #header>
        <UDashboardNavbar title="Classes">
          <template #leading>
            <!-- <UDashboardSidebarCollapse /> -->
          </template>

          <template #right>
            <div class="flex flex-wrap items-center justify-between gap-1.5">
              <UInput v-model="searchInput" class="max-w-sm" icon="i-lucide-search" placeholder="Filter classes..." />

              <div class="flex flex-wrap items-center gap-1.5">
                <UDropdownMenu :items="columnDisplayItems" :content="{ align: 'end' }">
                  <UButton label="Display" color="neutral" variant="outline" trailing-icon="i-lucide-settings-2" />
                </UDropdownMenu>
              </div>
            </div>
            <ClassesAddModal />
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <UTable ref="tableClasses" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
          v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="paginationOptions"
          class="shrink-0 m-2" :data="classes || []" :columns="columns" :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
            td: 'border-b border-(--ui-border) p-2'
          }" />

        <div class="flex items-center justify-between gap-3 border-t border-(--ui-border) pt-4 mt-auto">
          <div class="text-sm text-(--ui-text-muted)">
            {{ selectedRowCount }} of {{ totalFilteredRows }} row(s) selected.
          </div>

          <div class="flex items-center gap-1.5">
            <UPagination :default-page="currentPage" :items-per-page="currentPageSize" :total="totalFilteredRows"
              @update:page="setPage" />
          </div>
        </div>
      </template>
    </UDashboardPanel>
    <UDrawer v-model:open="openDetailsClasse" title="Détails" description="Détails de la classe sélectionnée">
      <template #body>
        <div class="p-4 text-center">
          <p v-if="selectedClasse" class="font-medium">{{ selectedClasse.nom }}</p>
          <p v-if="selectedClasse" class="text-sm text-(--ui-text-muted)">{{ selectedClasse.description }}</p>
          <p v-else>Sélectionnez une classe pour voir les détails.</p>
        </div>
      </template>
    </UDrawer>
    <ClassesUpdateModal v-model:open="openClasseUpdateModal" :classe="selectedClasse ?? undefined"
      @classe_updated="refreshClasses" />
    <USlideover v-model:open="openSlideOver" description="Liste des lookups de la classe" title="Lookups"
      :ui="{ content: 'max-w-3xl' }">
      <template #body>
        <div class="flex items-center justify-end gap-2">
          <LookupsAddModal :classe_id="selectedClasse?.id ?? ''" @lookup_added="refreshLookups" />
          <LookupsUpdateModal v-model:open="openUpdateModal" :lookup="selectedLookup"
            @lookup_updated="refreshLookups" />
        </div>

        <div class="max-w-3xl">
          <UTable ref="tableLookups" v-model:column-filters="columnFiltersLookups"
            v-model:column-visibility="columnVisibilityLookups" v-model:row-selection="rowSelectionLookups"
            v-model:pagination="paginationLookups" :pagination-options="paginationOptionsLookups" class="shrink-0 m-2"
            :data="lookups" :columns="columnsLookups" :loading="loadingLookups" :ui="{
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
              td: 'border-b border-(--ui-border) p-2'
            }" />
        </div>
      </template>
    </USlideover>
  </div>
</template>
<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import * as z from 'zod'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Classe } from '~/types'

useHead({
  title: 'Lookups - Settings',
  meta: [
    { name: 'description', content: 'Manage lookups settings.' }
  ]
})

const supabase = useSupabaseClient()
const {
  table: tableClasses,
  UButton,
  UDropdownMenu,
  UCheckbox,
  columnFilters,
  columnVisibility,
  rowSelection,
  pagination,
  paginationOptions,
  selectedRowCount,
  totalFilteredRows,
  currentPage,
  currentPageSize,
  setPage
} = useDataTable({ filterColumnId: 'nom', pageSize: 10 })

const {
  table: tableLookups,
  columnFilters: columnFiltersLookups,
  columnVisibility: columnVisibilityLookups,
  rowSelection: rowSelectionLookups,
  pagination: paginationLookups,
  paginationOptions: paginationOptionsLookups,
} = useDataTable({ filterColumnId: 'nom', pageSize: 10 })

const selectedLookup = ref()
const openUpdateModal = ref(false)
const openClasseUpdateModal = ref(false)
const openDetailsClasse = ref(false)
const openSlideOver = ref(false)
const toast = useToast()

const { copy } = useClipboard()
const searchInput = ref('')

const debouncedSearch = useDebounceFn((val: string) => {
  tableClasses.value?.tableApi?.getColumn('nom')?.setFilterValue(val)
}, 300)

watch(searchInput, (val) => {
  debouncedSearch(val)
})
let loadingClasses = ref(false)
let classesError = ref<any>(null)
const { data: classes, refresh: refreshClassesData } = await useAsyncData<Classe[]>('lookups-classes', async () => {
  const { data, error } = await supabase.from('classes').select()
  if (error) throw error
  return data as Classe[]
})
let selectedClasse = ref<Classe | null>(null)
const lookups = ref<any[]>([])
const loadingLookups = ref(false)
const lookupsError = ref<any>(null)

const columns: TableColumn<Classe>[] = [
  {
    id: 'edit',
    header: () => h('div', { class: 'text-center' }, 'Edit'),
    // icon: 'material-symbols:open-in-full-rounded',
    cell: ({ row }) => h('div', { class: 'text-center' }, [
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        icon: 'i-lucide-edit',
        onClick: () => {
          selectedClasse.value = row.original;
          openClasseUpdateModal.value = !openClasseUpdateModal.value;
        }
      })
    ]),
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
    accessorKey: 'nom',
    header: 'Nom',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [

        h('div', undefined, [
          h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom),
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
    accessorKey: 'table_name',
    header: 'Table name',
    cell: ({ row }) => row.original.table_name
  },
  {
    id: 'details',
    header: () => h('div', { class: 'text-center' }, 'Lookups'),
    // icon: 'material-symbols:open-in-full-rounded',
    cell: ({ row }) => h('div', { class: 'text-center' }, [
      h(UButton, {
        color: 'neutral',
        variant: 'solid',
        icon: 'i-lucide-eye',
        onClick: () => {
          selectedClasse.value = row.original;
          openSlideOver.value = !openSlideOver.value;
        }
      })
    ]),
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
const columnsLookups: TableColumn<Classe>[] = [
  {
    id: 'select',
    header: ({ table }) => h('div', { class: 'text-center align-middle' }, h(UCheckbox, {
      'modelValue': table.getIsSomePageRowsSelected()
        ? 'indeterminate'
        : table.getIsAllPageRowsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
        table.toggleAllPageRowsSelected(!!value),
      'ariaLabel': 'Select all'
    }))
    ,
    cell: ({ row }) => h('div', { class: 'text-center align-middle' }, h(UCheckbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
      'ariaLabel': 'Select row'
    }))

  },
  {
    id: 'details',
    header: 'Details',
    // icon: 'material-symbols:open-in-full-rounded',
    cell: ({ row }) => h('div', { class: 'text-center' }, [
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        icon: 'material-symbols:edit-outline-rounded',
        onClick: () => {
          selectedLookup.value = row.original
          openUpdateModal.value = true
        }
      })
    ]),
  },
  { accessorKey: 'code', header: () => h('div', { class: 'flex flex-col items-start' }, 'Code') },
  {
    accessorKey: 'nom',
    header: 'Nom',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-3' }, [

        h('div', undefined, [
          h('p', {}, row.original.nom),
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
      label: 'Copy classe ID',
      icon: 'i-lucide-copy',
      onSelect() {
        copy(row.original.id.toString())
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
async function refreshLookups() {
  loadingLookups.value = true
  lookupsError.value = null
  try {
    const { data, error } = await supabase
      .from('lookups')
      .select('*')
      .eq('classe_id', selectedClasse.value?.id ?? '')
    lookups.value = data || []
    loadingLookups.value = false
  } catch (error) {
    lookupsError.value = error
    loadingLookups.value = false
  }
}
async function refreshClasses() {
  loadingClasses.value = true
  classesError.value = null
  try {
    await refreshClassesData()
    loadingClasses.value = false
  } catch (error) {
    classesError.value = error
    loadingClasses.value = false
  }
}



watch(selectedClasse, async (newClasse) => {
  if (newClasse) {
    loadingLookups.value = true
    lookupsError.value = null
    try {
      const { data, error } = await supabase
        .from('lookups')
        .select('*')
        .eq('classe_id', newClasse.id)

      if (error) {
        lookupsError.value = error
        lookups.value = []
      } else {
        lookups.value = data || []
      }
    } catch (err) {
      lookupsError.value = err
      lookups.value = []
    } finally {
      loadingLookups.value = false
    }
  } else {
    lookups.value = []
    loadingLookups.value = false
    lookupsError.value = null
  }
}, { immediate: false })

const defaultClasseSchema = z.object({
  description: z.string(),
  table_name: z.string(),
  nom: z.string(),
})
type Schema = z.output<typeof defaultClasseSchema>

const defaultClasse = reactive({
  description: '',
  table_name: '',
  nom: ''
})


</script>
