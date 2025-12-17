<template>
    <UDashboardPanel id="patient-detail" as="div" :ui="{ body: 'p-5' }">
        <template #header>
            <UDashboardNavbar>
                <template #leading>
                    <UDashboardSidebarCollapse />
                    <UBreadcrumb
                        :items="[{ label: 'Home', to: '/' }, { label: 'Patients', to: '/patients' }, { label: $route.params.id, to: '/patients/' + $route.params.id }]" />
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
        </template>
    </UDashboardPanel>
</template>

<script setup lang="ts">
definePageMeta({
    name: 'patients-id',

})

const route = useRoute()
const { data: patient, error } = await useAsyncData('patient-' + route.params.id, async () => {
    const client = useSupabaseClient()
    const { data, error } = await client
        .from('patients')
        .select('*')
        .eq('id', route.params.id)
        .single()
    if (error) throw error
    return data
})


</script>
