![image](https://git.inven.co.kr/INVEN/resource-builder/wikis/uploads/5d7ac4777cb5d77028a0cf5cbc91bc82/image.png)

# Resource Builder 👁‍🗨

인벤 KR 사이트에 SCSS를 적용시키기 위한 베이스 도구

## 설치 방법

1. 윈도우상에서 인벤KR 소스 루트 디렉토리로 이동합니다.
1. 해당 저장소의 소스를 `./.resources/` 디렉토리로 **clone** 실행합니다.
    - `$ git clone https://git.inven.co.kr/INVEN/resource-builder.git .resources`
    - 즉 다음과 같은 디렉토리 구성을 갖습니다.
        - ![image](https://git.inven.co.kr/INVEN/resource-builder/wikis/uploads/10db5c8366cff09943344c863028b854/image.png)
1. 복사된 디렉토리로 이동하여 `$ npm install` 명령어를 실행합니다.
    - 예) `cd C:\\www_inven\\.resources && npm install`

### 기본 지원 명령어

- `$ npm run watch`
    - 인벤KR 소스 루트 디렉토리의 파일 변경을 감지하여 SCSS 파일을 컴파일합니다.
    - 관습적으로 `maple/lib/style/scss/dataninfo.scss` 파일은 `maple/lib/style/dist/dataninfo.css` 디렉토리로 컴파일되어 출력됩니다.
    - `lol/lib/style/base.scss` 와 같은 경우의 파일도 `lol/lib/style/dist/base.css` 디렉토리로 컴파일됩니다.
    - `*.scss` 파일 삭제시 `dist/` 디렉토리의 컴파일된 css 파일과 map 파일을 찾아 삭제합니다.

#### 의존성 트리 업데이트
리소스 빌더 시작시 Partial SCSS(_로 시작하는 SCSS 파일)을 Import하는 타 SCSS 파일에 대한 트리를 저장합니다.  
이 트리 구조를 사용하여 Partial SCSS 변경시 MAIN SCSS(_로 시작하지 않는 SCSS 파일) 파일을 컴파일합니다.  
온전한 사용을 위해서 아래와 같은 주의사항이 필요합니다.  
__주의 사항 : Partial SCSS만을 Import해야 합니다. MAIN SCSS를 Import할 경우 의존성 트리를 탐색하지 않습니다.__

#### 절대경로 지원
  - ~/webzine/scss  
    ~/[사이트]/로 시작하는 경로는 ../webzine/lib/style/로 치환합니다.
    /lib/style/은 고정 경로이고 하위 경로만 지정할 수 있습니다.
    ex) ../../../../webzine/lib/style/common/basic과 ~/webzine/common/basic은 같습니다.
    
#### Javascript Transpiler (업데이트 예정)

- `$ npm run js`

## 버전 히스토리

- **0.1.0** SCSS 파일 감시 기능 

## 개선사항
1. 작업할때는 watch로 사용하고 서버에 반영을 하기 위해서는 compile을 수행하도록 watch와 complie 기능을 분리 
1. 브랜치 변경과 같은 대량 파일 변경/삭제 이벤트시 의존성 트리 무결성 유지와 불필요한 컴파일 생략
    - 브랜치 체크아웃 감지하여 의존성 트리 재구축, 컴파일 생략 후 일정 시간 이후 활성화
    - 짧은 시간에 기준치 이상의 파일 변경사항이 발생할 경우 벌크처리
1. 의존성 트리 구축 시간 단축을 위한 캐쉬
