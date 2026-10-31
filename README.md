# Overview Cards

Home Assistant 오버뷰용 요약 카드. 방/기기 상세는 하위 뷰에 맡기고, 홈 화면에서는 **카테고리별 한 줄 요약**과 **확인이 필요한 알림**만 보여줍니다.

`custom:compact-overview-card` · 단일 JS 파일, 빌드/외부 라이브러리 없음 · 상태 읽기 전용(서비스 호출 없음)

## 설치

`compact-overview-card.js`를 `/config/www/`에 복사하고 대시보드 리소스에 JavaScript 모듈로 등록합니다 (`/local/compact-overview-card.js`). HACS 사용 시 Custom repositories에 이 저장소를 **Dashboard**로 추가합니다.

## 예제

```yaml
type: custom:compact-overview-card
name: 우리집
columns: auto            # auto | 2 | 3 | 4
alerts:                  # 조건이 맞을 때만 표시, 없으면 높이 0
  - entity: binary_sensor.kitchen_leak
    name: 누수 · 주방
    when: { state: "on" }
    level: critical      # warning(기본) | critical
    navigation_path: /lovelace/rooms
tiles:
  - type: count
    name: 조명
    icon: mdi:lightbulb-group
    entities: [light.living, light.bedroom, switch.kitchen]
    navigation_path: /lovelace/rooms
  - type: climate
    name: 냉난방
    icon: mdi:thermostat
    entities: [climate.living_heater, climate.living_ac]
    value_entity: sensor.living_temperature
  - type: status
    name: 가전
    icon: mdi:washing-machine
    idle_text: 모두 대기
    items:
      - { entity: sensor.washer_state, name: 세탁, active: [running], remaining: sensor.washer_remaining }
  - type: value
    name: 공기
    icon: mdi:air-filter
    entity: sensor.pm2_5
    thresholds:
      - { value: 35, direction: above, level: warning }
      - { value: 75, direction: above, level: critical }
  - type: health
    name: 서버
    icon: mdi:server
    items:
      - { entity: sensor.ssd_smart, problem: { state_not: PASSED }, level: critical }
      - { entity: sensor.cpu_temp, thresholds: [{ value: 75, direction: above, level: warning }] }
```

## 타일 유형

| type | 필수 | 표시 |
| --- | --- | --- |
| `count` | `entities` | `켜진 수/확인 가능한 수` |
| `climate` | `entities` (선택 `value_entity`) | `N대 가동` + 대표 온도 |
| `status` | `items[]` (`entity`, 선택 `name`/`active`/`remaining`) | 동작 중인 항목과 남은 시간, 없으면 `idle_text` |
| `value` | `entity` (선택 `secondary_entity`, `thresholds`) | 값 + 단위, 임계값 수준 |
| `health` | `items[]` (`problem` 또는 `thresholds` 필수) | 최악 수준의 건수, 없으면 `이상 없음` |

공통: `name`(필수), `icon`, `navigation_path`(없으면 대표 엔티티 상세 정보).

## 원칙

- 정상/위험 기준은 카드가 추측하지 않습니다. `thresholds`, `problem`, `alerts.when`에 사용자가 쓴 규칙만 적용합니다.
- 상태는 색 + `주의 ·`/`위험 ·` 문구 + 아이콘 변화로 함께 전달합니다.
- 일부 엔티티가 `unavailable`이면 분모에서 빼고 `N개 확인 불가`로 따로 표시하며, 정상으로 간주하지 않습니다.
- 타일 순서는 설정 순서를 유지하고 상태에 따라 재배치하지 않습니다.
- 알림이 없으면 알림 영역은 높이를 차지하지 않고, 제목 옆에 `✓ 이상 없음` 배지만 표시합니다.

## 개발

```bash
npm install
npm run check
npm test
```
