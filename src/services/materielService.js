import api from "./api";

export const materielService = {
    /**
   * 🔌 Récupère l'ensemble des matériels du parc (Multi-modules)
   */
  async getAllAssets() {
    // On lance la récupération de toutes les tables en parallèle
    const [resComputers, resMonitors, resPrinters, resPeripherals, resPhones] = await Promise.all([
      api.get('/Computer', { params: { range: '0-999' } }).catch(() => ({ data: [] })),
      api.get('/Monitor', { params: { range: '0-999' } }).catch(() => ({ data: [] })),
      api.get('/Printer', { params: { range: '0-999' } }).catch(() => ({ data: [] })),
      api.get('/Peripheral', { params: { range: '0-999' } }).catch(() => ({ data: [] })),
      api.get('/Phone', { params: { range: '0-999' } }).catch(() => ({ data: [] }))
    ])

    // On normalise les données pour avoir une structure identique peu importe le module
    const computers = (resComputers.data || []).map(item => ({ ...item, itemtype: 'Computer' }))
    const monitors = (resMonitors.data || []).map(item => ({ ...item, itemtype: 'Monitor' }))
    const printers = (resPrinters.data || []).map(item => ({ ...item, itemtype: 'Printer' }))
    const peripherals = (resPeripherals.data || []).map(item => ({ ...item, itemtype: 'Peripheral' }))
    const phones = (resPhones.data || []).map(item => ({ ...item, itemtype: 'Phone' }))

    // On fusionne le tout dans un seul grand tableau d'inventaire
    return [...computers, ...monitors, ...printers, ...peripherals, ...phones]
  }
}