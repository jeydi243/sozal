<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const props = defineProps({
    classe: {
        type: Object,
        required: true
    },
    open: {
        type: Boolean,
        required: true,
        default: false,

    }
})
const emit = defineEmits(['classe_updated', 'update:open'])
const schema = z.object({
    name: z.string().min(3, 'Too short'),
    code: z.string().min(3, 'Too short'),
    description: z.string(),
    table_name: z.string()
})
const toast = useToast()
const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
})

type Schema = z.output<typeof schema>
const supabase = useSupabaseClient()
const state = reactive<Partial<Schema>>({ ...props.classe })

watch(() => props.classe, (newClasse) => {
    if (newClasse) {
        Object.assign(state, newClasse)
    }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
    console.log('date to update: %o with ID ', event.data, props.classe.id)
    const { data, error } = await supabase
        .from('classes')
        .update(event?.data)
        .eq('id', props.classe.id)
        .select()
    console.log('data updated: %o', data)
    if (error) {
        toast.add({ title: 'Error', description: `Can't update classe ${error.message}`, color: 'error' })
    } else {
        toast.add({ title: 'Success', description: `Classe ${event.data.name} updated`, color: 'success' })
        emit('classe_updated')
        isOpen.value = false
    }
}

</script>

<template>
    <UModal v-model:open="isOpen" title="Classe" description="Update classe">
        <template #body>
            <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
                <UFormField label="Name" placeholder="John Doe" name="name">
                    <UInput v-model="state.name" class="w-full" />
                </UFormField>
                <UFormField label="Code" placeholder="_" name="code">
                    <UInput v-model="state.code" class="w-full" />
                </UFormField>
                <UFormField label="Description" placeholder="" name="description">
                    <UInput v-model="state.description" class="w-full" />
                </UFormField>
                <UFormField label="Table name" placeholder="_" name="table_name">
                    <UInput v-model="state.table_name" class="w-full" />
                </UFormField>
                <div class="flex justify-end gap-2">
                    <UButton label="Cancel" color="neutral" variant="subtle" @click="isOpen = false" />
                    <UButton label="Update" color="primary" variant="solid" type="submit" />
                </div>
            </UForm>
        </template>
    </UModal>
</template>
