# HERMES_Android_App
사용자의 스마트폰 알림을 수집하고, 중요 정보를 선별하여
스마트 월패드로 전달하는 안드로이드 기반 IoT 연동 앱



[주요 기능]

알림 수집 – NotificationListenerService 기반으로 모든 앱의 알림을 수집

메시지 필터링 – “ㅋㅋ”, “ㅎㅇ”, “[광고]” 등 불필요한 문구 자동 제거

카테고리 분류 – 앱 패키지명을 기준으로 ‘메신저’, ‘은행’, ‘전화’, ‘알람’ 등으로 자동 분류

개인정보 마스킹 – 전화번호, 이메일, 계좌번호 등을 탐지 후 *** 처리

자동 연결 – 동일 Wi-Fi 네트워크 내의 MQTT 브로커를 자동 탐색

MQTT 통신 – Paho MQTT 기반의 안정적 실시간 데이터 전송

간편 UI – IP 직접 입력 또는 자동 탐색을 통한 손쉬운 연결


[전체 구조]
com.example.hermes
core
│   ├── NotificationRelayService.kt   # 알림 수집 및 MQTT 전송
│   └── MqttKeeperService.kt          # (확장용) MQTT 유지 서비스

├── net
│   ├── MqttClient.kt                 # MQTT 연결 관리 및 큐잉 전송
│   └── NetworkScanner.kt             # 동일 서브넷 내 브로커 탐색


├── ui
│   └── MainActivity.kt               # 연결 UI 및 상태 표시

└── util
├── Masking.kt                    # 개인정보 마스킹
├── MessageFilter.kt              # 중요도 필터링
├── CategoryClassifier.kt         # 앱 카테고리 분류
└── AppDictionary.kt              # 차단 목록 및 키워드 정의


전화번호, 이메일, 계좌번호 등은 자동 마스킹 처리

광고, 국외발신 등의 문구는 자동 필터링

중요도가 낮은 메시지는 MQTT로 전송하지 않음

점수 기반 판단:

        < 0.3 : 폐기
        
        0.3~0.6 : 보류
        
        > 0.6 : 즉시 전송

[기술 구성]

    언어	Kotlin
    빌드 도구	Gradle
    통신	MQTT
    SDK	minSdk 26 / targetSdk 34
