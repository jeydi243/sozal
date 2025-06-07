<template>
    <div class="min-h-screen flex flex-row">
        <UCard class="m-auto self-center w-[500px] place-self-center" variant="soft">
            <template #header>
                Connexion
            </template>

            <UForm :schema="schema" :state="state" class="space-y-4" @submit="signInWithPassword">
                <UFormField label="Email" name="email" class="w-full mx-auto">
                    <UInput v-model="state.email" class="w-full" />
                </UFormField>

                <UFormField label="Password" name="password" class="w-full mx-auto">
                    <UInput v-model="state.password" type="password" class="w-full" />
                </UFormField>

                <UButton type="submit" class="w-full justify-center">
                    Connexion
                </UButton>
            </UForm>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

let user = useSupabaseUser()

definePageMeta({
    layout: 'auth'
})

const schema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
    email: undefined,
    password: undefined
})

const toast = useToast()
async function onSubmit(event: FormSubmitEvent<Schema>) {
    toast.add({ title: 'Success', description: 'The form has been submitted. ' + JSON.stringify(event?.data), color: 'success' })
    console.log(event.data)
}

const supabase = useSupabaseClient()

const signInWithPassword = async (event: FormSubmitEvent<Schema>) => {
    try {
        const { error } = await supabase.auth.signInWithPassword({
            email: event.data.email,
            password: event.data.password
        })
        if (error) {
            toast.add({ title: 'Error', description: error.message, color: 'error' })
            console.log(error)
        } else {
            user = useSupabaseUser()
            toast.add({ title: 'Success', description: 'Welcome ! ' + JSON.stringify(user.value), color: 'success' })
        }
    } catch (error) {
        console.log(error)
    }
}

const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.log(error)
}
</script>

<style scoped></style>