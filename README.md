# 🖥️ HERMES Display

노년층 친화적인 알림 디스플레이 UI  
React + TypeScript + Vite + Tailwind CSS 기반으로 개발되었습니다.

---

## 🚀 개발 현황

- 7인치(1024×600) 디스플레이 최적화
- 더미 알림 데이터 기반 **리스트 / 상세보기 UI** 구현
- 알림 삭제 시 **Modal + Toast 피드백** 제공
- 환경 설정: **방해금지 시간(Time Picker)**, **볼륨 조절(Slider)** 기능 완성
- 노년층 UX 고려: 큰 글씨, 직관적 버튼, 터치 기반 인터페이스

---

## ⚙️ 기술 스택

- **Frontend Framework**: React 18 + Vite
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **라우팅**: React Router DOM
- **알림 처리**: Modal + Toast UI
- **데이터 관리**: 더미 데이터(`dummyAlarms.ts`) 기반

---

## 📂 프로젝트 구조

```bash
src/
 ├─ data/
 │   └─ dummyAlarms.ts        # 알림 더미 데이터
 ├─ pages/
 │   ├─ MainPage.tsx          # 메인 화면 (최근 알림, 날씨, 환경설정/리스트 이동)
 │   ├─ AlarmListPage.tsx     # 알림 리스트
 │   ├─ AlarmDetailPage.tsx   # 알림 상세보기
 │   └─ SettingsPage.tsx      # 환경 설정
 ├─ App.tsx                   # 라우팅 설정
 └─ main.tsx                  # 엔트리 포인트

## 🖼️ 주요 기능 플로우

1. **MainPage**
   - 최근 알림 4개 표시
   - 날씨 / 로고 / 환경설정 / 알림 리스트 버튼

2. **AlarmListPage**
   - 전체 알림 확인
   - [다시 울리기] / [삭제] 버튼 제공
   - 알림 클릭 시 상세 페이지 이동

3. **AlarmDetailPage**
   - 알림 제목, 수신 시각, 유형 표시
   - 삭제 시 Modal 확인 → Toast 출력

4. **SettingsPage**
   - 방해금지 시간(Time Picker)
   - 볼륨 조절(Slider)

## 🔧 실행 방법

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프리뷰 실행
npm run preview

## 📌 추가 개발 목표

- **MQTT 브로커 연동** → 실시간 알림 표시
- **날씨 API 연동** → 실제 날씨 정보 반영
- **알림 필터링** → 앱/키워드 기반 필터링 기능
- **사용자 설정 저장** → LocalStorage / DB 기반 저장 및 복원
- **UX 강화** → 색각 이상자 대비 색상, 터치 영역 확대

```
