# Resource Builder 👁‍🗨

사이트에 SCSS를 적용시키기 위한 베이스 도구

## 설치 방법

1. 윈도우상에서 소스 루트 디렉토리로 이동합니다.
1. 해당 저장소의 소스를 `./.resources/` 디렉토리로 **clone** 실행합니다.
    - `$ git clone https://github.com/beaver91/resource-builder.git .resources`
    - 즉 다음과 같은 디렉토리 구성을 갖습니다.
1. 복사된 디렉토리로 이동하여 `$ npm install` 명령어를 실행합니다.
    - 예) `cd C:\\source\\.resources && npm install`

### 기본 지원 명령어

- `$ npm run watch`
    - 소스 루트 디렉토리의 파일 변경을 감지하여 SCSS 파일을 컴파일합니다.
    - 관습적으로 `site/lib/style/scss/dataninfo.scss` 파일은 `site/lib/style/dist/dataninfo.css` 디렉토리로 컴파일되어 출력됩니다.
    - `site/lib/style/base.scss` 와 같은 경우의 파일도 `site/lib/style/dist/base.css` 디렉토리로 컴파일됩니다.
    - `*.scss` 파일 삭제시 `dist/` 디렉토리의 컴파일된 css 파일과 map 파일을 찾아 삭제합니다.

#### Javascript Transpiler (업데이트 예정)

- `$ npm run js`

## 버전 히스토리

- **0.1.0** SCSS 파일 감시 기능 
