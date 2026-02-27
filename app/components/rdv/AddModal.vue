<script setup lang="ts">
import * as z from 'zod'
import type { FormError, FormErrorEvent, FormSubmitEvent } from '@nuxt/ui'
import { CalendarDate, getLocalTimeZone } from '@internationalized/date'

const schema = z.object({
  patient_id: z.string().min(2, 'Too short'),
  medecin_id: z.string(),
  organisation_id: z.string(),
  date_rdv: z.date().max(new Date(), 'Date de rdv'),
  heure_rdv: z.string(),
  motif: z.string(),
})
const toast = useToast()
const open = ref(false)
const emit = defineEmits(['patient-added'])
const supabase = useSupabaseClient()
type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  patient_id: undefined,
  medecin_id: undefined,
  organisation_id: undefined,
  date_rdv: undefined,
  heure_rdv: undefined,
  motif: undefined,
})
const inputDateRef = useTemplateRef('inputDateRef')
const itemsGenre = [
  { value: 'M', label: 'Masculin' },
  { value: 'F', label: 'Feminin' }
]

const maxDate = new CalendarDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())
const toCalendarDate = (date: Date) => {
  return new CalendarDate(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
}

const dateNaissanceModel = computed({
  get: () => state.date_rdv ? toCalendarDate(state.date_rdv) : undefined,
  set: (value: CalendarDate | null) => {
    state.date_rdv = value ? value.toDate(getLocalTimeZone()) : undefined
  }
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const { data, error } = await supabase
    .from('rdv')
    .insert(event?.data as any)
    .select()

  if (error) {
    toast.add({ title: 'Error', description: `Can't add new rendez-vous ${error.message}`, color: 'error' })
  } else {
    toast.add({ title: 'Success', description: `Nouveau rendez-vous pour le ${event.data.date_rdv} à ${event.data.heure_rdv}  ajouté`, color: 'success' })
    open.value = false
    emit('patient-added')
  }
}

function onError(error: FormErrorEvent) {
  toast.add({ title: 'Error', description: error.errors[0]?.message, color: 'error' })
}
</script>

<template>
  <UModal v-model:open="open" title="Nouveau rendez-vous" description="Ajouter un nouveau rendez-vous">
    <UButton label="Nouveau rendez-vous" icon="i-lucide-plus" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit" @error="onError">
        <UFormField label="Patient" placeholder="John Doe" name="patient_id">
          <UInput v-model="state.patient_id" class="w-full" />
        </UFormField>
        <UFormField label="Organisation" placeholder="john.doe@example.com" name="organisation_id">
          <UInput v-model="state.organisation_id" class="w-full" />
        </UFormField>
        <UFormField label="Medecin" placeholder="john.doe@example.com" name="medecin_id">
          <UInput v-model="state.medecin_id" class="w-full" />
        </UFormField>
        <UFormField label="Date de rdv" placeholder="08/12/2025" name="date_rdv">
          <UInputDate v-model="dateNaissanceModel" class="w-full" :max-date="maxDate" >
            <template #trailing>
              <UPopover :reference="inputDateRef?.inputsRef[3]?.$el">
                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" aria-label="Select a date"
                  class="px-0" />

                <template #content>
                  <UCalendar v-model="dateNaissanceModel" class="p-2" :max-date="maxDate" />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>
        <UFormField label="Heure de rdv" placeholder="08/12/2025" name="heure_rdv">
          <UInputDate v-model="dateNaissanceModel" class="w-full" :max-date="maxDate" >
            <template #trailing>
              <UPopover :reference="inputDateRef?.inputsRef[3]?.$el">
                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" aria-label="Select a date"
                  class="px-0" />

                <template #content>
                  <UCalendar v-model="dateNaissanceModel" class="p-2" :max-date="maxDate" />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>
        <UFormField label="Motif" placeholder="john.doe@example.com" name="motif">
          <UInput v-model="state.motif" class="w-full" />
        </UFormField>
       
        <UFormField label="Date de naissance" placeholder="08/12/2025" name="date_naissance">
          <UInputDate v-model="dateNaissanceModel" class="w-full" :max-date="maxDate" >
            <template #trailing>
              <UPopover :reference="inputDateRef?.inputsRef[3]?.$el">
                <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" aria-label="Select a date"
                  class="px-0" />

                <template #content>
                  <UCalendar v-model="dateNaissanceModel" class="p-2" :max-date="maxDate" />
                </template>
              </UPopover>
            </template>
          </UInputDate>
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
          <UButton label="Ajouter" icon="i-lucide-plus" color="primary" variant="solid" type="submit" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
