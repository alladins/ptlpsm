/**
 * 공통 타입 정의
 * 모든 admin 페이지에서 공통으로 사용하는 타입
 */

/**
 * 페이지네이션 관련 타입
 */

/** 페이지 정보 */
export interface PageInfo {
  /** 현재 페이지 번호 (0부터 시작) */
  page: number
  /** 페이지 크기 */
  size: number
  /** 전체 요소 개수 */
  totalElements: number
  /** 전체 페이지 수 */
  totalPages: number
  /** 첫 페이지 여부 */
  first: boolean
  /** 마지막 페이지 여부 */
  last: boolean
}

/** 페이지네이션 요청 파라미터 */
export interface PaginationRequest {
  /** 페이지 번호 (0부터 시작) */
  page?: number
  /** 페이지 크기 */
  size?: number
  /** 정렬 기준 (예: 'createdAt,desc') */
  sort?: string
}

/** 페이지네이션 응답 */
export interface PaginationResponse<T> {
  /** 데이터 목록 */
  content: T[]
  /** 페이지 정보 */
  page: PageInfo
}

/** Spring Data 페이지네이션 응답 (백엔드 표준 형식) */
export interface SpringPageResponse<T> {
  /** 데이터 목록 */
  content: T[]
  /** 페이지 번호 (0부터 시작) */
  number: number
  /** 페이지 크기 */
  size: number
  /** 전체 요소 개수 */
  totalElements: number
  /** 전체 페이지 수 */
  totalPages: number
  /** 첫 페이지 여부 */
  first: boolean
  /** 마지막 페이지 여부 */
  last: boolean
  /** 빈 페이지 여부 */
  empty: boolean
}

/**
 * 정렬 관련 타입
 */

/** 정렬 방향 */
export type SortDirection = 'asc' | 'desc'

/** 정렬 옵션 */
export interface SortOption {
  /** 옵션 값 (예: 'createdAt,desc') */
  value: string
  /** 옵션 라벨 */
  label: string
}

/** 정렬 설정 */
export interface SortConfig {
  /** 정렬 필드 */
  field: string
  /** 정렬 방향 */
  direction: SortDirection
}

/**
 * 검색 관련 타입
 */

/** 기본 검색 필터 */
export interface BaseSearchFilter {
  /** 키워드 */
  keyword?: string
  /** 시작 날짜 */
  startDate?: string
  /** 종료 날짜 */
  endDate?: string
  /** 사용 여부 */
  useYn?: 'Y' | 'N' | ''
}

/** 날짜 범위 검색 */
export interface DateRangeFilter {
  /** 시작 날짜 */
  startDate?: string
  /** 종료 날짜 */
  endDate?: string
}

/**
 * API 응답 관련 타입
 */

/** 표준 API 응답 */
export interface ApiResponse<T> {
  /** 성공 여부 */
  success: boolean
  /** 응답 메시지 */
  message?: string
  /** 응답 데이터 */
  data: T
  /** 에러 정보 */
  error?: ApiError
}

/** API 에러 */
export interface ApiError {
  /** 에러 코드 */
  code: string
  /** 에러 메시지 */
  message: string
  /** 상세 정보 */
  details?: any
}

/** API 로딩 상태 */
export interface LoadingState {
  /** 로딩 중 여부 */
  loading: boolean
  /** 에러 */
  error: string | null
}

/**
 * 폼 관련 타입
 */

/** 폼 상태 */
export interface FormState<T> {
  /** 폼 데이터 */
  data: T
  /** 유효성 검증 에러 */
  errors: Partial<Record<keyof T, string>>
  /** 제출 중 여부 */
  submitting: boolean
  /** 수정 여부 (dirty) */
  dirty: boolean
}

/** 폼 필드 에러 */
export type FormErrors<T> = Partial<Record<keyof T, string>>

/** 폼 유효성 검증 규칙 */
export interface ValidationRule<T = any> {
  /** 필수 여부 */
  required?: boolean
  /** 최소 길이 */
  minLength?: number
  /** 최대 길이 */
  maxLength?: number
  /** 최솟값 */
  min?: number
  /** 최댓값 */
  max?: number
  /** 패턴 (정규표현식) */
  pattern?: RegExp
  /** 커스텀 검증 함수 */
  validator?: (value: T) => boolean | string
  /** 에러 메시지 */
  message?: string
}

/**
 * 모달 관련 타입
 */

/** 모달 상태 */
export interface ModalState {
  /** 열림 여부 */
  isOpen: boolean
  /** 모달 데이터 */
  data?: any
}

/** 모달 모드 */
export type ModalMode = 'create' | 'edit' | 'view' | 'delete'

/**
 * 테이블 관련 타입
 */

/** 테이블 컬럼 정의 */
export interface TableColumn<T = any> {
  /** 컬럼 키 */
  key: keyof T | string
  /** 컬럼 라벨 */
  label: string
  /** 정렬 가능 여부 */
  sortable?: boolean
  /** 컬럼 너비 */
  width?: string
  /** 정렬 여부 */
  align?: 'left' | 'center' | 'right'
  /** 포맷팅 함수 */
  formatter?: (value: any, row: T) => string
}

/** 테이블 액션 */
export interface TableAction<T = any> {
  /** 액션 라벨 */
  label: string
  /** 아이콘 클래스 */
  icon?: string
  /** 버튼 타입 */
  type?: 'primary' | 'secondary' | 'danger' | 'success'
  /** 클릭 핸들러 */
  handler: (row: T) => void
  /** 표시 조건 */
  visible?: (row: T) => boolean
  /** 활성화 조건 */
  disabled?: (row: T) => boolean
}

/**
 * 선택 옵션 타입
 */

/** 기본 선택 옵션 */
export interface SelectOption<T = string> {
  /** 옵션 값 */
  value: T
  /** 옵션 라벨 */
  label: string
  /** 비활성화 여부 */
  disabled?: boolean
}

/** 상태 드롭다운 옵션 (단순 버전) */
export interface StatusOption {
  /** 옵션 값 */
  value: string
  /** 옵션 라벨 */
  label: string
}

/**
 * 사용 여부 타입
 */

export type UseYn = 'Y' | 'N'

/**
 * 상태 관련 타입
 */

/** 공통 상태 (코드 관리 시스템에서 관리) */
export type CommonStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING_SIGNATURE'
  | 'SUBMITTED'

/** 상태 뱃지 타입 */
export type StatusBadgeType = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'

/**
 * DB 기반 상태 코드 인터페이스
 * code_detail 테이블에서 조회된 상태 코드 정보
 */
export interface StatusCode {
  /** 상태 코드 (예: PENDING, IN_PROGRESS) */
  code: string
  /** 상태 이름 (예: 대기, 진행중) */
  codeName: string
  /** 상태 설명 */
  description: string
  /** CSS 클래스명 (예: status-pending) */
  cssClass: string
  /** Tailwind 배지 클래스 (예: bg-yellow-100 text-yellow-800) */
  badgeClass: string
  /** 정렬 순서 */
  sortOrder: number
}

/**
 * 기본 엔티티 타입
 */

/** 생성/수정 정보가 포함된 기본 엔티티 */
export interface BaseEntity {
  /** 생성자 */
  createdBy?: string
  /** 생성일시 */
  createdAt?: string
  /** 수정자 */
  updatedBy?: string
  /** 수정일시 */
  updatedAt?: string
}

/** ID가 포함된 기본 엔티티 */
export interface IdentifiableEntity extends BaseEntity {
  /** ID */
  id: number | string
}

/**
 * 파일 관련 타입
 */

/** 파일 정보 */
export interface FileInfo {
  /** 파일명 */
  name: string
  /** 파일 크기 (bytes) */
  size: number
  /** MIME 타입 */
  type: string
  /** 파일 URL */
  url?: string
  /** 업로드 날짜 */
  uploadedAt?: string
}

/** 파일 업로드 결과 */
export interface FileUploadResult {
  /** 성공 여부 */
  success: boolean
  /** 파일 정보 */
  file?: FileInfo
  /** 에러 메시지 */
  error?: string
}

/**
 * 유틸리티 타입
 */

/** Nullable 타입 */
export type Nullable<T> = T | null

/** Optional 타입 */
export type Optional<T> = T | undefined

/** Nullable + Optional 타입 */
export type Maybe<T> = T | null | undefined

/** 깊은 Partial 타입 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** 깊은 Readonly 타입 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P]
}
