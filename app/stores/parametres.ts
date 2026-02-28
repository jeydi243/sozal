import { defineStore } from 'pinia'
import type { Lookup, Classe, Organisation, Affectation } from '~/types'

export const useParametresStore = defineStore('parametres', () => {
  const supabase = useSupabaseClient()

  const getClasseById = computed(() => (id: string) => {
    return classes.value.find(classe => classe.id === id)?.nom
  })
  const getLookupsById = computed(() => (id: string) => {
    return lookups.value.find(lookup => lookup.id == id)?.nom
  })

  const getClasseItems = computed(() => {
    return classes.value.map(classe => ({
      label: classe.nom,
      id: classe.id
    }))
  })

  const lookups = ref<Lookup[]>([])
  const classes = ref<Classe[]>([])
  const organisations = ref<Organisation[]>([])
  const affectations = ref<Affectation[]>([])

  const getAffectations = computed(() => affectations.value)

  async function init_user() {
    const user = useSupabaseUser()
    if (!user.value) {
      return {
        data: null,
        error: 'User not logged in',
        loading: false
      }
    }

    const { data: affectationsData, error: affectationsError } = await supabase
      .from('affectations')
      .select('*')
      .eq('user_id', user.value.id)

    if (affectationsData) affectations.value = affectationsData as unknown as Affectation[]

    return {
      data: {
        affectations: affectationsData
      },
      error: affectationsError,
      loading: false
    }
  }

  async function init() {
    const { data: lookupsData, error: lookupsError } = await supabase.from('lookups').select('*')
    if (lookupsData) lookups.value = lookupsData as unknown as Lookup[]

    const { data: classesData, error: classesError } = await supabase.from('classes').select('*')
    if (classesData) classes.value = classesData as unknown as Classe[]

    const { data: organisationsData, error: organisationsError } = await supabase.from('organisations').select('*')
    if (organisationsData) organisations.value = organisationsData as unknown as Organisation[]

    return {
      data: {
        lookups: lookupsData,
        classes: classesData,
        organisations: organisationsData
      },
      error: lookupsError || classesError || organisationsError,
      loading: false
    }
  }

  return {
    lookups,
    classes,
    organisations,
    affectations,
    getClasseById,
    getClasseItems,
    getLookupsById,
    init,
    init_user,
    getAffectations
  }
})
