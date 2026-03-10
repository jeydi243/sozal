<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Profil } from '~/types'

const supabase = useSupabaseClient()
const toast = useToast()

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

    <!-- Panel Gauche: Liste des utilisateurs -->
    <UDashboardPanel id="users-list-panel" :default-size="10" :min-size="10" resizable>
        <!-- <UDashboardNavbar title="Utilisateurs">
            <template #trailing>
                <UBadge v-if="users" :label="users.length" variant="subtle" />
            </template>
        </UDashboardNavbar> -->
        <!-- <SettingsUserList v-model="selectedUser" :users="users || []" /> -->
    </UDashboardPanel>

    <!-- Panel Droit: Détails ou Vide -->
    <UDashboardPanel id="user-details-panel" v-if="selectedUser" class="flex-1">
        <UDashboardNavbar title="Détails de l'utilisateur" :toggle="false">
            <template #leading>
                <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" class="lg:hidden"
                    @click="selectedUser = null" />
            </template>
            <template #right>
                <UButton icon="i-lucide-x" color="neutral" variant="ghost" class="hidden lg:flex"
                    @click="selectedUser = null" />
            </template>
        </UDashboardNavbar>

        <div class="p-4 sm:p-6 space-y-8 overflow-y-auto h-full pb-32">
            <!-- Header Profile -->
            <div class="flex items-start gap-6 pb-6 border-b border-(--ui-border)">
                <UAvatar :alt="`${selectedUser.prenom} ${selectedUser.nom}`" size="3xl"
                    class="ring-2 ring-(--ui-primary)/20" />
                <div class="space-y-1">
                    <h1 class="text-2xl font-bold text-(--ui-text-highlighted)">
                        {{ selectedUser.prenom }} {{ selectedUser.nom }} {{ selectedUser.postnom }}
                    </h1>
                    <p class="text-(--ui-text-muted) flex items-center gap-2 text-sm">
                        <UIcon name="i-lucide-user" class="size-4" />
                        @{{ selectedUser.user_name }}
                    </p>
                    <div class="flex gap-2 mt-2">
                        <UBadge variant="subtle" color="primary">Profil Actif</UBadge>
                        <UBadge variant="subtle" color="neutral">{{ selectedUser.email }}</UBadge>
                    </div>
                </div>
            </div>

            <div class="grid lg:grid-cols-2 gap-8">
                <!-- Informations Générales -->
                <div class="space-y-6">
                    <div>
                        <h3
                            class="text-xs font-semibold uppercase tracking-widest text-(--ui-text-muted) mb-4 flex items-center gap-2">
                            <UIcon name="i-lucide-info" />
                            Informations
                        </h3>
                        <div
                            class="bg-(--ui-bg-elevated) rounded-xl border border-(--ui-border) p-4 space-y-4 shadow-sm">
                            <div class="flex justify-between items-center py-1 border-b border-(--ui-border)/50">
                                <span class="text-sm text-(--ui-text-muted)">Identifiant User</span>
                                <span class="text-sm font-mono text-(--ui-text-highlighted)">{{ selectedUser.user_id
                                }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1 border-b border-(--ui-border)/50">
                                <span class="text-sm text-(--ui-text-muted)">Email</span>
                                <span class="text-sm font-medium text-(--ui-text-highlighted)">{{ selectedUser.email
                                }}</span>
                            </div>
                            <div class="flex justify-between items-center py-1">
                                <span class="text-sm text-(--ui-text-muted)">Nom Complet</span>
                                <span class="text-sm font-medium text-(--ui-text-highlighted)">{{ selectedUser.prenom }}
                                    {{
                                        selectedUser.nom }} {{ selectedUser.postnom }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Action: Affecter -->
                    <div
                        class="p-4 bg-(--ui-primary)/5 rounded-xl border border-(--ui-primary)/10 flex items-center justify-between gap-4">
                        <div>
                            <p class="text-sm font-semibold text-(--ui-primary)">Nouvelle Affectation</p>
                            <p class="text-xs text-(--ui-text-muted)">Associer cet utilisateur à un service.</p>
                        </div>
                        <UsersAddAffectation :user_id="selectedUser.user_id" @affectation-added="refreshAffectations" />
                    </div>
                </div>

                <!-- Liste des Affectations -->
                <div class="space-y-4">
                    <h3
                        class="text-xs font-semibold uppercase tracking-widest text-(--ui-text-muted) flex items-center gap-2">
                        <UIcon name="i-lucide-map-pin" />
                        Affectations Actuelles
                    </h3>

                    <div v-if="loadingAffectations" class="flex justify-center py-12">
                        <UIcon name="i-lucide-loader-2" class="animate-spin h-8 w-8 text-(--ui-primary)" />
                    </div>

                    <div v-else-if="affectations && affectations.length > 0" class="space-y-3">
                        <div v-for="affect in affectations" :key="affect.id"
                            class="group flex items-center justify-between p-3 bg-(--ui-bg-elevated) rounded-lg border border-(--ui-border) hover:border-(--ui-primary)/30 transition-all shadow-sm">
                            <div class="flex items-center gap-3">
                                <div class="p-2 bg-(--ui-primary)/10 rounded-lg">
                                    <UIcon name="i-lucide-building" class="size-5 text-(--ui-primary)" />
                                </div>
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-(--ui-text-highlighted) truncate">
                                        {{ (affect.organisation as any)?.nom }}
                                    </p>
                                    <p class="text-xs text-(--ui-text-muted)">
                                        {{ (affect.lookup as any)?.nom || 'N/A' }}
                                    </p>
                                </div>
                            </div>
                            <UButton icon="i-lucide-trash" color="error" variant="ghost" size="xs"
                                class="opacity-0 group-hover:opacity-100 transition-opacity"
                                @click="deleteAffectation(affect.id)" />
                        </div>
                    </div>

                    <div v-else
                        class="flex flex-col items-center justify-center py-12 px-4 bg-(--ui-bg-elevated)/50 rounded-xl border border-dashed border-(--ui-border) text-sm text-(--ui-text-muted)">
                        <UIcon name="i-lucide-info" class="size-8 mb-2 opacity-20" />
                        <p>Aucune affectation active.</p>
                    </div>
                </div>
            </div>
        </div>
    </UDashboardPanel>

    <!-- État Vide -->
    <UDashboardPanel v-else class="flex-1">
        <div class="flex flex-1 items-center justify-center bg-(--ui-bg-elevated)/20 h-full">
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
    </UDashboardPanel>

</template>
