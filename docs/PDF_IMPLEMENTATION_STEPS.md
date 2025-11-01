# PDF 생성 기능 구현 단계

## 📝 Step-by-Step 가이드

### Step 1: html2pdf.js 설치

프로젝트 루트 디렉토리에서 실행:

```bash
npm install html2pdf.js
```

설치 후 `package.json`에 다음이 추가됨:
```json
{
  "dependencies": {
    "html2pdf.js": "^0.10.2"
  }
}
```

---

### Step 2: 코드 수정

**파일**: `pages/admin/transport/edit/[id].vue`

#### 2-1. Import 추가 (Line 512 다음)

```typescript
import { getApiBaseUrl } from '~/services/api'
import html2pdf from 'html2pdf.js'  // ← 이 줄 추가
```

#### 2-2. printReceiptDocument 함수 수정 (Line 810-814)

**기존**:
```typescript
// 인수증 문서 출력
const printReceiptDocument = () => {
  console.log('인수증 문서 출력')
  window.print()
  closeReceiptPopup()
}
```

**수정 후**:
```typescript
// 인수증 문서 출력
const printReceiptDocument = async () => {
  console.log('인수증 문서 출력')

  // 사용자에게 출력 방식 선택
  const usePDF = confirm(
    'PDF로 다운로드하시겠습니까?\n\n' +
    '✅ 확인: PDF 파일로 다운로드\n' +
    '❌ 취소: 브라우저 인쇄창 열기'
  )

  if (usePDF) {
    try {
      // PDF 생성 대상 요소
      const element = document.querySelector('.receipt-preview')

      if (!element) {
        alert('인수증 템플릿을 찾을 수 없습니다.')
        return
      }

      // 파일명 생성
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const filename = `인수증_${formData.value.trackingNumber || 'unknown'}_${today}.pdf`

      // PDF 생성 옵션
      const opt = {
        margin: [10, 10, 10, 10], // 상, 우, 하, 좌 여백 (mm)
        filename: filename,
        image: {
          type: 'jpeg',
          quality: 0.98
        },
        html2canvas: {
          scale: 2,                    // 해상도 (2 = 200%)
          useCORS: true,               // 외부 이미지 허용
          logging: false,              // 콘솔 로그 비활성화
          backgroundColor: '#ffffff',  // 배경색
          letterRendering: true        // 텍스트 렌더링 개선
        },
        jsPDF: {
          unit: 'mm',                  // 단위
          format: 'a4',                // 용지 크기
          orientation: 'portrait',     // 세로 방향
          compress: true               // 파일 압축
        },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy']  // 페이지 나누기 방지
        }
      }

      console.log('PDF 생성 중...', { filename, element })

      // PDF 생성 및 다운로드
      await html2pdf().set(opt).from(element).save()

      console.log('PDF 생성 완료:', filename)

      // 성공 메시지 (선택사항)
      // alert('PDF 파일이 다운로드되었습니다.')
    } catch (error) {
      console.error('PDF 생성 실패:', error)
      alert(
        'PDF 생성에 실패했습니다.\n' +
        '브라우저 인쇄 기능을 사용해주세요.\n\n' +
        '오류: ' + (error.message || '알 수 없는 오류')
      )
    }
  } else {
    // 브라우저 기본 인쇄
    window.print()
  }

  closeReceiptPopup()
}
```

---

### Step 3: 테스트

#### 3-1. 개발 서버 재시작

```bash
npm run dev
```

#### 3-2. 테스트 시나리오

1. **운송장 목록 페이지** 접속
   - URL: `http://localhost:3000/admin/transport/list`

2. **운송장 수정 페이지** 접속
   - 운송장 하나 클릭
   - URL: `http://localhost:3000/admin/transport/edit/2`

3. **인수증 팝업 열기**
   - "운송장 출력" 버튼 클릭
   - 인수증 팝업이 표시됨

4. **PDF 다운로드 테스트**
   - "인수증 출력" 버튼 클릭
   - 확인 대화상자에서 "확인" 클릭
   - PDF 파일 자동 다운로드 확인
   - 파일명: `인수증_20251029-1234-001_20251101.pdf`

5. **브라우저 인쇄 테스트**
   - "인수증 출력" 버튼 클릭
   - 확인 대화상자에서 "취소" 클릭
   - 브라우저 인쇄창 표시 확인

#### 3-3. 예상 결과

**성공 시**:
- ✅ PDF 파일이 브라우저 다운로드 폴더에 저장됨
- ✅ 파일을 열면 인수증 내용이 정상 표시됨
- ✅ 한글, 표, 이미지 모두 정상 출력됨
- ✅ A4 용지 크기에 맞게 출력됨

**실패 시**:
- ❌ 에러 메시지가 alert로 표시됨
- ❌ 콘솔에 에러 로그 출력됨
- ❌ 자동으로 브라우저 인쇄 대체 제안

---

### Step 4: 고급 설정 (선택사항)

#### 4-1. 파일명 커스터마이징

```typescript
const filename = `인수증_${formData.value.clientName}_${formData.value.trackingNumber}_${today}.pdf`
// 예: 인수증_한국농어촌공사_20251029-1234-001_20251101.pdf
```

#### 4-2. 페이지 나누기 설정

인수증이 2장인 경우 각각 별도 페이지로:

```typescript
pagebreak: {
  mode: ['css'],
  before: '.receipt-document:nth-child(2)'  // 두 번째 인수증 전에 페이지 나누기
}
```

#### 4-3. 로딩 인디케이터 추가

```typescript
const printReceiptDocument = async () => {
  if (usePDF) {
    const loadingMsg = document.createElement('div')
    loadingMsg.textContent = 'PDF 생성 중...'
    loadingMsg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);' +
                                'background:rgba(0,0,0,0.8);color:white;padding:20px;border-radius:8px;z-index:9999;'
    document.body.appendChild(loadingMsg)

    try {
      await html2pdf().set(opt).from(element).save()
    } finally {
      document.body.removeChild(loadingMsg)
    }
  }
}
```

#### 4-4. 워터마크 추가

```typescript
jsPDF: {
  unit: 'mm',
  format: 'a4',
  orientation: 'portrait',
  compress: true,
  hotfixes: ['px_scaling'],
  putOnlyUsedFonts: true,
  floatPrecision: 16,
  userUnit: 1.0
}
```

---

### Step 5: 문제 해결

#### 문제 1: "html2pdf is not defined"

**원인**: Import 경로 오류

**해결**:
```typescript
// ❌ 틀린 방법
import html2pdf from 'html2pdf'

// ✅ 올바른 방법
import html2pdf from 'html2pdf.js'
```

#### 문제 2: 로고 이미지가 안 나옴

**원인**: CORS 정책

**해결**:
```typescript
html2canvas: {
  useCORS: true,
  allowTaint: true,  // ← 추가
  proxy: null
}
```

#### 문제 3: 한글이 깨짐

**원인**: 폰트 렌더링 문제

**해결**:
```typescript
html2canvas: {
  scale: 3,  // 해상도 더 높이기
  letterRendering: true,
  foreignObjectRendering: false
}
```

#### 문제 4: 생성 속도가 느림

**원인**: 높은 해상도 설정

**해결**:
```typescript
html2canvas: {
  scale: 1.5,  // 2 → 1.5로 낮추기
  logging: false
},
image: {
  type: 'jpeg',  // PNG → JPEG
  quality: 0.85  // 0.98 → 0.85로 낮추기
}
```

---

### Step 6: 프로덕션 배포

#### 6-1. 빌드 테스트

```bash
npm run build
npm run preview
```

#### 6-2. 환경별 설정

**개발 환경**:
```typescript
const isDevelopment = process.env.NODE_ENV === 'development'

html2canvas: {
  logging: isDevelopment,  // 개발 환경에서만 로그
  scale: isDevelopment ? 1.5 : 2  // 개발 환경에서는 낮은 해상도
}
```

#### 6-3. 성능 모니터링

```typescript
const startTime = Date.now()

await html2pdf().set(opt).from(element).save()

const endTime = Date.now()
console.log(`PDF 생성 시간: ${endTime - startTime}ms`)
```

---

## ✅ 완료 체크리스트

- [ ] `npm install html2pdf.js` 실행
- [ ] import 문 추가
- [ ] `printReceiptDocument` 함수 수정
- [ ] 개발 서버 재시작
- [ ] PDF 다운로드 테스트
- [ ] 브라우저 인쇄 테스트
- [ ] 한글/이미지 정상 출력 확인
- [ ] 파일명 형식 확인
- [ ] 여러 운송장에서 테스트
- [ ] 에러 처리 테스트

---

**작성일**: 2025-11-01
