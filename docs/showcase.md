# 쇼케이스와 대표 이미지

`examples/showcase.html`은 오버뷰 카드가 세 가지 상황에서 어떻게 보이는지 나란히 보여 주는 모의 대시보드입니다. 실제 `compact-overview-card.js` 구현을 그대로 생성하며, 카드 내부 모양을 HTML로 다시 그리거나 스크린샷용 스타일로 덮어쓰지 않습니다.

## 로컬 실행

저장소 루트를 정적 서버로 제공한 뒤 다음 경로를 엽니다.

- 밝은 테마: `/examples/showcase.html`
- 미리보기는 기본 영어입니다. 한글 화면은 `lang=ko`를 붙입니다.
- 어두운 테마: `/examples/showcase.html?theme=dark`
- 캡처용: `?capture=true`(테마 전환 버튼을 숨김)

예를 들어 저장소 루트에서 `python3 -m http.server 8131 --bind 127.0.0.1`을 실행하고 `http://127.0.0.1:8131/examples/showcase.html`을 엽니다. 단일 카드는 `/examples/preview.html`에서 `?scenario=alert|normal|offline`, `&width=320|390|760`으로 확인합니다.

1160px 전후의 브라우저에서는 세 열, 중간 너비에서는 두 열, 640px 이하에서는 한 열로 배치합니다.

## 구현과 모의 동작

- 세 카드는 모두 실제 커스텀 엘리먼트입니다. 상황은 모의 엔티티 상태(`examples/states.js`)만 바꿉니다.
- Home Assistant의 `ha-card`·`ha-icon`만 로컬 시각 프리미티브로 대신합니다. 아이콘은 `preview-icons.js`의 로컬 MDI 경로를 사용하고 외부 이미지·폰트·스크립트를 요청하지 않습니다.
- 카드는 서비스를 호출하지 않습니다. 타일이나 알림을 누르면 모의 상세 정보 또는 이동 토스트만 표시하며, 실제 HA 상세 정보 창을 재현한 것은 아닙니다.

이미지는 **생성형 이미지나 가상의 목업이 아니라 이 페이지를 실제 브라우저에서 캡처한 결과**를 사용해야 합니다. 대표 이미지를 바꿀 때에는 테마·뷰포트·캡처 대상 커밋을 함께 기록하세요. 모의 상태 기반이므로 실제 HA 테마·버전·기기의 모든 동작을 검증한 화면은 아닙니다. 재현 방법은 [images/README.md](../images/README.md)에 있습니다.

## Home Assistant에서 같은 구성 사용

`examples/showcase.yaml`은 HTML과 같은 카드 설정을 사용하는 대시보드 예제입니다. 엔티티 ID를 실제 환경에 맞게 바꾸고 카드 리소스를 먼저 등록하세요. HTML의 모의 엔티티와 상태는 YAML만으로 생성되지 않습니다. 카드 설정을 변경하면 `examples/states.js`와 YAML을 함께 변경하세요. [Sections 문서](https://www.home-assistant.io/dashboards/sections/)의 대시보드 구조를 따릅니다.

## English

`examples/showcase.html` is a mock dashboard that shows the overview card in three situations side by side: something needs attention, everything is normal, and some devices do not respond. It instantiates the real `compact-overview-card.js`; only `ha-card` and `ha-icon` are local stand-ins, and scenarios change mocked entity states only (`examples/states.js`). Run `python3 -m http.server 8131 --bind 127.0.0.1` in the repository root and open `/examples/showcase.html` (add `?lang=ko` for Korean, `?theme=dark` for the dark theme, `&capture=true` to hide the theme button). `examples/showcase.yaml` holds the same card configuration for Home Assistant. Screenshots are real browser captures; see [images/README.md](../images/README.md).
