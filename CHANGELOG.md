# 1.4.0 (2023-01-17)


### Bug Fixes

* `--json` flag should override `-r json` flag in `force:apex:test:run` and `force:apex:test:report` ([#177](https://github.com/salesforcecli/plugin-apex/issues/177)) ([#178](https://github.com/salesforcecli/plugin-apex/issues/178)) ([965e1c1](https://github.com/salesforcecli/plugin-apex/commit/965e1c11c016d5f5fd93f87d5ad1650481e14795))
* add caret to command and fix tests ([#292](https://github.com/salesforcecli/plugin-apex/issues/292)) ([e1640df](https://github.com/salesforcecli/plugin-apex/commit/e1640dff7cd935e4463b2f1eaae7fa8e1dea9ffe))
* add complete result info for getLogs ([#146](https://github.com/salesforcecli/plugin-apex/issues/146)) ([317b129](https://github.com/salesforcecli/plugin-apex/commit/317b129c41d0cc36a40568b1984694f1f200ce43))
* apex code coverage flag ([#268](https://github.com/salesforcecli/plugin-apex/issues/268)) ([226f1af](https://github.com/salesforcecli/plugin-apex/commit/226f1afa29532122125ea3e13f2dcf6860f931fe))
* change how oclif manifest gets generated ([#88](https://github.com/salesforcecli/plugin-apex/issues/88)) ([310b2b3](https://github.com/salesforcecli/plugin-apex/commit/310b2b399acec99bdb6828d6171f480635028c3d))
* fix help text issues ([#163](https://github.com/salesforcecli/plugin-apex/issues/163)) ([ceb1f6e](https://github.com/salesforcecli/plugin-apex/commit/ceb1f6e2ac610db63f936b57c2b806a111f20bae))
* format for test-result-codecoverage file ([#114](https://github.com/salesforcecli/plugin-apex/issues/114)) ([57ae62d](https://github.com/salesforcecli/plugin-apex/commit/57ae62d92df0f4591565bd8d795aff60332164f4))
* handle test method covering multiple classes ([#122](https://github.com/salesforcecli/plugin-apex/issues/122)) ([1102a25](https://github.com/salesforcecli/plugin-apex/commit/1102a25c2ddbb9ad770e9db8f7b5d367c22353ce))
* ignore apex:test:run when publishing ([#85](https://github.com/salesforcecli/plugin-apex/issues/85)) ([7f35aca](https://github.com/salesforcecli/plugin-apex/commit/7f35aca0774c729e69c5eb21d21c9a1f692169f5))
* junit testresult file generation ([#285](https://github.com/salesforcecli/plugin-apex/issues/285)) ([3cb4dd7](https://github.com/salesforcecli/plugin-apex/commit/3cb4dd7bf93f8c3aca8fe236a38a940c80f658e4))
* minor tweaks ([d042508](https://github.com/salesforcecli/plugin-apex/commit/d0425083df52902eb30b10276f68366a2b913be7))
* missing message to run test report command ([#94](https://github.com/salesforcecli/plugin-apex/issues/94)) ([3fc9839](https://github.com/salesforcecli/plugin-apex/commit/3fc9839faf5021dd886a9da214be6d31a7b673f5))
* move human-readable reporter to library ([#113](https://github.com/salesforcecli/plugin-apex/issues/113)) ([18127cf](https://github.com/salesforcecli/plugin-apex/commit/18127cfa11ebc6d4ceaa53c0f2188976d04111ca))
* perf issue while mapping coverage to source ([#287](https://github.com/salesforcecli/plugin-apex/issues/287)) ([f89359e](https://github.com/salesforcecli/plugin-apex/commit/f89359e7199a05d1a51b7d6a61b030aecde4369c))
* revert RunLocalTests sync bug fix ([#182](https://github.com/salesforcecli/plugin-apex/issues/182)) ([ce870ef](https://github.com/salesforcecli/plugin-apex/commit/ce870ef336440d0c447cd287cd0beeaa2d566206))
* set correct exit codes on failure ([#185](https://github.com/salesforcecli/plugin-apex/issues/185)) ([a49d999](https://github.com/salesforcecli/plugin-apex/commit/a49d999cef814a850118b1c9f9933ec3ebb55b71)), closes [forcedotcom/salesforcedx-vscode#3163](https://github.com/forcedotcom/salesforcedx-vscode/issues/3163)
* synchronous run error ([#277](https://github.com/salesforcecli/plugin-apex/issues/277)) ([4386f20](https://github.com/salesforcecli/plugin-apex/commit/4386f20df0bb39857a938e00da2f9f4ad7046cf7))
* use SfdxCommand to do org error handling ([#64](https://github.com/salesforcecli/plugin-apex/issues/64)) ([0694ee9](https://github.com/salesforcecli/plugin-apex/commit/0694ee930d8467067cd1fa5730ee7236445e0c37))


### Features

* add apex code coverage reporters ([#284](https://github.com/salesforcecli/plugin-apex/issues/284)) ([02c3584](https://github.com/salesforcecli/plugin-apex/commit/02c3584971cb40fdf979eea52d00390d042f8461))
* add force:apex:test:report command to the plugin ([#108](https://github.com/salesforcecli/plugin-apex/issues/108)) ([ac1634e](https://github.com/salesforcecli/plugin-apex/commit/ac1634effc638721e1c04570aa162179d9204e33))
* add force:test:run command (basic functionality) ([#62](https://github.com/salesforcecli/plugin-apex/issues/62)) ([b7624b5](https://github.com/salesforcecli/plugin-apex/commit/b7624b582a6100bd99aa1c53424fbdf3f7cd69a4))
* add JSON result to test:run command ([#101](https://github.com/salesforcecli/plugin-apex/issues/101)) ([417c047](https://github.com/salesforcecli/plugin-apex/commit/417c047fb1bc75ec2abb34b2b643f5f60501a02e))
* add junit result format to test:run command ([#96](https://github.com/salesforcecli/plugin-apex/issues/96)) ([c9f98f1](https://github.com/salesforcecli/plugin-apex/commit/c9f98f11a1a5de9f63d26e147ea8a4d8b393c8c8))
* add output directory functionality to library and plugin ([#106](https://github.com/salesforcecli/plugin-apex/issues/106)) ([83977f1](https://github.com/salesforcecli/plugin-apex/commit/83977f1290e9284ee19167ad3bf106241dbab806))
* add TAP reporter for Apex test results ([#91](https://github.com/salesforcecli/plugin-apex/issues/91)) ([5b7ecae](https://github.com/salesforcecli/plugin-apex/commit/5b7ecae94e3b6a8f88d0c46edbaca9d760e15541))
* add testRunCoverage and small fixes ([#100](https://github.com/salesforcecli/plugin-apex/issues/100)) ([19e1eec](https://github.com/salesforcecli/plugin-apex/commit/19e1eec2108d06238df251d5ef0f6b0899963ccc))
* bump apexnode and core ([7aa3f39](https://github.com/salesforcecli/plugin-apex/commit/7aa3f390b5df0540337278e6c90b1a0969b0d3b0))
* bump version of @salesforce/core ([#267](https://github.com/salesforcecli/plugin-apex/issues/267)) ([cb4aae8](https://github.com/salesforcecli/plugin-apex/commit/cb4aae8220dfd6da6681b7eccfa2ec89f266976d))
* bump version of core and faye ([#261](https://github.com/salesforcecli/plugin-apex/issues/261)) ([bd432bf](https://github.com/salesforcecli/plugin-apex/commit/bd432bfe2c1ae8585af0c2d2fe974dd6e41c981c))
* changes to subscribe to test runs ([#200](https://github.com/salesforcecli/plugin-apex/issues/200)) ([fa35ae2](https://github.com/salesforcecli/plugin-apex/commit/fa35ae257eef2a9f6fa0f00c8e7dffb4face8455)), closes [#198](https://github.com/salesforcecli/plugin-apex/issues/198)
* Check for query limits before getting apex test results ([#92](https://github.com/salesforcecli/plugin-apex/issues/92)) ([6786dbb](https://github.com/salesforcecli/plugin-apex/commit/6786dbb920ef138bc03e21226b625d4ae70d02a8))
* exit Apex test runs early  ([#215](https://github.com/salesforcecli/plugin-apex/issues/215)) ([e5be530](https://github.com/salesforcecli/plugin-apex/commit/e5be5308d749232f42f6e96536006ed65f99b3cc))
* handle namespaces when running tests ([#126](https://github.com/salesforcecli/plugin-apex/issues/126)) ([1108cca](https://github.com/salesforcecli/plugin-apex/commit/1108cca47003839677669e12cced2f4f5ebafd78))
* validate all flags and handle errors ([#84](https://github.com/salesforcecli/plugin-apex/issues/84)) ([9c6f293](https://github.com/salesforcecli/plugin-apex/commit/9c6f293b87d8ab08b3216112ee33f9647d6f0b9e))


### Reverts

* Revert "Update test.yml" ([c8dea22](https://github.com/salesforcecli/plugin-apex/commit/c8dea222b56a5d5ea64dbcc47baf06eb1a63a3bd))
* Revert "chore: remove the nuts tests" ([845f9dd](https://github.com/salesforcecli/plugin-apex/commit/845f9ddfdf8af9d05c0a18605e867d527ae3b176))
* Revert "update workflows to latest" ([ed5e80f](https://github.com/salesforcecli/plugin-apex/commit/ed5e80f77a84b547ec1c0ca6580e63e8e04bd700))
* Revert "add scripts" ([28080ab](https://github.com/salesforcecli/plugin-apex/commit/28080ab19303da046c62edb27b51d839e02eeebd))



