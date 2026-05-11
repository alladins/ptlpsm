import { getAuthHeaders, getApiBaseUrl } from './api'

export interface SystemSetting {
  settingKey: string
  settingValue: string
  settingName: string
  settingDescription: string
  settingGroup: string
  dataType: string
  updatedAt: string
}

const BASE_URL = () => `${getApiBaseUrl()}/system/settings`

export const systemSettingService = {
  async getAllSettings(): Promise<SystemSetting[]> {
    const response = await fetch(BASE_URL(), {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  async getSettingsByGroup(group: string): Promise<SystemSetting[]> {
    const response = await fetch(`${BASE_URL()}/group/${group}`, {
      headers: getAuthHeaders()
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.json()
  },

  async updateSetting(settingKey: string, settingValue: string): Promise<void> {
    const response = await fetch(`${BASE_URL()}/${settingKey}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ settingValue })
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
  }
}
