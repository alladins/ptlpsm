-- ============================================
-- 기성청구 서명 요청 메시지 템플릿
-- ============================================

-- 1. 현장소장용 기성청구 서명 요청
INSERT INTO message_template (
    template_code,
    template_name,
    message_type,
    template_content,
    description,
    use_yn,
    created_at,
    updated_at
) VALUES (
    'PROGRESS_SIGN_SITE_MANAGER',
    '기성청구 현장소장 서명요청',
    'LMS',
    '[LP LEADPOWER 기성청구]
${recipientName}님, 안녕하세요.

${deliveryRequestNo} 건에 대한 ${baselineSeq}차 기성청구 서명이 필요합니다.

■ 수요기관: ${demandOrganization}
■ 사업명: ${projectName}
■ 청구금액: ${requestAmount}원

아래 링크를 클릭하여 서명해 주시기 바랍니다.
${signatureUrl}

* 링크는 발송 후 1일간 유효합니다.',
    '기성청구 현장소장 서명 요청 메시지 (중간 정산용)',
    'Y',
    NOW(),
    NOW()
);

-- 2. 감리원용 기성청구 서명 요청
INSERT INTO message_template (
    template_code,
    template_name,
    message_type,
    template_content,
    description,
    use_yn,
    created_at,
    updated_at
) VALUES (
    'PROGRESS_SIGN_INSPECTOR',
    '기성청구 감리원 서명요청',
    'LMS',
    '[LP LEADPOWER 기성청구]
${recipientName}님, 안녕하세요.

${deliveryRequestNo} 건에 대한 ${baselineSeq}차 기성청구 서명이 필요합니다.

■ 수요기관: ${demandOrganization}
■ 사업명: ${projectName}
■ 청구금액: ${requestAmount}원

아래 링크를 클릭하여 서명해 주시기 바랍니다.
${signatureUrl}

* 링크는 발송 후 1일간 유효합니다.',
    '기성청구 감리원 서명 요청 메시지 (중간 정산용)',
    'Y',
    NOW(),
    NOW()
);

-- ============================================
-- 참고: 기존 납품완료계 템플릿과의 차이점
-- ============================================
-- | 항목       | 납품완료계                    | 기성청구                              |
-- |------------|------------------------------|--------------------------------------|
-- | 제목       | [LP LEADPOWER 납품완료계]     | [LP LEADPOWER 기성청구]               |
-- | 내용       | 납품확인서 서명 요청          | ${baselineSeq}차 기성청구 서명 요청   |
-- | 목적       | 최종 납품 확인 (완료 시점)    | 중간 정산 확인 (진행 중)              |
-- | 사용 변수  | ${signatureUrl} 등           | ${baselineSeq}, ${requestAmount} 추가 |

-- ============================================
-- 템플릿 변수 설명
-- ============================================
-- ${recipientName}      - 수신자 이름 (현장소장/감리원)
-- ${deliveryRequestNo}  - 납품요구번호
-- ${baselineSeq}        - 기성 차수 (1차, 2차, ...)
-- ${demandOrganization} - 수요기관명
-- ${projectName}        - 사업명
-- ${requestAmount}      - 청구금액 (원)
-- ${signatureUrl}       - 서명 페이지 URL (토큰 포함)
