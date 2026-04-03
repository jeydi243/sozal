# Instructions pour l'IA — Projet Sozal

## Contexte du projet

**Sozal** est une application de gestion médicale (patients, consultations, rendez-vous, partenaires) construite avec **Nuxt 4 + Supabase + Nuxt UI v4 + Pinia**.

- Package manager : **Bun** (`bun install`, `bun run dev`)
- Nuxt compat v4 : tout le code app est dans `app/`, pas à la racine
- Langue de l'interface : **français**
- Langue du code (variables, fonctions, types) : **anglais/français mix** selon le contexte métier (ex: `nom`, `prenom`, `affectation` sont en français car termes métier)

---

## Règles absolues du store Pinia

> Toutes les actions du store **doivent retourner `{ data, error, loading }`** pour imiter le modèle client Supabase.

```ts
// ✅ Obligatoire
async function monAction() {
  const { data, error } = await supabase.from('table').select()
  return { data, error, loading: false }
}

// ❌ Interdit
async function monAction() {
  return await supabase.from('table').select()
}
```

---

## Structure des fichiers Vue — Convention d'ordre

```
Pages / vues complexes    → <template> D'ABORD, puis <script setup lang="ts">
Modals / composants CRUD  → <script setup lang="ts"> D'ABORD, puis <template>
```

Toujours `<script setup lang="ts">`. Jamais d'Options API, jamais de `defineComponent`.

---

## Ordre de déclaration dans le `<script>` d'une page

Respecter **impérativement** cet ordre :

```ts
// 1. SEO
useHead({ title: '...', meta: [...] })

// 2. Services et composables
const supabase = useSupabaseClient()
const toast = useToast()
const store = useParametresStore()

// 3. resolveComponent() — obligatoire avant tout usage dans h()
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

// 4. Refs d'état UI
const openSlideOver = ref(false)
const selectedItem = ref<Type | null>(null)
const statusFilter = ref('all')

// 5. useDataTable (si page avec tableau)
const { table, columnDisplayItems, ... } = useDataTable({ filterColumnId: 'nom', pageSize: 10 })

// 6. Définition des colonnes (array statique TypeScript)
const columns: TableColumn<Type>[] = [ ... ]

// 7. Fonctions utilitaires (getRowItems, etc.)
function getRowItems(row: Row<Type>) { ... }

// 8. Chargement des données — SEMPRE EN DERNIER
const { data, pending, refresh } = await useAsyncData('cle', async () => { ... })
```

---

## Règle : toujours `useDataTable` pour les tableaux

Ne jamais recréer manuellement la logique de pagination/filtres. Utiliser systématiquement le composable :

```ts
const {
  table, UButton, UBadge, UDropdownMenu, UCheckbox,
  columnFilters, columnVisibility, rowSelection,
  pagination, paginationOptions, statusFilter,
  columnDisplayItems, selectedRowCount, totalFilteredRows,
  currentPage, currentPageSize, setPage, setStatusFilter
} = useDataTable({ filterColumnId: 'nom', pageSize: 10 })
```

**Fichiers de référence** (à utiliser comme modèles) :
- Nouvelle page liste → copier `app/pages/settings/organisations.vue`
- Nouveau modal → copier `app/components/organisations/AddModal.vue`
- Nouveau composant détail/slideover → copier `app/components/users/Details.vue`

---

## Règle : render functions `h()` pour les colonnes de tableau

Ne jamais utiliser de slot template dans les colonnes `TableColumn`. Toujours des render functions.

```ts
// ✅ Correct
{
  accessorKey: 'nom',
  header: 'Nom',
  cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
    h('div', undefined, [
      h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.nom)
    ])
  ])
}

// Colonne avec tri
{
  accessorKey: 'description',
  header: ({ column }) => {
    const isSorted = column.getIsSorted()
    return h(UButton, {
      color: 'neutral', variant: 'ghost', label: 'Description',
      icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down',
      class: '-mx-2.5',
      onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
    })
  }
}

// Colonne Actions (dropdown)
{
  header: () => h('div', { class: 'text-center' }, 'Actions'),
  id: 'actions',
  cell: ({ row }) => h('div', { class: 'text-center' },
    h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row) },
      () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost', class: 'ml-auto' })
    )
  )
}
```

**Important** : les composants utilisés dans `h()` doivent toujours être déclarés via `resolveComponent()` en haut du script.

---

## Règle : `getRowItems` toujours externalisée

Les items du dropdown d'actions ne sont **jamais** définis inline. Toujours dans une fonction séparée :

```ts
function getRowItems(row: Row<MonType>) {
  return [
    { type: 'label', label: 'Actions' },
    {
      label: 'Copier l\'ID',
      icon: 'i-lucide-copy',
      onSelect() {
        navigator.clipboard.writeText(row.original.id.toString())
        toast.add({ title: 'Copié !', description: '...' })
      }
    },
    { type: 'separator' },
    {
      label: 'Voir les détails',
      icon: 'material-symbols:open-in-full-rounded',
      onSelect() {
        selectedItem.value = row.original
        openSlideOver.value = true
      }
    },
    { type: 'separator' },
    {
      label: 'Supprimer',
      icon: 'i-lucide-trash',
      color: 'error',
      async onSelect() {
        const { error } = await supabase.from('table').delete().eq('id', row.original.id)
        if (error) {
          toast.add({ title: 'Erreur', description: error.message, color: 'error' })
        } else {
          toast.add({ title: 'Supprimé', description: `"${row.original.nom}" supprimé.`, color: 'success' })
          await refresh()
        }
      }
    }
  ]
}
```

---

## Règle : `:ui` du `UTable` — bloc fixe

Ce bloc est **identique dans chaque tableau** du projet. Ne pas réinventer :

```html
:ui="{
  base: 'table-fixed border-separate border-spacing-0 border border-(--ui-border) rounded-t-lg',
  thead: '[&>tr]:bg-(--ui-bg-elevated)/50 [&>tr]:after:content-none',
  tbody: '[&>tr]:last:[&>td]:border-b-0',
  th: 'py-1 first:rounded-tl-[calc(var(--ui-radius)*2)] last:rounded-tr-[calc(var(--ui-radius)*2)] border-y border-(--ui-border) first:border-l last:border-r',
  td: 'border-b border-(--ui-border) p-2'
}"
```

---

## Règle : Pattern Modal CRUD

```ts
// Schema Zod d'abord
const schema = z.object({
  nom: z.string().min(3, 'Too short'),
  lookup_id: z.string(),
})
type Schema = z.output<typeof schema>

// State initialisé à undefined (jamais null ni '')
const state = reactive<Partial<Schema>>({
  nom: undefined,
  lookup_id: undefined,
})

// Submit : insert + toast + emit + close
async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { data, error } = await supabase.from('table').insert({ ...event.data }).select()
  if (error) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  } else {
    toast.add({ title: 'Success', description: `${event.data.nom} ajouté`, color: 'success' })
    emit('item-added')   // notifier la page parente
    open.value = false   // fermer la modal
  }
}
```

Template modal :
```html
<UModal v-model:open="open" title="..." description="...">
  <UButton label="New ..." icon="i-lucide-plus" />
  <template #body>
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
      <!-- champs -->
      <div class="flex justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
        <UButton label="Add" color="primary" variant="solid" type="submit" />
      </div>
    </UForm>
  </template>
</UModal>
```

---

## Règle : v-model sur composant enfant — pattern computed get/set

Pour tout composant qui expose un `open` prop et doit émettre `update:open` :

```ts
const props = defineProps({
  open: { type: Boolean, required: true },
  item: { type: Object as PropType<MonType | null>, required: true }
})
const emit = defineEmits(['update:open'])

// ✅ Toujours ce pattern — jamais de mutation directe de prop
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})
```

---

## Règle : Chargement des données

Toujours `useAsyncData` + `useSupabaseClient()`. Toujours `throw error` si erreur. Toujours exposer `refresh`.

```ts
const { data: organisations, pending, refresh: refreshOrganisations } =
  await useAsyncData('organisations', async () => {
    const { data, error } = await supabase
      .from('organisations')
      .select('*, lookup:lookup_id(*)')   // jointure via syntaxe Supabase
    if (error) throw error
    return data
  })
```

Pour un chargement réactif à une prop :
```ts
const { data, refresh } = useAsyncData(
  `cle-${props.item?.id}`,   // clé dynamique
  async () => { ... },
  { watch: [() => props.item], immediate: true }
)
```

---

## Règle : Gestion des erreurs — toast systématique

**Toujours** un toast succès ET un toast erreur sur chaque opération mutante :

```ts
if (error) {
  toast.add({ title: 'Erreur', description: error.message, color: 'error' })
} else {
  toast.add({ title: 'Succès', description: '...', color: 'success' })
  await refresh()   // toujours rafraîchir
}
```

---

## Règle : CSS — uniquement les tokens `--ui-*`

```html
<!-- ✅ Correct -->
<p class="text-(--ui-text-highlighted)">...</p>
<div class="border-(--ui-border)">...</div>
<div class="bg-(--ui-bg-elevated)/50">...</div>
<p class="text-(--ui-text-muted)">...</p>

<!-- ❌ Interdit — pas de couleurs Tailwind arbitraires -->
<p class="text-gray-800 dark:text-white">...</p>
```

---

## Naming conventions

| Élément | Convention | Exemple |
|---|---|---|
| Composants | PascalCase (dossier+nom auto-importé) | `OrganisationsAddModal` |
| Variable de données chargée | camelCase | `organisations`, `Articles`, `Users` |
| Ref état UI (open/close) | `open` + NomComposant | `openSlideOver`, `openDetailsUser` |
| Item sélectionné | `selected` + NomType | `selectedOrganisation`, `selectedUser` |
| Fonction refresh | `refresh` + NomDonnée | `refreshOrganisations`, `refreshAffectations` |
| Événements émis | kebab-case | `organisation-added`, `user-added` |
| Types TypeScript | PascalCase | `Organisation`, `Profil`, `Affectation` |

---

## Ce qu'il ne faut PAS faire

- ❌ Ne jamais créer un nouveau store Pinia sans le pattern `{ data, error, loading }`
- ❌ Ne jamais gérer la logique de tableau manuellement (toujours `useDataTable`)
- ❌ Ne jamais utiliser des slots template dans les colonnes `UTable`  (toujours `h()`)
- ❌ Ne jamais muter une prop directement (toujours `computed get/set`)
- ❌ Ne jamais utiliser des couleurs Tailwind directes (toujours les tokens `--ui-*`)
- ❌ Ne jamais laisser une erreur Supabase silencieuse (toujours un toast)
- ❌ Ne jamais appeler `supabase.from()` directement dans `onMounted` pour le chargement initial (toujours `useAsyncData`)
