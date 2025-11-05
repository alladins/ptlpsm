/**
 * 애플리케이션 전역 상수
 * 모든 페이지에서 공통으로 사용
 */

/**
 * 페이지네이션 상수
 */
export const PAGINATION = {
  /** 기본 페이지 크기 */
  DEFAULT_PAGE_SIZE: 10,
  /** 페이지 크기 옵션 */
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100] as const,
  /** 페이지 번호 표시 개수 (현재 페이지 기준 앞뒤) */
  PAGE_NUMBER_DISPLAY_COUNT: 2
} as const

/**
 * 날짜 형식 상수
 */
export const DATE_FORMAT = {
  /** 표준 날짜 형식 (YYYY-MM-DD) */
  STANDARD: 'YYYY-MM-DD',
  /** 한국 날짜 형식 (YYYY. MM. DD.) */
  KOREAN: 'YYYY. MM. DD.',
  /** 날짜/시간 형식 (YYYY-MM-DD HH:mm:ss) */
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  /** 월 형식 (YYYY-MM) */
  MONTH: 'YYYY-MM'
} as const

/**
 * API 상태 코드
 */
export const API_STATUS = {
  /** 성공 */
  SUCCESS: 200,
  /** 생성됨 */
  CREATED: 201,
  /** 처리 없음 */
  NO_CONTENT: 204,
  /** 잘못된 요청 */
  BAD_REQUEST: 400,
  /** 인증 필요 */
  UNAUTHORIZED: 401,
  /** 권한 없음 */
  FORBIDDEN: 403,
  /** 찾을 수 없음 */
  NOT_FOUND: 404,
  /** 서버 오류 */
  INTERNAL_SERVER_ERROR: 500
} as const

/**
 * 파일 업로드 제한
 */
export const FILE_UPLOAD = {
  /** 최대 파일 크기 (MB) */
  MAX_FILE_SIZE: 10,
  /** 허용된 이미지 확장자 */
  ALLOWED_IMAGE_EXTENSIONS: ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const,
  /** 허용된 문서 확장자 */
  ALLOWED_DOCUMENT_EXTENSIONS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'hwp'] as const,
  /** 모든 허용된 확장자 */
  ALL_ALLOWED_EXTENSIONS: [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'hwp'
  ] as const
} as const

/**
 * 입력 제한
 */
export const INPUT_LIMIT = {
  /** 일반 텍스트 최대 길이 */
  TEXT: 200,
  /** 짧은 텍스트 최대 길이 */
  SHORT_TEXT: 50,
  /** 긴 텍스트 최대 길이 (textarea) */
  LONG_TEXT: 1000,
  /** 설명 최대 길이 */
  DESCRIPTION: 500,
  /** 이메일 최대 길이 */
  EMAIL: 100,
  /** 전화번호 최대 길이 */
  PHONE: 20,
  /** 주소 최대 길이 */
  ADDRESS: 300,
  /** 코드 최대 길이 */
  CODE: 50
} as const

/**
 * 정렬 방향
 */
export const SORT_DIRECTION = {
  /** 오름차순 */
  ASC: 'asc',
  /** 내림차순 */
  DESC: 'desc'
} as const

/**
 * 사용 여부
 */
export const USE_YN = {
  /** 사용 */
  Y: 'Y',
  /** 미사용 */
  N: 'N'
} as const

/**
 * 상태 코드 - REMOVED
 *
 * ✅ 마이그레이션 완료: DB 기반 코드 관리 시스템으로 이관됨
 *
 * 대체 방법:
 * - Vue 컴포넌트: useCommonStatus() composable 사용
 * - Service 레이어: utils/status.ts의 함수 사용
 * - 영업 모듈: useSalesStatus() composable 사용
 *
 * 코드 그룹:
 * - COMMON_STATUS: 공통 상태 (PENDING, IN_PROGRESS, COMPLETED, CANCELLED, PENDING_SIGNATURE, SUBMITTED)
 * - SALES_STATUS: 영업 상태 (진행중, 완료, 취소, 보류)
 */

/**
 * 정렬 옵션 (공통)
 */
export const COMMON_SORT_OPTIONS = [
  { value: 'created_at,desc', label: '등록일시 최신순' },
  { value: 'created_at,asc', label: '등록일시 과거순' },
  { value: 'updated_at,desc', label: '수정일시 최신순' },
  { value: 'updated_at,asc', label: '수정일시 과거순' }
] as const

/**
 * 메시지
 */
export const MESSAGE = {
  /** 저장 성공 */
  SAVE_SUCCESS: '저장되었습니다.',
  /** 수정 성공 */
  UPDATE_SUCCESS: '수정되었습니다.',
  /** 삭제 성공 */
  DELETE_SUCCESS: '삭제되었습니다.',
  /** 등록 성공 */
  REGISTER_SUCCESS: '등록되었습니다.',
  /** 저장 실패 */
  SAVE_FAIL: '저장에 실패했습니다.',
  /** 수정 실패 */
  UPDATE_FAIL: '수정에 실패했습니다.',
  /** 삭제 실패 */
  DELETE_FAIL: '삭제에 실패했습니다.',
  /** 등록 실패 */
  REGISTER_FAIL: '등록에 실패했습니다.',
  /** 삭제 확인 */
  DELETE_CONFIRM: '정말 삭제하시겠습니까?',
  /** 변경사항 저장 확인 */
  UNSAVED_CHANGES: '저장하지 않은 변경사항이 있습니다. 페이지를 나가시겠습니까?',
  /** 데이터 로딩 중 */
  LOADING: '데이터를 불러오는 중...',
  /** 데이터 없음 */
  NO_DATA: '데이터가 없습니다.',
  /** 필수 입력 */
  REQUIRED: '필수 입력 항목입니다.',
  /** 서버 오류 */
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  /** 네트워크 오류 */
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.'
} as const

/**
 * 로컬 스토리지 키
 */
export const STORAGE_KEY = {
  /** API 환경 설정 */
  API_ENVIRONMENT: 'api_environment',
  /** 사용자 토큰 */
  ACCESS_TOKEN: 'access_token',
  /** 리프레시 토큰 */
  REFRESH_TOKEN: 'refresh_token',
  /** 사용자 정보 */
  USER_INFO: 'user_info',
  /** 페이지 크기 설정 */
  PAGE_SIZE: 'page_size'
} as const

/**
 * 디바운스/쓰로틀 시간 (ms)
 */
export const DELAY = {
  /** 검색 디바운스 */
  SEARCH_DEBOUNCE: 300,
  /** 자동 저장 디바운스 */
  AUTO_SAVE: 1000,
  /** 스크롤 쓰로틀 */
  SCROLL_THROTTLE: 100,
  /** 리사이즈 쓰로틀 */
  RESIZE_THROTTLE: 200
} as const

/**
 * 정규표현식
 */
export const REGEX = {
  /** 이메일 */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** 전화번호 (한국) */
  PHONE: /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/,
  /** 숫자만 */
  NUMBER_ONLY: /^\d+$/,
  /** 영문만 */
  ALPHABET_ONLY: /^[a-zA-Z]+$/,
  /** 영문+숫자 */
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  /** 한글만 */
  KOREAN_ONLY: /^[가-힣]+$/,
  /** URL */
  URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
} as const
