<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Profil } from '~/types'

const supabase = useSupabaseClient()
const toast = useToast()
const { copy } = useClipboard()

useHead({
    title: 'Rôles et Accès - Sozal',
    meta: [
        { name: 'description', content: 'Gérer les accès et affectations des utilisateurs.' }
    ]
})

// Fetch all users
const { data: users } = await useAsyncData('profils-all', async () => {
    const { data, error } = await supabase.from('profils').select('*')
    if (error) throw error
    return data as Profil[]
})

const selectedUser = ref<Profil | null>(null)

// Fetch existing affectations for the selected user
const { data: affectations, refresh: refreshAffectations, pending: loadingAffectations } = await useAsyncData(
    () => `user-affectations-${selectedUser.value?.user_id}`,
    async () => {
        if (!selectedUser.value?.user_id) return []
        const { data, error } = await supabase
            .from('affectations')
            .select('*, lookup:lookups(*), organisation:organisations(*)')
            .eq('user_id', selectedUser.value.user_id)
        if (error) throw error
        return data
    },
    { watch: [() => selectedUser.value?.user_id], immediate: true }
)

const deleteAffectation = async (id: number) => {
    const { error } = await supabase
        .from('affectations')
        .delete()
        .eq('id', id)

    if (error) {
        toast.add({ title: 'Erreur', description: error.message, color: 'error' })
    } else {
        toast.add({ title: 'Succès', description: 'Affectation supprimée', color: 'success' })
        refreshAffectations()
    }
}
</script>

<template>
    <div class="flex flex-row">
        <!-- Panel Gauche: Liste des utilisateurs -->
        <div id="users-list-panel" class="w-[20%] h-screen overflow-y-hidden border-r border-(--ui-border)">
            <UDashboardNavbar title="Utilisateurs">
                <template #trailing>
                    <UBadge v-if="users" :label="users.length" variant="subtle" />
                </template>
            </UDashboardNavbar>
            <SettingsUserList v-model="selectedUser" :users="users || []" />
        </div>

        <!-- Panel Droit: Détails Premium v2 -->
        <div id="user-details-panel" v-if="selectedUser" class="flex-1 relative overflow-hidden bg-(--ui-bg)">
            <!-- Background Decorative Elements -->
            <div
                class="absolute top-0 right-0 w-[500px] h-[500px] bg-(--ui-primary)/5 blur-[120px] rounded-full -mr-64 -mt-64 animate-pulse">
            </div>
            <div
                class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full -ml-32 -mb-32">
            </div>

            <UDashboardNavbar :toggle="false" class="border-b  backdrop-blur-xl bg-(--ui-bg)/60 sticky top-0 z-20">
                <template #right>
                    <div class="flex items-center gap-2">
                        <UTooltip text="Fermer le dossier">
                            <UButton icon="i-lucide-x" color="neutral" variant="ghost"
                                class="hidden lg:flex rounded-full" @click="selectedUser = null" />
                        </UTooltip>
                    </div>
                </template>
            </UDashboardNavbar>


        </div>

        <!-- État Vide -->
        <div v-else class="flex-1">
            <div class="flex flex-1 items-center justify-center bg-(--ui-bg-elevated)/20 h-screen">
                <div class="text-center">
                    <div class="relative inline-block mb-4">
                        <UIcon name="i-lucide-users" class="size-20 text-(--ui-text-dimmed) opacity-10" />
                        <UIcon name="i-lucide-mouse-pointer-2"
                            class="size-8 text-(--ui-primary) absolute bottom-0 right-0 animate-bounce" />
                    </div>
                    <p class="text-lg font-medium text-(--ui-text-muted)">Gestion des Accès</p>
                    <p class="text-sm text-(--ui-text-dimmed)">Sélectionnez un utilisateur dans la liste pour voir ses
                        détails
                        et ses affectations.</p>
                </div>
            </div>
        </div>
    </div>
</template>
