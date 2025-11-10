// BCrypt 비밀번호 검증 스크립트
const crypto = require('crypto');

// BCrypt 해시
const hash = '$2a$10$Pa2.YvGlwDAYzZNNdywqZutm.ZmpoDZbbs8uuaOY2E.FlOymaZmEG';
const password = 'abc1234';

console.log('=== BCrypt 비밀번호 검증 ===');
console.log('해시:', hash);
console.log('테스트 비밀번호:', password);
console.log('');

// bcryptjs 또는 bcrypt가 필요합니다
console.log('⚠️  이 스크립트를 실행하려면 bcryptjs 설치가 필요합니다:');
console.log('npm install bcryptjs');
console.log('');

try {
  const bcrypt = require('bcryptjs');
  const isMatch = bcrypt.compareSync(password, hash);

  console.log('✅ 검증 완료!');
  console.log('일치 여부:', isMatch ? '✅ 일치함' : '❌ 일치하지 않음');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('❌ bcryptjs 모듈을 찾을 수 없습니다.');
    console.log('');
    console.log('다음 명령어로 설치 후 다시 실행하세요:');
    console.log('npm install bcryptjs');
    console.log('node check-password.js');
  } else {
    console.error('오류:', error.message);
  }
}
