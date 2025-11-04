/**
 * 납품확인 트리 구조 타입 정의
 *
 * 계층 구조: Order → Shipment → Transport → DeliveryConfirmation
 */

/**
 * 납품확인 정보 (최하위 노드)
 */
export interface DeliveryConfirmationNode {
  deliveryId: number
  status: string
  completedAt: string
  hasSignature: boolean
  pdfFileUrl: string | null
  signatureUrl: string | null
  photoCount: number
  photoUrls: string[]
  latitude: number | null
  longitude: number | null
}

/**
 * 운송 정보 (3단계)
 */
export interface TransportDetailNode {
  transportId: number
  trackingNumber: string
  vehicleNo: string
  driverName: string
  driverPhone: string | null
  deliveryAddress: string
  addressDetail: string | null
  deliveryDate: string
  siteSupervisorName: string | null
  siteSupervisorPhone: string | null
  status: string
  deliveryConfirmation: DeliveryConfirmationNode | null
}

/**
 * 출하 정보 (2단계)
 */
export interface ShipmentTreeNode {
  shipmentId: number
  shipmentDate: string | null
  shipmentQuantity: number
  shipmentResponsible: string | null
  status: string
  itemCount: number
  itemSummary: string | null
  transport: TransportDetailNode | null
}

/**
 * 발주 정보 (1단계 - 최상위)
 */
export interface OrderTreeNode {
  orderId: number
  deliveryRequestNo: string
  deliveryRequestDate: string  // 납품요구일자
  earliestDeliveryDeadline: string  // 가장 빠른 납품기한
  contractId: string
  contractDate: string
  client: string
  projectName: string
  totalOrderQuantity: number
  totalShippedQuantity: number
  totalDeliveredQuantity: number
  inProgressQuantity: number  // 진행중 수량 (출하완료 - 납품완료)
  deliveryRate: number
  unit: string
  shipments: ShipmentTreeNode[]
}

/**
 * 트리 구조 API 응답
 */
export interface DeliveryTreeResponse {
  content: OrderTreeNode[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
}

/**
 * 트리 조회 요청 파라미터
 */
export interface DeliveryTreeSearchParams {
  startDate?: string
  endDate?: string
  deliveryRequestNo?: string
  status?: string
  page?: number
  size?: number
  sort?: string
}
