# Salesforce Apex Plugin

[![CircleCI](https://circleci.com/gh/forcedotcom/salesforcedx-apex.svg?style=svg&circle-token=5869ea795e44e1b737f2f2a86fd51cdc2ac08629)](https://circleci.com/gh/forcedotcom/salesforcedx-apex)
![npm (scoped)](https://img.shields.io/npm/v/@salesforce/plugin-apex)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Introduction
This is an oclif plugin that supports the Salesforce Apex commands. The plugin is bundled with the [salesforcedx plugin](https://www.npmjs.com/package/salesforcedx).

Note: This plugin is in beta and has been released early so we can collect feedback. It may contain bugs, undergo major changes, or be discontinued.


### Building the Plugin

Clone the project and `cd` into it:

```
$ git clone git@github.com:forcedotcom/salesforcedx-apex.git
$ cd salesforcedx-apex
```

Ensure you have [Yarn](https://yarnpkg.com/) installed, then run:

```
$ yarn install
$ yarn build
```
<br />

### Linking the Plugin
Link the plugin from the `plugin-apex` package directory and then run your command:

```
$ sfdx plugins:link .
$ sfdx force:apex:log:list -u myOrg@example.com
```

Alternatively, you can also run the command from the `plugin-apex` package directory without linking the plugin:

```
$ NODE_OPTIONS=--inspect-brk bin/run force:apex:log:list -u myOrg@example.com
```
<br />
### Running the Test Suite

Run the test suite locally by building the project first and then running the tests.

```
$ yarn build
$ yarn test
```

<br />

### Debugging the Plugin

We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands. To debug a command:

1. If you linked your plugin to the Salesforce CLI using `yarn plugin:link`, call your command with the `dev-suspend` switch:

```
$ sfdx force:apex:log:list -u myOrg@example.com --dev-suspend
```

Alternatively, replace `sfdx` with `NODE_OPTIONS=--inspect-brk bin/run` and run your command:

```
$ NODE_OPTIONS=--inspect-brk bin/run force:apex:log:list -u myOrg@example.com
```

2. Set some breakpoints in your code.
3. Click on the Debug icon in the Activity Bar to open up the Debugger view.
4. In the upper left hand corner, set the launch configuration to `Attach to Remote`.
5. Click the green play button on the left of the debugger view. The debugger should now be suspended on the first line of the program.
6. Click the green play button in the mini toolbar to continue running the program. 
<br /><br />
<img src="../../.images/vscodeScreenshot.png" width="480" height="278">

<br />
Happy debugging!

<br /><br />
# Commands
<!-- commands -->
The available commands in the Apex plugin:
<br /><br />

### `sfdx force:apex:log:get`
fetch debug logs
```
USAGE
  $ sfdx force:apex:log:get [-i <id>] [-n <number>] [-d <string>] [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -d, --outputdir=outputdir
      directory for saving the log files

  -i, --logid=logid
      id of the log to display

  -n, --number=number
      number of most recent logs to display

  -u, --targetusername=targetusername
      username or alias for the target org; overrides default target org

  --apiversion=apiversion
      override the api version used for api requests made by this command

  --json
      format output as JSON

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] logging level for this command invocation

DESCRIPTION
  Fetches the specified log or given number of most recent logs from the scratch 
  org. 
  To get the IDs for your debug logs, run "sfdx force:apex:log:list". 
  Use the --logid parameter to return a specific log. 
  Use the --number parameter to return the specified number of recent logs.
  Use the --outputdir parameter to specify the directory to store the logs in.
  Executing this command without parameters returns the most recent log.

EXAMPLES
  $ sfdx force:apex:log:get -i <log id>
  $ sfdx force:apex:log:get -i <log id> -u me@my.org
  $ sfdx force:apex:log:get -n 2 -c
  $ sfdx force:apex:log:get -d Users/Desktop/logs -n 2
```
*See code: [force/apex/log/get.ts](https://github.com/forcedotcom/salesforcedx-apex/blob/develop/packages/plugin-apex/src/commands/force/apex/log/get.ts)*
<br /><br />

### `sfdx force:apex:log:list`
display a list of IDs and general information about debug logs
```
USAGE
  $ sfdx force:apex:log:list [-u <string>] [--apiversion <string>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -u, --targetusername=targetusername
      username or alias for the target org; overrides default target org

  --apiversion=apiversion
      override the api version used for api requests made by this command

  --json
      format output as JSON

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] logging level for this command invocation

DESCRIPTION
  Run this command in a project to list the IDs and general information for all debug logs 
  in your default org.
  To fetch a specific log from your org, obtain the ID from this command's output, then run 
  the “sfdx force:apex:log:get” command.

EXAMPLES
  $ sfdx force:apex:log:list
  $ sfdx force:apex:log:list -u me@my.org
```
*See code: [force/apex/log/list.ts](https://github.com/forcedotcom/salesforcedx-apex/blob/develop/packages/plugin-apex/src/commands/force/apex/log/list.ts)*
<br /><br />

### `sfdx force:apex:log:tail`
ensures logging is active and returns the logs to the running user

```
USAGE
  $ sfdx force:apex:log:list [-u <string>] [--apiversion <string>] [--json] [--loglevel
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL] [-c] [-d <string>] [-s]

OPTIONS
  -u, --targetusername=targetusername
      username or alias for the target org; overrides default target org

  --apiversion=apiversion
      override the api version used for api requests made by this command

  --json
      format output as JSON

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] logging level for this command invocation

  -c, --color
      colorize noteworthy log lines

  -d, --debuglevel=debuglevel
      debug level for trace flag

  -s, --skiptraceflag
      skip trace flag setup

DESCRIPTION
  Activates debug logging and displays logs in the terminal. You can also pipe the logs to a file.
  To exit logging early, type Ctrl+C into the terminal.

EXAMPLES
  $ sfdx force:apex:log:tail
  $ sfdx force:apex:log:tail --debuglevel MyDebugLevel
  $ sfdx force:apex:log:tail -c -s
```
*See code: [force/apex/log/tail.ts](https://github.com/forcedotcom/salesforcedx-apex/blob/develop/packages/plugin-apex/src/commands/force/apex/log/tail.ts)*
<br /><br />

### `sfdx force:apex:execute`
executes anonymous Apex code
```
USAGE
  $ sfdx force:apex:execute [-f <filepath>] [-u <string>] [--apiversion <string>] [--json] 
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -f, --apexcodefile=apexcodefile
      path to a local file that contains Apex code

  -u, --targetusername=targetusername
      username or alias for the target org; overrides default target org

  --apiversion=apiversion
      override the api version used for api requests made by this command

  --json
      format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] logging level for this command invocation

DESCRIPTION
  Executes one or more lines of anonymous Apex code entered on the command line, or executes 
  the code in a local file.
  If you don’t run this command from within a Salesforce DX project, —-targetusername is 
  required.
  To execute your code interactively, run this command with no parameters. At the prompt, 
  enter all your Apex code; press CTRL-D when you're finished. Your code is then executed in 
  a single execute anonymous request.
  For more information, see "Anonymous Blocks" in the Apex Developer Guide.

EXAMPLES
  $ sfdx force:apex:execute -u testusername@salesforce.org -f ~/test.apex
  $ sfdx force:apex:execute -f ~/test.apex
  $ sfdx force:apex:execute 
  Start typing Apex code. Press the Enter key after each line, then press CTRL+D when 
  finished.
```
*See code: [force/apex/execute.ts](https://github.com/forcedotcom/salesforcedx-apex/blob/develop/packages/plugin-apex/src/commands/force/apex/execute.ts)*
<br /><br />

### `sfdx force:apex:test:run`
invoke Apex tests
```
USAGE
  $ sfdx force:apex:test:run [-d <string>] [-l RunLocalTests|RunAllTestsInOrg|RunSpecifiedTests] [-n <string>] [-r human|tap|junit|json] 
  [-s <string>] [-t <string>] [-w <string>] [-y] [-v -c] [-u <string>] [--apiversion <string>] [--verbose] [--json] 
  [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --codecoverage
      runs code coverage and retrieves results

  -d, --outputdir=outputdir
      directory to store test run files

  -l, --testlevel=(RunLocalTests|RunAllTestsInOrg|RunSpecifiedTests)
      specifies which tests to run, using one of these TestLevel enum values:
      RunSpecifiedTests—Only the tests that you specify are run.
      RunLocalTests—All tests in your org are run, except the ones that originate from 
      installed managed packages.
      RunAllTestsInOrg—All tests are in your org and in installed managed packages are run

  -n, --classnames=classnames
      comma-separated list of Apex test class names to run; if you select --classnames, you 
      can't specify --suitenames or --tests

  -r, --resultformat=(human|tap|junit|json)
      Permissible values are: human, tap, junit, json

  -s, --suitenames=suitenames
      comma-separated list of Apex test suite names to run; if you select --suitenames, you 
      can't specify --classnames or --tests

  -t, --tests=tests
      comma-separated list of Apex test class names or IDs and, if applicable, test methods to 
      run; if you specify --tests, you can't specify --classnames or --suitenames

  -u, --targetusername=targetusername
      username or alias for the target org; overrides default target org

  -v, --detailedcoverage
      display detailed code coverage per test

  -w, --wait=wait
      sets the streaming client socket timeout in minutes; specify a longer wait time if timeouts occur 
      frequently

  -y, --synchronous
      runs test methods from a single Apex class synchronously; if not specified, tests are 
      run ansynchronously

  --apiversion=apiversion
      override the api version used for api requests made by this command

  --json
      format output as JSON

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] [default: warn] logging level for this command invocation; logs are 
      stored in $HOME/.sfdx/sfdx.log

  --verbose
      display Apex test processing details; if JSON is specified, processing details aren't 
      displayed

DESCRIPTION
  Specify which tests to run by using the --classnames, --suites, or --tests parameters. 
  Alternatively, use the --testlevel parameter to run all the tests in your org, local 
  tests, or specified tests.
  To see code coverage results, use the --codecoverage parameter with --resultformat. The 
  output displays a high-level summary of the test run and the code coverage values for 
  classes in your org. If you specify human-readable result format, use the 
  --detailedcoverage parameter to see detailed coverage results for each test method run.
  If --codecoverage is not included, code coverage will be skipped during the test run.

  NOTE: The testRunCoverage value (JSON and JUnit result formats) is a percentage of the 
  covered lines and total lines from all the Apex classes evaluated by the tests in this 
  run.

EXAMPLES
  $ sfdx force:apex:test:run
  $ sfdx force:apex:test:run -n "MyClassTest,MyOtherClassTest" -r human
  $ sfdx force:apex:test:run -s "MySuite,MyOtherSuite" -c -v --json
  $ sfdx force:apex:test:run -t 
  "MyClassTest.testCoolFeature,MyClassTest.testAwesomeFeature,AnotherClassTest,namespace.TheirClassTest.testThis" -r human
  $ sfdx force:apex:test:run -l RunLocalTests -d <path to outputdir> -u me@my.org
```
*See code: [force/apex/test/run.ts](https://github.com/forcedotcom/salesforcedx-apex/blob/develop/packages/plugin-apex/src/commands/force/apex/test/run.ts)*
<br /><br />

### `sfdx force:apex:test:report`
display test results for a specific asynchronous test run
```
USAGE
  $ sfdx force:apex:test:report -i <string> [-c] [-d <string>] [-r human|tap|junit|json] [-w <string>]
  [-u <string>] [--apiversion <string>] [--verbose] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -c, --codecoverage
      retrieves code coverage results

  -d, --outputdir=outputdir
      directory to store test result files

  -i, --testrunid=testrunid
      (required) the ID of the test run

  -r, --resultformat=(human|tap|junit|json)
      Permissible values are: human, tap, junit, json

  -u, --targetusername=targetusername
      username or alias for the target org; overrides default target org

  -w, --wait=wait
      sets the streaming client socket timeout in minutes; specify a longer wait time if timeouts occur 
      frequently

  --apiversion=apiversion
      override the api version used for api requests made by this command

  --json
      format output as JSON

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] [default: warn] logging level for this command invocation; logs are 
      stored in $HOME/.sfdx/sfdx.log

  --verbose
      display Apex test processing details; if JSON is specified, processing details aren't 
      displayed

DESCRIPTION
  Provide a test run ID to display test results for an enqueued or completed asynchronous 
  test run. The test run ID is displayed after running the "sfdx force:apex:test:run" 
  command.

EXAMPLES
  $ sfdx force:apex:test:report -i <test run id>
  $ sfdx force:apex:test:report -i <test run id> -r junit
  $ sfdx force:apex:test:report -i <test run id> -c --json
  $ sfdx force:apex:test:report -i <test run id> -c -d <path to outputdir> -u me@myorg
```
*See code: [force/apex/test/report.ts](https://github.com/forcedotcom/salesforcedx-apex/blob/develop/packages/plugin-apex/src/commands/force/apex/test/report.ts)*
<!-- commandsstop -->