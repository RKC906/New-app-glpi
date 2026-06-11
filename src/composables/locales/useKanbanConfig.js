import { ref, reactive, onMounted, watch } from 'vue'
import { kanbanConfigService } from '@/services/locale/kanbanConfigService'

export function useKanbanSettings() {
  const loading = ref(true)
  const saving = ref(false)
  const selectedLang = ref('fr') // Sera mis à jour par la BDD

  const languages = [
    { code: 'fr', label: '🇫🇷 Français (FR)' },
    { code: 'mg', label: '🇲🇬 Malgache (MG)' }
  ]

  const statusList = ref([
    { id: 1, defaultFr: 'Nouveau', currentTranslation: 'Nouveau' },
    { id: 2, defaultFr: 'En Cours', currentTranslation: 'En Cours' },
    { id: 5, defaultFr: 'Résolu', currentTranslation: 'Résolu' }
  ])

  const form = reactive({
    colors: { 1: '#f0f9ff', 2: '#fffaf0', 5: '#f0fdf4' }
  })

  let dbTranslations = []

  const loadSettings = async () => {
    try {
      loading.value = true
      const data = await kanbanConfigService.fetchConfig()
      
      // Assigner les couleurs et la langue sauvegardée
      data.colors.forEach(c => { form.colors[c.id_status] = c.color })
      selectedLang.value = data.currentLang || 'fr'
      
      dbTranslations = data.translations
      updateLabels()
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  }

  const updateLabels = () => {
    statusList.value = statusList.value.map(status => {
      const match = dbTranslations.find(
        t => t.id_status === status.id && t.langue === selectedLang.value
      )
      return { ...status, currentTranslation: match ? match.translation : status.defaultFr }
    })
  }

  watch(selectedLang, updateLabels)

const submitForm = async () => {
  try {
    saving.value = true
    // ERREUR COURANTE : Assurez-vous de bien envoyer "selectedLang.value"
    await kanbanConfigService.saveConfig(form.colors, selectedLang.value)
    alert('Configurations globales enregistrées !')
  } catch (error) {
    alert('Erreur lors de la sauvegarde.')
  } finally {
    saving.value = false
  }
}

  onMounted(loadSettings)

  return { loading, saving, selectedLang, languages, statusList, form, submitForm }
}