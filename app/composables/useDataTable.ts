import { getPaginationRowModel } from '@tanstack/table-core'
import { upperFirst } from 'scule'

/**
 * Composable réutilisable pour la gestion des tables avec pagination,
 * filtres et visibilité des colonnes.
 *
 * Évite la duplication de la logique de table dans chaque page/composant.
 */
export function useDataTable(options?: { pageSize?: number; filterColumnId?: string }) {
    const table = useTemplateRef<any>('table')
    const UButton = resolveComponent('UButton')
    const UDropdownMenu = resolveComponent('UDropdownMenu')

    const columnFilters = ref<{ id: string; value: string }[]>(
        options?.filterColumnId
            ? [{ id: options.filterColumnId, value: '' }]
            : []
    )
    const columnVisibility = ref()
    const rowSelection = ref()

    const pagination = ref({
        pageIndex: 0,
        pageSize: options?.pageSize ?? 10
    })

    const paginationOptions = {
        getPaginationRowModel: getPaginationRowModel()
    }

    const statusFilter = ref('all')

    /** Génère les items du dropdown "Display" pour afficher/masquer les colonnes */
    const columnDisplayItems = computed(() =>
        table.value?.tableApi
            ?.getAllColumns()
            .filter((column: any) => column.getCanHide())
            .map((column: any) => ({
                label: upperFirst(column.id),
                type: 'checkbox' as const,
                checked: column.getIsVisible(),
                onUpdateChecked(checked: boolean) {
                    table.value?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                },
                onSelect(e?: Event) {
                    e?.preventDefault()
                }
            })) ?? []
    )

    /** Nombre de lignes sélectionnées (filtrées) */
    const selectedRowCount = computed(
        () => table.value?.tableApi?.getFilteredSelectedRowModel().rows.length ?? 0
    )

    /** Nombre total de lignes (filtrées) */
    const totalFilteredRows = computed(
        () => table.value?.tableApi?.getFilteredRowModel().rows.length ?? 0
    )

    /** Index de la page courante (1-indexé pour UPagination) */
    const currentPage = computed(
        () => (table.value?.tableApi?.getState().pagination.pageIndex ?? 0) + 1
    )

    /** Taille de page courante */
    const currentPageSize = computed(
        () => table.value?.tableApi?.getState().pagination.pageSize ?? options?.pageSize ?? 10
    )

    function setPage(page: number) {
        table.value?.tableApi?.setPageIndex(page - 1)
    }

    function setStatusFilter(column: string, value: string) {
        if (!table.value?.tableApi) return
        const col = table.value.tableApi.getColumn(column)
        if (!col) return
        col.setFilterValue(value === 'all' ? undefined : value)
    }

    return {
        // Template refs
        table,
        // Resolved components (pour les render functions)
        UButton,
        UDropdownMenu,
        // États liés à la table
        columnFilters,
        columnVisibility,
        rowSelection,
        pagination,
        paginationOptions,
        statusFilter,
        // Computed helpers
        columnDisplayItems,
        selectedRowCount,
        totalFilteredRows,
        currentPage,
        currentPageSize,
        // Fonctions utilitaires
        setPage,
        setStatusFilter
    }
}
