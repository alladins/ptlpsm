export const EVENT_TYPE = {
  DELIVERY_REGISTER: 'DELIVERY_REGISTER',
  SHIPMENT_REGISTER: 'SHIPMENT_REGISTER',
  PURCHASE_ORDER_REGISTER: 'PURCHASE_ORDER_REGISTER',
  PRODUCTION_COMPLETE: 'PRODUCTION_COMPLETE',
  TRANSPORT_REGISTER: 'TRANSPORT_REGISTER',
  SIGNATURE_REGISTER: 'SIGNATURE_REGISTER',
  DELIVERY_COMPLETE: 'DELIVERY_COMPLETE'
} as const

export type EventType = typeof EVENT_TYPE[keyof typeof EVENT_TYPE]

// 이벤트 타입별 아이콘 매핑
export const EVENT_ICON_MAP: Record<EventType, string> = {
  DELIVERY_REGISTER: 'fas fa-file-alt',
  SHIPMENT_REGISTER: 'fas fa-truck-loading',
  PURCHASE_ORDER_REGISTER: 'fas fa-shopping-cart',
  PRODUCTION_COMPLETE: 'fas fa-industry',
  TRANSPORT_REGISTER: 'fas fa-route',
  SIGNATURE_REGISTER: 'fas fa-signature',
  DELIVERY_COMPLETE: 'fas fa-check-double'
}

export interface Notification {
  notificationId: number
  eventType: EventType
  menuCode: string
  title: string
  message: string
  referenceId?: number
  referenceUrl?: string
  createdBy: string
  createdAt: string
  isRead: boolean
}
