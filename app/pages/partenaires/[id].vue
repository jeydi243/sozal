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
            <pre>{{ partenaire }}</pre>
            <UTabs color="primary" variant="link" :items="items" class="w-full" :ui="{ list: 'mb-2' }">
                <template #content="{ item }">
                    <PartenairesPatients v-if="item.value == 'partenaire' && partenaire" :organisation="partenaire" />
                    <PartenairesFactures v-else :organisation="route.params.id" />
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
useHead({
    title: 'Partenaire',
})

const items = ref<TabsItem[]>([
    {
        label: 'Patients',
        icon: 'i-lucide-user',
        value: 'partenaire'
    },
    {
        label: 'Factures',
        icon: 'i-lucide-lock',
        value: 'facture'
    }
])
const route = useRoute()
const { data: partenaire, error } = await useAsyncData('partenaire-' + route.params.id, async () => {
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
