import { defineStore } from 'pinia'
import type { Lookup, Classe, Organisation } from '~/types'

export const useParametresStore = defineStore('parametres', () => {
  const supabase = useSupabaseClient()
  
  const lookups = ref<Lookup[]>([])
  const classes = ref<Classe[]>([])
  const organisations = ref<Organisation[]>([])

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
    init
  }
})
