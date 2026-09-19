# HeliKit

회전익 조종사를 위한 단위 변환 및 탑재 여유중량 계산기입니다. 빌드 도구 없이 HTML·CSS·JavaScript만으로 동작하며, 서버 통신이나 정보 수집이 없습니다.

## 실행

```sh
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다. 같은 와이파이에 연결된 휴대폰에서는 컴퓨터의 로컬 IP 주소와 포트 `8000`으로 접속할 수 있습니다.

## 구성

- 상단 탭: 단위 계산 / 여유중량 계산
- 헤더 메뉴: 라이트·다크 모드 전환. 처음에는 기기 설정을 따르고, 직접 바꾼 선택은 저장
- 단위 계산: 2열 타일 7개, Android 기본 숫자 키보드, 연료 배지, 나머지 단위 목록
- 여유중량 계산: 6개 기종 선택, 짧은 인원·연료·장비 입력, 같은 화면의 결과 박스와 계산 내역
- 두 계산기 모두 연료 밀도 `6.7 lb/US gal` 고정

## 주의

`calculator.mjs`의 기종별 MTOW와 기본중량은 화면 흐름 확인용 임시 값입니다. 실제 운항에는 사용할 수 없습니다. 모든 계산은 참고용이며, 실제 운항은 비행교범과 W&B 기준을 따르세요.

## 테스트

```sh
node --test *.test.mjs
```

## APK 빌드

`main`에 푸시하면 GitHub Actions가 서명된 APK를 만듭니다. 저장소의 **Actions → Android APK → 최근 실행 → Artifacts**에서 받을 수 있습니다. 웹 파일을 고친 뒤 푸시만 하면 새 APK가 나오고, 버전 번호는 자동으로 올라갑니다.

처음 한 번 서명 키를 만들어 저장소 Secrets에 등록해야 합니다.

```sh
cd ~ && keytool -genkeypair -v -keystore helikit.jks -alias helikit -keyalg RSA -keysize 2048 -validity 10000
base64 -i helikit.jks | gh secret set ANDROID_KEYSTORE_BASE64
gh secret set ANDROID_KEYSTORE_PASSWORD
gh secret set ANDROID_KEY_ALIAS --body helikit
```

`helikit.jks`와 비밀번호는 저장소 밖에 따로 보관합니다. 같은 키로 서명해야 기존 앱 위에 업데이트 설치가 됩니다.

## 라이선스

[MIT](LICENSE) © 2026 유안

포함된 오픈소스:

- [decimal.js](https://github.com/MikeMcl/decimal.js) — MIT (`vendor/decimal-LICENCE.md`)
- [Pretendard](https://github.com/orioncactus/pretendard) v1.3.9 — SIL OFL 1.1 (`vendor/fonts/Pretendard-LICENSE.txt`)
