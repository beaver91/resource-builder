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
- `$ npm run vwatch`
  - SCSS와 CSS 파일 간의 무결성을 유지합니다.  
  SCSS 파일 변경없이 CSS가 단독으로 변경될 경우, SCSS를 다시 빌드합니다.  
    현재 이러한 무결성 손상은 git으로 풀을 받거나 머지를 하거나 직접 CSS 파일을 수정할때 발생합니다.(git에서 병합 과정에서 CSS 파일이 충돌이 날때 CSS 파일은 이미 compact, compressed되어 있어 라인 단위로 체크가 불가능한 상태입니다. 그리고 SCSS를 다시 빌드하면 되기 때문에 직접 수정하지 않고 보통 source와 remote 어느 한 쪽으로 덮어쓰게 되는데, 이후 SCSS를 다시 빌드하지 않으면 무결성이 손상됩니다.) 
  - 이 명령의 단점은 병합과 롤백이 watcher 입장에서는 동일한 파일 변경 프로세스이기 때문에 구분할 수 없다는 것이고 이 때문에 실제로 CSS 파일(원본이 SCSS인)만을 롤백을 위해서는 **2번 롤백**을 해야 합니다.  
  근본적으로 이 문제는 어떤 SCSS 파일들은 기존의 빌드 결과인 CSS와 불일치하다는 것인데 쿼터 종류, 핵스값의 대소문자 정도의 차이인 것으로 확인됩니다. SCSS 컴파일러가 중간에 변경된 것이 원인인 것 같습니다.  
    사실 이러한 무결성 손상은 빌드해서 다시 올리면 되기 때문에 시간이 지나면 자연스럽게 해결될 것입니다. 다만 지금은 자신이 작업하지 않은 파일들을 굳이 깃에 커밋하지 않으려고 하기 때문에 브랜치 체크아웃하는 과정에서 발생하는 그런 파일들은 롤백을 하고 있습니다.
- `$ npm run build [site] [site]...`
  - 지정한 사이트에 있는 MAIN SCSS와 Partial SCSS를 Import하는 모든 MAIN SCSS(타 사이트 포함) 파일을 모두 빌드합니다.
  - `site` 매개변수는 옵션이고 복수의 사이트를 입력하려면 공백으로 구분해서 전달합니다. 옵션이 없거나 `all`이면 모든 사이트를 대상으로 빌드합니다. ex) `$ npm run build`, `$ npm run build webzine lol`  
  `vwatch` 명령의 단점이 불편하거나 리소스 빌더를 켜기 전에 SCSS에 이미 변경사항이 발생한 경우 해당 SCSS 파일이 위치한 사이트만을 빌드할때 주로 사용합니다.
    
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

## CSS 버저닝 자동화 아이디어
css 무결성 검사를 위해 내부적으로 md5 체크섬 해시를 생성합니다. MAIN SCSS 파일이 위치한 사이트에 파일명-해시로 php 연관 배열을 저장하면 이것을 버저닝에 사용하는 것이 가능할 듯한데, 런타임에 영향이 있어서 일단 아이디어 상태입니다.
