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
              <UInput :model-value="(table?.tableApi?.getColumn('nom')?.getFilterValue() as string)" class="max-w-sm"
                icon="i-lucide-search" placeholder="Filter classes..."
                @update:model-value="table?.tableApi?.getColumn('nom')?.setFilterValue($event)" />

              <div class="flex flex-wrap items-center gap-1.5">
                <CustomersDeleteModal :count="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
                  <UButton v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length" label="Delete"
                    color="error" variant="subtle" icon="i-lucide-trash">
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
                  <UButton label="Display" color="neutral" variant="outline" trailing-icon="i-lucide-settings-2" />
                </UDropdownMenu>
              </div>
            </div>
            <ClassesAddModal />
          </template>
        </UDashboardNavbar>
      </template>
      <template #body>
        <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
          v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="{
            getPaginationRowModel: getPaginationRowModel()
          }" class="shrink-0 m-2" :data="classes" :columns="columns" :ui="{
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
          <UTable ref="table" v-model:column-filters="columnFilters" v-model:column-visibility="columnVisibility"
            v-model:row-selection="rowSelection" v-model:pagination="pagination" :pagination-options="{
              getPaginationRowModel: getPaginationRowModel()
            }" class="shrink-0 m-2" :data="lookups" :columns="columnsLookups" :loading="loadingLookups" :ui="{
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-1 first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
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
const table = useTemplateRef('table')
const selectedLookup = ref()
const openUpdateModal = ref(false)
const openClasseUpdateModal = ref(false)
const statusFilter = ref('all')
const columnFilters = ref([{
  id: 'nom',
  value: ''
}])
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')
const columnVisibility = ref()
const openDetailsClasse = ref(false)
const openSlideOver = ref(false)
const rowSelection = ref({ 2: true })
const toast = useToast()
const pagination = ref({
  pageIndex: 0,
  pageSize: 10
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
    header: 'Edit',
    // icon: 'material-symbols:open-in-full-rounded',
    cell: ({ row }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      icon: 'i-lucide-edit',
      class: 'text-center',
      onClick: () => {
        selectedClasse.value = row.original;
        openClasseUpdateModal.value = !openClasseUpdateModal.value;
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
    id: 'details',
    header: 'Lookups',
    // icon: 'material-symbols:open-in-full-rounded',
    cell: ({ row }) => h(UButton, {
      color: 'neutral',
      variant: 'solid',
      icon: 'i-lucide-eye',
      class: 'text-center',
      onClick: () => {
        selectedClasse.value = row.original;
        openSlideOver.value = !openSlideOver.value;
      }
    }),
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
    cell: ({ row }) => h(UButton, {
      color: 'neutral',
      variant: 'ghost',
      icon: 'material-symbols:edit-outline-rounded',
      class: 'text-center',
      onClick: () => {
        selectedLookup.value = row.original
        openUpdateModal.value = true
      }
    }),
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
