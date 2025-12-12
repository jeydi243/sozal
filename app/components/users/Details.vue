<template>
    <USlideover description="Details des affectations aux organisations"
        :title="`Details du user ${currentUser?.first_name} ${currentUser?.last_name}`" :ui="{ content: 'max-w-3xl' }"
        v-model:open="isOpenSlideOver">


        <template #body>
            <div class="flex flex-row justify-between">
                <UButton icon="iconoir:refresh-double" color="primary" variant="ghost" @click="refreshAffectations" />
                <UsersAddAffectation :user_id="props.user?.user_id" @affectation-added="refreshAffectations" />
            </div>
            <div>
                <UTable ref="table_affectations" v-model:column-filters="columnFilters"
                    v-model:column-visibility="columnVisibility" v-model:row-selection="rowSelection"
                    v-model:pagination="pagination" :pagination-options="{
                        getPaginationRowModel: getPaginationRowModel()
                    }" class="shrink-0 m-2" :data="affectations || []" :columns="columnsAffectations" :ui="{
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
import type { TableColumn } from '@nuxt/ui'
import * as z from 'zod'
import { getPaginationRowModel, type Row } from '@tanstack/table-core'
import type { Affectation, Profil } from '~/types'

const props = defineProps({
    user: {
        type: Object as () => Profil | null,
        required: true
    },
    open: {
        type: Boolean,
        required: true
    }
})

const emit = defineEmits(['update:open'])

const supabase = useSupabaseClient()
//on mounted log props.user
onMounted(() => {
    console.log('On mounted user is ', props.user)
    refreshAffectations()
})

watch(() => props.user, () => {
    refreshAffectations()
})



//retrieve current user based on props.user_id
const currentUser = computed(() => props.user)
const affectations = ref<Affectation[]>([])
const { data: initialAffectations } = await supabase.from('affectations').select("*").eq('user_id', props.user?.user_id ?? '')
if (initialAffectations) affectations.value = initialAffectations

console.log('Current user is ', currentUser.value)
console.log('Affectations are ', affectations.value)


const columnFilters = ref([{
    id: 'type',
    value: ''
}])
const isOpenSlideOver = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})


const rowSelection = ref({ 2: true })
const toast = useToast()
const pagination = ref({
    pageIndex: 0,
    pageSize: 10,
})
const columnVisibility = ref()
const openEdit = ref(false)
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const table_affectations = useTemplateRef('table_affectations')

const columnsAffectations: TableColumn<Affectation>[] = [
    {
        id: 'details',
        header: 'Details',
        // icon: 'material-symbols:open-in-full-rounded',
        cell: ({ row }) => h(UButton, {
            color: 'green',
            variant: 'solid',
            icon: 'i-lucide-eye',
            onClick: () => {
                openEdit.value = !openEdit.value;
            }
        }),
    },

    {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.lookup_id),
                    // h('p', { class: '' }, `@${row.original.name}`)
                ])
            ])
        }
    },
    {
        accessorKey: 'organisation_id',
        header: 'Organisation',
        cell: ({ row }) => {
            return h('div', { class: 'flex items-center gap-3' }, [

                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.organisation_id),
                    // h('p', { class: '' }, `@${row.original.name}`)
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
    return [
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
                    description: 'Classe ID copied to clipboard'
                })
            }
        },
        {
            type: 'separator'
        },
        {
            type: 'separator'
        },
        {
            label: 'Delete affectation',
            icon: 'i-lucide-trash',
            color: 'error',
            onSelect() {
                toast.add({
                    title: 'Affectation deleted',
                    description: 'The affectation has been deleted.'
                })
            }
        }
    ];
}
async function refreshAffectations() {
    const { data: newAffectations, error: errorAffectations } = await supabase.from('affectations').select("*").eq('user_id', props.user?.user_id ?? '')
    if (newAffectations) {
        affectations.value = newAffectations
    }
    //show toast success refresh
    toast.add({
        title: 'Refresh',
        description: 'Affectations refreshed',
        color: 'success'
    })
    console.log('Affectations are ', affectations.value)
    //show toast
    if (errorAffectations) {
        toast.add({
            title: 'Error',
            description: errorAffectations.message,
            color: 'error'
        })
    }
}


</script>