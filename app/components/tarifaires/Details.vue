<template>
    <USlideover description="Details des tarifaires aux organisations"
        :title="`${props.tarifaire?.name}`" :ui="{ content: 'max-w-3xl' }"
        v-model:open="isOpenSlideOver">


        <template #body>
            <div class="flex flex-row justify-between">
                <UButton icon="iconoir:refresh-double" color="primary" variant="ghost" @click="refreshAffectations" />
                <TarifairesAddArticle :tarifaire_id="props.tarifaire?.id" @tarifaire-added="refreshAffectations" />
            </div>
            <div>
                <UTable ref="table_tarifaires" v-model:column-filters="columnFilters"
                    v-model:column-visibility="columnVisibility" v-model:row-selection="rowSelection"
                    v-model:pagination="pagination" empty="Aucune tarifaire" :pagination-options="{
                        getPaginationRowModel: getPaginationRowModel()
                    }" class="shrink-0 m-2" :data="tarifaires || []" :columns="columnsAffectations"
                    :loading="tarifairesStatus === 'pending'" :ui="{
                        base: 'table-fixed border-separate border-spacing-0',
                        thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
                        tbody: '[&>tr]:last:[&>td]:border-b-0',
                        th: 'py-1 first:rounded-l-[calc(var(--ui-radius)*2)] last:rounded-r-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
                        td: 'border-b border-(--ui-border) p-2'
                    }" />
            </div>
            <UModal v-model:open="isStopModalOpen" title="Confirmer l'arrêt de l'tarifaire">
                <template #body>
                    <div class="pl-4">

                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Êtes-vous sûr de vouloir arrêter cette tarifaire ? La date de fin sera définie à
                            aujourd'hui.
                        </p>
                    </div>


                </template>
                <template #footer="{ close }">
                    <UButton color="neutral" variant="ghost" @click="close">
                        Annuler
                    </UButton>
                    <UButton color="secondary" variant="solid" @click="stopAffectation">
                        Confirmer
                    </UButton>
                </template>
            </UModal>
        </template>
    </USlideover>
</template>
<script setup lang="ts">
import type { PropType } from 'vue'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Affectation, Tarifaire } from '~/types'

const props = defineProps({
    tarifaire: {
        type: Object as PropType<Tarifaire | null>,
        required: true
    },
    open: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['update:open'])
const supabase = useSupabaseClient()
const toast = useToast()

const { data: tarifaires, refresh: refreshAffectations, status: tarifairesStatus } = useAsyncData(
    `tarifaires-${props.tarifaire?.id}`,
    async () => {
        if (!props.tarifaire?.id) return []
        const { data, error } = await supabase.from('tarifaires_lines').select("id, prix, articles!inner(name, description)").eq('tarifaire_id', props.tarifaire.id)
        if (error) {
            toast.add({
                title: 'Error',
                description: error.message,
                color: 'error'
            })
            throw error
        }
        console.log(data)
        return data as Affectation[]
    },
    {
        watch: [() => props.tarifaire],
        immediate: true // Ensure it runs on mount if tarifaire is present
    }
)

const columnFilters = ref([{
    id: 'id',
    value: ''
}])

const isOpenSlideOver = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

const rowSelection = ref({})
const pagination = ref({
    pageIndex: 0,
    pageSize: 10,
})
const columnVisibility = ref()
const isStopModalOpen = ref(false)
const selectedAffectationId = ref<number | null>(null)

async function stopAffectation() {
    if (!selectedAffectationId.value) return

    const { error } = await supabase
        .from('tarifaires')
        .update({ end_date: new Date().toISOString() })
        .eq('id', selectedAffectationId.value)

    if (error) {
        toast.add({
            title: 'Error',
            description: error.message,
            color: 'error'
        })
    } else {
        toast.add({
            title: 'Succès',
            description: 'Le tarifaire a été arrêtée avec succès.',
            color: 'success'
        })
        refreshAffectations()
        isStopModalOpen.value = false
    }
}

const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const table_tarifaires = useTemplateRef('table_tarifaires')

const columnsAffectations: TableColumn<Affectation>[] = [
    {
        accessorKey: 'article_id',
        header: 'Article',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.articles?.name || ''),
                ])
            ])
        }
    },
    {
        accessorKey: 'prix',
        header: 'Prix',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.prix),
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
                        items: getRowItemsAffectations(row)
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

function getRowItemsAffectations(row: Row<Affectation>) {
    const items: DropdownMenuItem[] | DropdownMenuItem[][] = [
        {
            type: 'label',
            label: 'Actions'
        },
        {
            label: 'Copie ID',
            icon: 'i-lucide-copy',
            onSelect() {
                navigator.clipboard.writeText(row.original.id.toString())
                toast.add({
                    title: 'Copied to clipboard',
                    description: 'Article ID copied to clipboard'
                })
            }
        }
    ]

    if (!row.original.end_date) {

        items.push({
            type: 'separator'
        });

        items.push({
            label: "Supprimer l'article",
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                selectedAffectationId.value = row.original.id
                isStopModalOpen.value = true
            }
        })
    }

    return items
}
</script>