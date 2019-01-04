# [0.8.0](https://repository.intershop.de/releases/com/intershop/public/source/intershop-pwa/0.8.0/) (2018-12-20)

**required Intershop Commerce Management version: 7.10.5.2**

### Code Refactoring

* module refactoring (ISREST-505)

### Features

* Angular 7 upgrade
* update to node.js 10 LTS and npm 6.4.1
* custom schematics for new module structure (ISREST-255)
* use cypress instead of protractor for end-to-end testing
* migration to new REST API for basket - part I (ISREST-344)
* use new basket REST API for item handling (ISREST-344)
* use default category from product in breadcrumb if no category context is given (ISREST-207)
* add Product Label functionality (ISREST-522)
* change and create address during checkout (ISREST-463)
* address listing in My Account (ISREST-484)

### Bug Fixes

* URL for images delivered by an image server are not composed correctly (ISREST-524)
* add locale information to all REST requests methods (POST, PUT, PATCH, DELETE was missing) - (ISREST-533)
* undefined checks in filternavigation mapper

### Performance Improvements

* optimization for ng2-validation tree shaking
* initialize icon module only once in core module
* use treeshakeable lodash-es instead of lodash

### BREAKING CHANGES

* Folder structure changed due to module refactoring.


# [0.7.10](https://repository.intershop.de/releases/com/intershop/public/source/intershop-pwa/0.7.10/) (2018-09-10)

First public release of the Intershop Progressive Web App

**required Intershop Commerce Management version: 7.10.2.4**


# 0.6.0 (2018-09-08)

### Features

* CMS integration - conditional rendering (ISREST-213) - EXPERIMENTAL
* sticky header - header styling and behavior changes (ISREST-435) - EXPERIMENTAL


# 0.5.0 (2018-09-07)

### Features

* preparation for content page handling (ISREST-460)
* rebranding - color scheme, logo, effects (ISREST-481)
* add Order Details functionality (ISREST-430)
* instant quantity changes for line item list (basket/quote request) (ISREST-314)
* add Order List functionality (ISREST-426)

### Bug Fixes

* add home screen icons for Apple iOS devices
* repaired route definition for product routes (ISREST-459)
* remove btoa and atob as they are not available in universal mode (ISREST-445)

### Documentation

* add changelog generation with conventional-changelog
* add license information and 3rd-party-licenses overview


# 0.4.0 (2018-08-22)

### Features

* migration to Bootstrap 4
* migration from Less to Sass
* replace ngx-bootstrap with ng-bootstrap
* add Endless Scrolling for Family Pages including SEO adaptions

### Bug Fixes

* repair state transfer to work with ngrx state management
* improve mobile menu handling


# [0.3.0](https://repository.intershop.de//releases/com/intershop/public/source/intershop-pwa/0.3.0/) (2018-08-08)

### Features

* add Quoting support (enable via feature toggle, disabled by default, works only agains B2B applications)
* introduce Endless Scrolling (for search results)
* add Filter Navigation
* new Homepage dummy teaser content
* complete happy path Checkout steps
* update Angular to 6.1.0 (+ update of other dependencies)
* introduce manually managed change log


# [0.2.0](https://repository.intershop.de//releases/com/intershop/public/source/intershop-pwa/0.2.0/) (2018-07-11)

### Features

* add checkout blueprint pages

### Bug Fixes

* improve IE 11 compatibility


# [0.1.1](https://repository.intershop.de//releases/com/intershop/public/source/intershop-pwa/0.1.1/) (2018-06-05)

First public beta release of the Intershop Progressive Web App (intershop-pwa).


# 0.1.0 (2018-05-31)

Initial internal beta release of the Intershop Progressive Web App.