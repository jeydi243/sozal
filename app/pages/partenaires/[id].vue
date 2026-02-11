<template>
    <UDashboardPanel id="patient-detail" as="div" :ui="{ body: 'p-5' }">
        <template #header>
            <UDashboardNavbar>
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UBreadcrumb
                        :items="[{ label: 'Home', to: '/' }, { label: 'Partenaires', to: '/partenaires' }, { label: `${route.params.id}`, to: '/partenaires/' + $route.params.id }]" />
                </template>

                <template #right>
                    <UButton label="Edit" color="primary" variant="subtle" icon="i-lucide-pencil" />
                    <UButton label="Delete" color="error" variant="subtle" icon="i-lucide-trash" />
                </template>
            </UDashboardNavbar>
        </template>
        <template #body>
            This is details page of {{ route.params.id }}
            <pre>{{ patient }}</pre>
            <UTabs color="primary" variant="link"  :items="items" class="w-full">
                <template #content="{ item }">
                    <pre>{{ item.value }}</pre> 
                </template>
            </UTabs>
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

definePageMeta({
    name: 'partenaire-id',

})
const items = ref<TabsItem[]>([
    {
        label: 'Patients',
        icon: 'i-lucide-user',
        value: 22
    },
    {
        label: 'Factures',
        icon: 'i-lucide-lock'
    }
])
const route = useRoute()
const { data: patient, error } = await useAsyncData('patient-' + route.params.id, async () => {
    const client = useSupabaseClient()
    const { data, error } = await client
        .from('organisations')
        .select('*')
        .eq('id', route.params.id as any)
        .single()
    if (error) throw error
    return data
})


</script>
