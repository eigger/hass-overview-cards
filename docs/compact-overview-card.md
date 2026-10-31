# Compact overview card — 오버뷰 요약

![알림과 직접 조작이 되는 탭 단위 섹션](../images/overview-card-ko.jpg)

원래 오버뷰 구성(탭마다 제목 + 조작 행)을 유지하면서 **섹션 헤더에 한 줄 요약**을 붙이고 **확인이 필요한 알림**을 위에 모아 보여줍니다. 섹션 안의 행은 `compact-home-panel`이라서 직접 조작할 수 있습니다. 조작 없는 요약 격자가 필요하면 `tiles`를 사용합니다. 이미지는 모의 상태를 사용하는 로컬 미리보기이며 실제 화면은 설정과 카드 너비에 따라 달라집니다.

<details>
<summary>모바일, 어두운 테마, 정상 상태, 요약 타일</summary>

![모바일 레이아웃](../images/overview-card-mobile-ko.jpg)

![어두운 테마](../images/overview-card-dark-ko.jpg)

![모든 항목이 정상일 때](../images/overview-card-clear-ko.jpg)

![요약 타일](../images/overview-tiles-ko.jpg)

![일부 기기가 응답하지 않는 요약 타일](../images/overview-tiles-offline-ko.jpg)

</details>

## 기본 설정

```yaml
type: custom:compact-overview-card
name: 우리집 요약
alerts:
  - entity: binary_sensor.kitchen_leak
    name: 누수 · 주방
    when: { state: "on" }
    level: critical
sections:
  - name: 조명
    icon: mdi:lightbulb-group
    navigation_path: /lovelace/rooms
    summary:
      type: count
      entities: [light.living_room, light.bedroom]
    items:
      - { entity: light.living_room, name: 거실, tap_action: { action: toggle } }
      - { entity: light.bedroom, name: 침실, tap_action: { action: toggle } }
```

전체 구성은 [showcase.yaml](../examples/showcase.yaml)과 [쇼케이스 가이드](showcase.md)를 참고하세요. 섹션은 Compact Cards의 `compact-home-panel`(`compact-cards.js`)을 사용하므로 그 리소스도 등록해야 합니다.

## 섹션

| 옵션 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `name` | 예 | — | 섹션 제목. `navigation_path`가 있으면 제목이 이동 버튼 |
| `items` | 예 | — | `compact-home-panel` 항목을 [해당 카드](https://github.com/eigger/hass-compact-cards/blob/main/docs/compact-home-panel.md)와 동일하게 지정(토글, 센서, `type: climate`/`light`/`cover`/`media`, 비교, 이동) |
| `icon` | 아니요 | `mdi:circle-outline` | 제목 아이콘 |
| `navigation_path` | 아니요 | 없음 | `/`로 시작하는 로컬 경로 |
| `columns` | 아니요 | `auto` | 조작 행의 열 수 `auto`, `1`, `2` |
| `summary` | 아니요 | 없음 | `name` 없는 타일 사양. 헤더 오른쪽에 `3/8 켜짐`, `주의 · 48 µg/m³` 형태로 표시 |
| `badges` | 아니요 | 없음 | `[{entity, name}]`. 헤더의 센서 값. 누르면 상세 정보 |

`items`가 잘못되면 그 섹션 안에 `items 설정 오류`를 표시하고 다른 섹션은 그대로 동작합니다. `compact-cards.js`가 로드되지 않으면 안내 문구를 표시하고, 로드되는 즉시 행을 표시합니다. 섹션은 열을 따라 위에서 아래로 쌓입니다(Home Assistant 섹션 뷰와 같은 방식).

## 카드 옵션

| 옵션 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `type` | 예 | — | `custom:compact-overview-card` |
| `sections` | 예* | — | 그룹 목록. 기본은 섹션 하나가 대시보드 탭 하나를 요약하고 제목이 그 탭으로 이동하며, 방 단위로 묶어도 됩니다 |
| `tiles` | 예* | — | 조작 없는 요약 타일 목록. `*` `sections`와 `tiles` 중 하나 이상 필요 |
| `name` | 아니요 | 없음 | 카드 제목 |
| `columns` | 아니요 | `auto` | 타일 열 수 `auto`, `2`, `3`, `4`. `auto`는 카드 너비 421px부터 3열, 700px부터 4열 |
| `section_columns` | 아니요 | `auto` | 섹션 열 수 `auto`, `1`, `2`, `3`. `auto`는 640px부터 2열, 960px부터 3열 |
| `alerts` | 아니요 | 없음 | 조건이 맞을 때만 표시하는 알림 목록 |

## 요약 타일 유형 (`tiles`와 섹션의 `summary`)

| `type` | 필수 | 선택 | 표시 |
| --- | --- | --- | --- |
| `count` | `entities` | | `켜진 수/확인 가능한 수`. `on` 상태만 켜짐으로 셉니다 |
| `climate` | `entities` | `value_entity` | `N대 가동`, 켜져 있지만 쉬는 중이면 `대기`, 모두 꺼지면 `꺼짐`, 대표 값 한 줄 |
| `status` | `items[]` | `idle_text` | 동작 중인 항목과 남은 시간. 동작 중인 항목이 없으면 `idle_text`(기본 `모두 대기`) |
| `value` | `entity` | `secondary_entity`, `thresholds` | 값과 단위, 임계값 수준 |
| `health` | `items[]` | | 가장 나쁜 수준의 건수와 낮은 수준 건수. 문제가 없으면 `이상 없음` |

공통 옵션은 `name`(필수), `icon`, `navigation_path`입니다. `navigation_path`는 `/`로 시작하는 로컬 경로만 허용합니다. 경로가 없으면 동작 중이거나 최악 수준인 엔티티의 상세 정보를 엽니다.

`status.items[]`는 `entity`(필수), `name`, `active`(기본 `[running]`), `remaining`(남은 시간 엔티티)을 가집니다. `health.items[]`는 `entity`(필수)와 `problem`(`{state}` 또는 `{state_not}`) 또는 `thresholds` 중 하나 이상이 필요하며, `level`(기본 `critical`)은 `problem`에만 적용됩니다.

## 알림

`alerts[]`는 `entity`와 `when`(`{state}` 또는 `{state_not}`)이 필요하고, `name`, `level`(`warning` 기본, `critical`), `navigation_path`를 지정할 수 있습니다. 조건이 맞는 알림만 위험 순으로 표시하고, 하나도 없으면 높이를 차지하지 않습니다. 제목 옆 배지는 `✓ 이상 없음`, `N건 확인 필요`, `N개 확인 불가`를 알려 줍니다.

## 임계값

`thresholds[]`는 `value`(숫자), `direction`(`above` 또는 `below`), `level`(`warning` 또는 `critical`)을 가지며 포함 비교입니다. `above 35`는 35 이상, `below 20`은 20 이하입니다. 숫자가 아닌 값은 무시하고, 동시에 맞으면 `critical`이 우선합니다. 카드는 정상·위험 기준을 추측하지 않으므로 직접 지정한 규칙만 적용합니다.

## 상태 표시와 접근성

- 수준은 색상, `주의 ·`/`위험 ·` 문구, 아이콘 변화로 함께 전달합니다.
- `unavailable`/`unknown` 엔티티는 정상으로 보지 않고 `N개 확인 불가`로 따로 표시합니다. 모두 확인할 수 없으면 `—`와 `확인 불가`를 표시합니다.
- 타일은 하나의 버튼이며 전체 요약을 `aria-label`과 툴팁으로 제공합니다. 알림 영역은 `aria-live`로 변화를 알립니다.
- 타일 순서는 설정 순서를 유지하고 상태에 따라 재배치하지 않습니다.
- 카드 자체는 서비스를 호출하지 않습니다. 섹션의 조작은 설정한 `compact-home-panel` 행이 수행합니다.
- YAML 모드 대시보드에서 따옴표 없는 `on`/`off`는 불리언으로 읽힙니다. 카드가 `on`/`off`로 되돌려 비교하지만 따옴표를 권장합니다.

## English

![Overview card with items that need attention](../images/overview-card.jpg)

The overview card keeps the familiar overview layout (one section per dashboard tab, each a title plus controls) and adds a **one-line summary in each section header** and **alerts that need attention** on top. Rows inside a section are `compact-home-panel` rows, so they can be operated directly. For a controls-free grid use `tiles`. The images use mocked states.

Sections (`sections[]`: `name`, `items`, optional `icon`, `navigation_path`, `columns`, `summary`, `badges`) embed `compact-home-panel` and need the Compact Cards resource; `section_columns` (`auto`, `1`, `2`, `3`) flows sections down columns. Options: `sections` and/or `tiles` (at least one), `name`, `columns` (`auto`, `2`, `3`, `4`; `auto` switches to 3 columns from 421px and 4 from 700px) and `alerts`. Tile types: `count` (`on / available`), `climate` (`N running`, standby, off), `status` (running items with remaining time, otherwise `idle_text`), `value` (reading with thresholds) and `health` (worst level count, otherwise "no issues"). `navigation_path` accepts local paths starting with `/` only; without one, tapping opens the entity that explains the summary.

Alerts need `entity` and `when` (`{state}` or `{state_not}`) and appear only while they match, most severe first; with none, the alert area takes no height. Thresholds are inclusive and `critical` wins when both match. The card never guesses what is normal, shows unavailable entities separately instead of treating them as healthy, keeps tile order fixed, and never calls services.
