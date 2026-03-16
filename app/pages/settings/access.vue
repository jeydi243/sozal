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
        <div id="users-list-panel" class="w-[20%] h-screen overflow-y-auto border-r border-(--ui-border)">
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
            <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-(--ui-primary)/5 blur-[120px] rounded-full -mr-64 -mt-64 animate-pulse"></div>
            <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/5 blur-[100px] rounded-full -ml-32 -mb-32"></div>

            <UDashboardNavbar :toggle="false" class="border-b border-(--ui-border)/40 backdrop-blur-xl bg-(--ui-bg)/60 sticky top-0 z-20">
                <template #leading>
                    <div class="flex items-center gap-3">
                        <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" class="lg:hidden"
                            @click="selectedUser = null" />
                        <div class="flex flex-col">
                            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-(--ui-primary)/60 leading-none mb-1">Dossier Utilisateur</span>
                            <span class="text-sm font-bold text-(--ui-text-highlighted) leading-none">Gestion des Accès</span>
                        </div>
                    </div>
                </template>
                <template #right>
                    <div class="flex items-center gap-2">
                        <UTooltip text="Fermer le dossier">
                            <UButton icon="i-lucide-x" color="neutral" variant="ghost" class="hidden lg:flex rounded-full"
                                @click="selectedUser = null" />
                        </UTooltip>
                    </div>
                </template>
            </UDashboardNavbar>

            <div class="relative p-6 lg:p-10 overflow-y-auto h-[calc(100vh-64px)] pb-40 custom-scrollbar">
                <div class="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 items-start">
                    
                    <!-- LEFT COLUMN: VERTICAL HERO CARD -->
                    <div class="lg:col-span-4 sticky top-0 space-y-6">
                        <div class="relative overflow-hidden rounded-[40px] border border-(--ui-border)/40 bg-(--ui-bg-elevated)/40 backdrop-blur-2xl p-10 shadow-2xl group">
                            <!-- Visual Accents -->
                            <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-(--ui-primary) to-secondary opacity-80"></div>
                            
                            <div class="relative z-10 flex flex-col items-center text-center space-y-8">
                                <!-- Large Avatar with animated ring -->
                                <div class="relative">
                                    <div class="absolute -inset-4 bg-gradient-to-tr from-(--ui-primary)/20 to-secondary/20 rounded-full blur-lg animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                    <UAvatar :alt="`${selectedUser.prenom} ${selectedUser.nom}`" size="5xl"
                                        class="ring-8 ring-(--ui-bg-elevated) shadow-[0_20px_50px_rgba(0,0,0,0.1)] scale-110 relative z-10" />
                                    <div class="absolute bottom-1 right-1 bg-green-500 size-6 rounded-full border-4 border-(--ui-bg-elevated) shadow-lg z-20"></div>
                                </div>

                                <div class="space-y-4">
                                    <div class="space-y-1">
                                        <h1 class="text-3xl font-black tracking-tight text-(--ui-text-highlighted) leading-tight">
                                            {{ selectedUser.prenom }} <br/>
                                            <span class="text-(--ui-primary)">{{ selectedUser.nom }}</span>
                                        </h1>
                                        <p class="text-sm font-medium text-(--ui-text-muted) tracking-wide">
                                            @{{ selectedUser.user_name }}
                                        </p>
                                    </div>
                                    
                                    <div class="flex flex-wrap justify-center gap-2 pt-2">
                                        <UBadge variant="solid" color="primary" size="md" class="rounded-full px-4 font-bold shadow-sm ring-2 ring-(--ui-primary)/20">UTILISATEUR ACTIF</UBadge>
                                    </div>
                                </div>

                                <div class="w-full h-px bg-gradient-to-r from-transparent via-(--ui-border)/40 to-transparent"></div>

                                <!-- Primary Actions Menu -->
                                <div class="w-full space-y-3">
                                    <UButton icon="i-lucide-key-round" label="Réinitialiser" color="neutral" variant="subtle" block class="rounded-2xl py-3 font-bold" />
                                    <UButton icon="i-lucide-edit" label="Modifier le profil" color="primary" variant="solid" block class="rounded-2xl py-3 font-bold shadow-lg shadow-(--ui-primary)/20" />
                                </div>
                            </div>
                        </div>

                        <!-- Secondary Identity Plate -->
                        <div class="rounded-3xl border border-(--ui-border)/30 bg-(--ui-bg-elevated)/20 p-6 flex items-center justify-between group cursor-help">
                            <div class="flex items-center gap-4">
                                <div class="size-12 rounded-2xl bg-(--ui-bg-elevated) border border-(--ui-border)/50 flex items-center justify-center shadow-inner">
                                    <UIcon name="i-lucide-fingerprint" class="size-6 text-(--ui-text-dimmed)" />
                                </div>
                                <div>
                                    <p class="text-[10px] font-bold text-(--ui-text-dimmed) uppercase tracking-widest">Identité Système</p>
                                    <p class="text-xs font-mono text-(--ui-text-highlighted)">{{ selectedUser.user_id }}</p>
                                </div>
                            </div>
                            <UButton icon="i-lucide-copy" color="neutral" variant="ghost" size="xs" class="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" @click="copy(selectedUser.user_id)" />
                        </div>
                    </div>

                    <!-- RIGHT COLUMN: INFORMATION GRID -->
                    <div class="lg:col-span-8 space-y-10">
                        
                        <!-- Section: Contact & Info -->
                        <section class="space-y-4">
                            <header class="flex items-center gap-3 px-2">
                                <span class="size-2 rounded-full bg-(--ui-primary)"></span>
                                <h3 class="text-sm font-black uppercase tracking-[0.2em] text-(--ui-text-muted)">Informations de Contact</h3>
                            </header>

                            <div class="grid sm:grid-cols-2 gap-4">
                                <div class="p-6 rounded-3xl border border-(--ui-border)/50 bg-(--ui-bg-elevated)/40 backdrop-blur-md hover:border-(--ui-primary)/50 transition-colors group">
                                    <UIcon name="i-lucide-mail" class="size-5 text-(--ui-primary) mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <p class="text-[10px] font-bold text-(--ui-text-dimmed) uppercase tracking-widest mb-1">Adresse Email</p>
                                    <p class="text-base font-bold text-(--ui-text-highlighted)">{{ selectedUser.email }}</p>
                                </div>
                                <div class="p-6 rounded-3xl border border-(--ui-border)/50 bg-(--ui-bg-elevated)/40 backdrop-blur-md hover:border-(--ui-primary)/50 transition-colors group">
                                    <UIcon name="i-lucide-user-circle" class="size-5 text-(--ui-primary) mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <p class="text-[10px] font-bold text-(--ui-text-dimmed) uppercase tracking-widest mb-1">Nom Patronyme</p>
                                    <p class="text-base font-bold text-(--ui-text-highlighted)">{{ selectedUser.postnom || '--' }}</p>
                                </div>
                            </div>
                        </section>

                        <!-- Section: Affectations (The Core List) -->
                        <section class="space-y-6">
                            <header class="flex items-center justify-between px-2">
                                <div class="flex items-center gap-3">
                                    <span class="size-2 rounded-full bg-secondary"></span>
                                    <h3 class="text-sm font-black uppercase tracking-[0.2em] text-(--ui-text-muted)">Affectations & Rôles</h3>
                                </div>
                                <UsersAddAffectation 
                                    :user_id="selectedUser.user_id" 
                                    label="Nouvel Accès"
                                    icon="i-lucide-plus"
                                    color="primary"
                                    variant="soft"
                                    size="sm"
                                    class="rounded-full px-4 font-bold border border-(--ui-primary)/20"
                                    @affectation-added="refreshAffectations" 
                                />
                            </header>

                            <div v-if="loadingAffectations" class="flex flex-col items-center justify-center py-24 rounded-[40px] border-2 border-dashed border-(--ui-border)/60 bg-(--ui-bg-elevated)/10">
                                <div class="relative mb-6">
                                    <div class="absolute inset-0 bg-(--ui-primary)/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                                    <UIcon name="i-lucide-loader-2" class="animate-spin size-12 text-(--ui-primary) relative z-10" />
                                </div>
                                <p class="text-sm font-bold text-(--ui-text-dimmed) uppercase tracking-widest">Sincronisation des privilèges...</p>
                            </div>

                            <div v-else-if="affectations && affectations.length > 0" class="grid gap-5">
                                <div v-for="affect in affectations" :key="affect.id"
                                    class="group flex items-center justify-between p-7 bg-(--ui-bg-elevated)/40 backdrop-blur-xl rounded-[32px] border border-(--ui-border)/50 hover:border-(--ui-primary)/40 hover:bg-(--ui-bg-elevated)/70 hover:shadow-2xl hover:shadow-(--ui-primary)/5 transition-all duration-500 relative overflow-hidden">
                                    
                                    <!-- Action Highlight -->
                                    <div class="absolute left-0 top-0 w-1.5 h-full bg-(--ui-primary) transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>

                                    <div class="flex items-center gap-8">
                                        <!-- Animated Building Icon -->
                                        <div class="size-16 bg-(--ui-primary)/5 rounded-2xl flex items-center justify-center group-hover:bg-(--ui-primary)/10 group-hover:scale-110 transition-all duration-500 shadow-inner">
                                            <UIcon name="i-lucide-building-2" class="size-8 text-(--ui-primary)/60 group-hover:text-(--ui-primary) transition-colors" />
                                        </div>
                                        
                                        <div class="min-w-0 space-y-2">
                                            <p class="text-xl font-black text-(--ui-text-highlighted) truncate tracking-tight">
                                                {{ (affect.organisation as any)?.nom }}
                                            </p>
                                            <div class="flex items-center gap-3">
                                                <span class="text-[10px] font-black uppercase text-(--ui-text-dimmed) tracking-widest">Fonction :</span>
                                                <div class="flex items-center gap-1.5 bg-(--ui-primary)/10 text-(--ui-primary) px-3 py-1 rounded-full border border-(--ui-primary)/10">
                                                    <UIcon name="i-lucide-shield" class="size-3" />
                                                    <span class="text-[10px] font-black uppercase tracking-wider italic">
                                                        {{ (affect.lookup as any)?.nom || 'Standard' }}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-2">
                                        <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="md"
                                            class="rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-error/10 scale-90 group-hover:scale-100"
                                            @click="deleteAffectation(affect.id)" />
                                    </div>
                                </div>
                            </div>

                            <div v-else
                                class="flex flex-col items-center justify-center py-28 px-10 bg-(--ui-bg-elevated)/20 rounded-[40px] border-2 border-dashed border-(--ui-border)/40 text-center group">
                                <div class="size-24 bg-(--ui-primary)/5 rounded-[32px] flex items-center justify-center mb-8 group-hover:bg-(--ui-primary)/10 transition-colors shadow-inner">
                                    <UIcon name="i-lucide-shield-alert" class="size-12 text-(--ui-primary)/20 group-hover:text-(--ui-primary)/40 transition-colors" />
                                </div>
                                <h4 class="text-2xl font-black text-(--ui-text-highlighted) mb-3 tracking-tight">Aucun accès répertorié</h4>
                                <p class="max-w-xs mx-auto text-sm font-medium text-(--ui-text-muted) leading-relaxed">
                                    Cet utilisateur est actuellement suspendu de toute organisation médicale. Utilisez le bouton ci-dessus pour rétablir ses accès.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>

        <!-- État Vide -->
        <div v-else class="flex-1">
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
        </div>
    </div>
</template>
