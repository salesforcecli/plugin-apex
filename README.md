# Salesforce Apex Plugin

![npm (scoped)](https://img.shields.io/npm/v/@salesforce/plugin-apex)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Introduction

This is an oclif plugin that supports the Salesforce Apex commands.

### Building the Plugin

Clone the project and `cd` into it:

```
$ git clone git@github.com:salesforcecli/plugin-apex.git
$ cd plugin-apex
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
$ NODE_OPTIONS=--inspect-brk bin/dev force:apex:log:list -u myOrg@example.com
```

<br />

### Running the Test Suite

Test the test suite locally by building the project first and then running the tests.

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

Alternatively, replace `sfdx` with `NODE_OPTIONS=--inspect-brk bin/dev` and run your command:

```
$ NODE_OPTIONS=--inspect-brk bin/dev force:apex:log:list -u myOrg@example.com
```

2. Set some breakpoints in your code.
3. Click on the Debug icon in the Activity Bar to open up the Debugger view.
4. In the upper left hand corner, set the launch configuration to `Attach to Remote`.
5. Click the green play button on the left of the debugger view. The debugger should now be suspended on the first line of the program.
6. Click the green play button in the mini toolbar to continue running the program.
   <br /><br />
   <img src="./.images/vscodeScreenshot.png" width="480" height="278">

<br />
Happy debugging!

<br /><br />

# Commands

<!-- commands -->

- [`sf apex get log`](#sf-apex-get-log)
- [`sf apex get test`](#sf-apex-get-test)
- [`sf apex list log`](#sf-apex-list-log)
- [`sf apex run`](#sf-apex-run)
- [`sf apex run test`](#sf-apex-run-test)
- [`sf apex tail log`](#sf-apex-tail-log)

## `sf apex get log`

Fetch the specified log or given number of most recent logs from the org.

```
USAGE
  $ sf apex get log -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-i <value>] [-n <value>]
    [-d <value>]

FLAGS
  -d, --output-dir=<value>   Directory for saving the log files.
  -i, --log-id=<value>       ID of the specific log to display.
  -n, --number=<value>       Number of the most recent logs to display.
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Fetch the specified log or given number of most recent logs from the org.

  To get the IDs for your debug logs, run "sf apex log list". Executing this command without flags returns the most
  recent log.

ALIASES
  $ sf force apex log get

EXAMPLES
  Fetch the log in your default org using an ID:

    $ sf apex get log --log-id <log id>

  Fetch the log in the org with the specified username using an ID:

    $ sf apex get log --log-id <log id> --target-org me@my.org

  Fetch the two most recent logs in your default org:

    $ sf apex get log --number 2

  Similar to previous example, but save the two log files in the specified directory:

    $ sf apex get log --output-dir /Users/sfdxUser/logs --number 2

FLAG DESCRIPTIONS
  -d, --output-dir=<value>  Directory for saving the log files.

    The location can be an absolute path or relative to the current working directory. The default is the current
    directory.
```

_See code: [src/commands/apex/get/log.ts](https://github.com/salesforcecli/plugin-apex/blob/3.6.19/src/commands/apex/get/log.ts)_

## `sf apex get test`

Display test results for a specific asynchronous test run.

```
USAGE
  $ sf apex get test -o <value> -i <value> [--json] [--flags-dir <value>] [--api-version <value>]
    [--detailed-coverage -c] [-d <value>] [-r human|tap|junit|json] [--concise]

FLAGS
  -c, --code-coverage           Retrieve code coverage results.
  -d, --output-dir=<value>      Directory in which to store test result files.
  -i, --test-run-id=<value>     (required) ID of the test run.
  -o, --target-org=<value>      (required) Username or alias of the target org. Not required if the `target-org`
                                configuration variable is already set.
  -r, --result-format=<option>  [default: human] Format of the test results.
                                <options: human|tap|junit|json>
      --api-version=<value>     Override the api version used for api requests made by this command
      --concise                 Display only failed test results; works with human-readable output only.
      --detailed-coverage       Display detailed code coverage per test.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Display test results for a specific asynchronous test run.

  Provide a test run ID to display test results for an enqueued or completed asynchronous test run. The test run ID is
  displayed after running the "sf apex test run" command.

  To see code coverage results, use the --code-coverage flag with --result-format. The output displays a high-level
  summary of the test run and the code coverage values for classes in your org. If you specify human-readable result
  format, use the --detailed-coverage flag to see detailed coverage results for each test method run.

ALIASES
  $ sf force apex test report

EXAMPLES
  Display test results for your default org using a test run ID:

    $ sf apex get test --test-run-id <test run id>

  Similar to previous example, but output the result in JUnit format:

    $ sf apex get test --test-run-id <test run id> --result-format junit

  Also retrieve code coverage results and output in JSON format:

    $ sf apex get test --test-run-id <test run id> --code-coverage --json

  Specify a directory in which to save the test results from the org with the specified username (rather than your
  default org):

    $ sf apex get test --test-run-id <test run id> --code-coverage --output-dir <path to outputdir> --target-org \
      me@myorg'
```

_See code: [src/commands/apex/get/test.ts](https://github.com/salesforcecli/plugin-apex/blob/3.6.19/src/commands/apex/get/test.ts)_

## `sf apex list log`

Display a list of IDs and general information about debug logs.

```
USAGE
  $ sf apex list log -o <value> [--json] [--flags-dir <value>] [--api-version <value>]

FLAGS
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Display a list of IDs and general information about debug logs.

  Run this command in a project to list the IDs and general information for all debug logs in your default org.

  To fetch a specific log from your org, obtain the ID from this command's output, then run the “sf apex log get”
  command.

ALIASES
  $ sf force apex log list

EXAMPLES
  List the IDs and information about the debug logs in your default org:

    $ sf apex list log

  Similar to previous example, but use the org with the specified username:

    $ sf apex list log --target-org me@my.org
```

_See code: [src/commands/apex/list/log.ts](https://github.com/salesforcecli/plugin-apex/blob/3.6.19/src/commands/apex/list/log.ts)_

## `sf apex run`

Execute anonymous Apex code entered on the command line or from a local file.

```
USAGE
  $ sf apex run -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-f <value>]

FLAGS
  -f, --file=<value>         Path to a local file that contains Apex code.
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Execute anonymous Apex code entered on the command line or from a local file.

  If you don’t run this command from within a Salesforce DX project, you must specify the —-target-org flag.

  To execute your code interactively, run this command with no flags. At the prompt, enter all your Apex code; press
  CTRL-D when you're finished. Your code is then executed in a single execute anonymous request.
  For more information, see "Anonymous Blocks" in the Apex Developer Guide.

ALIASES
  $ sf force apex execute

EXAMPLES
  Execute the Apex code that's in the ~/test.apex file in the org with the specified username:

    $ sf apex run --target-org testusername@salesforce.org --file ~/test.apex

  Similar to previous example, but execute the code in your default org:

    $ sf apex run --file ~/test.apex

  Run the command with no flags to start interactive mode; the code will execute in your default org when you exit. At
  the prompt, start type Apex code and press the Enter key after each line. Press CTRL+D when finished.

    $ sf apex run
```

_See code: [src/commands/apex/run.ts](https://github.com/salesforcecli/plugin-apex/blob/3.6.19/src/commands/apex/run.ts)_

## `sf apex run test`

Invoke Apex tests in an org.

```
USAGE
  $ sf apex run test -o <value> [--json] [--flags-dir <value>] [--api-version <value>] [-d <value>] [-l
    RunLocalTests|RunAllTestsInOrg|RunSpecifiedTests] [-n <value>... | -s <value>... | -t <value>...] [-r
    human|tap|junit|json] [-w <value>] [-y] [-v -c] [--concise]

FLAGS
  -c, --code-coverage           Retrieve code coverage results.
  -d, --output-dir=<value>      Directory in which to store test run files.
  -l, --test-level=<option>     Level of tests to run; default is RunLocalTests.
                                <options: RunLocalTests|RunAllTestsInOrg|RunSpecifiedTests>
  -n, --class-names=<value>...  Apex test class names to run; default is all classes.
  -o, --target-org=<value>      (required) Username or alias of the target org. Not required if the `target-org`
                                configuration variable is already set.
  -r, --result-format=<option>  [default: human] Format of the test results.
                                <options: human|tap|junit|json>
  -s, --suite-names=<value>...  Apex test suite names to run.
  -t, --tests=<value>...        Apex test class names or IDs and, if applicable, test methods to run; default is all
                                tests.
  -v, --detailed-coverage       Display detailed code coverage per test.
  -w, --wait=<value>            Sets the streaming client socket timeout in minutes; specify a longer wait time if
                                timeouts occur frequently.
  -y, --synchronous             Runs test methods from a single Apex class synchronously; if not specified, tests are
                                run asynchronously.
      --api-version=<value>     Override the api version used for api requests made by this command
      --concise                 Display only failed test results; works with human-readable output only.

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.
  --json               Format output as json.

DESCRIPTION
  Invoke Apex tests in an org.

  Specify which tests to run by using the --class-names, --suite-names, or --tests flags. Alternatively, use the
  --test-level flag to run all the tests in your org, local tests, or specified tests.

  To see code coverage results, use the --code-coverage flag with --result-format. The output displays a high-level
  summary of the test run and the code coverage values for classes in your org. If you specify human-readable result
  format, use the --detailed-coverage flag to see detailed coverage results for each test method run.

  By default, Apex tests run asynchronously and immediately return a test run ID. You can use the --wait flag to specify
  the number of minutes to wait; if the tests finish in that timeframe, the command displays the results. If the tests
  haven't finished by the end of the wait time, the command displays a test run ID. Use the "sf apex get test
  --test-run-id" command to get the results.

  You must have the "View All Data" system permission to use this command. The permission is disabled by default and can
  be enabled only by a system administrator.

  NOTE: The testRunCoverage value (JSON and JUnit result formats) is a percentage of the covered lines and total lines
  from all the Apex classes evaluated by the tests in this run.

ALIASES
  $ sf force apex test run

EXAMPLES
  Run all Apex tests and suites in your default org:

    $ sf apex run test

  Run the specified Apex test classes in your default org and display results in human-readable form:

    $ sf apex run test --class-names MyClassTest --class-names MyOtherClassTest --result-format human

  Run the specified Apex test suites in your default org and include code coverage results and additional details:

    $ sf apex run test --suite-names MySuite --suite-names MyOtherSuite --code-coverage --detailed-coverage

  Run the specified Apex tests in your default org and display results in human-readable output:

    $ sf apex run test --tests MyClassTest.testCoolFeature --tests MyClassTest.testAwesomeFeature --tests \
      AnotherClassTest --tests namespace.TheirClassTest.testThis --result-format human

  Run all tests in the org with the specified username with the specified test level; save the output to the specified
  directory:

    $ sf apex run test --test-level RunLocalTests --output-dir <path to outputdir> --target-org me@my.org

  Run all tests in the org asynchronously:

    $ sf apex run test --target-org myscratch

  Run all tests synchronously; the command waits to display the test results until all tests finish:

    $ sf apex run test --synchronous

  Run specific tests using the --test-level flag:

    $ sf apex run test --test-level RunLocalTests

  Run Apex tests on all the methods in the specified class; output results in Test Anything Protocol (TAP) format and
  request code coverage results:

    $ sf apex run test --class-names TestA --class-names TestB --result-format tap --code-coverage

  Run Apex tests on methods specified using the standard Class.method notation; if you specify a test class without a
  method, the command runs all methods in the class:

    $ sf apex run test --tests TestA.excitingMethod --tests TestA.boringMethod --tests TestB

  Run Apex tests on methods specified using the standard Class.method notation with a namespace:

    $ sf apex run test --tests ns.TestA.excitingMethod --tests ns.TestA.boringMethod --tests ns.TestB

FLAG DESCRIPTIONS
  -l, --test-level=RunLocalTests|RunAllTestsInOrg|RunSpecifiedTests  Level of tests to run; default is RunLocalTests.

    Here's what the levels mean:

    - RunSpecifiedTests — Only the tests that you specify in the runTests option are run. Code coverage requirements
    differ from the default coverage requirements when using this test level. The executed tests must cover each class
    and trigger in the deployment package for a minimum of 75% code coverage. This coverage is computed for each class
    and triggers individually, and is different than the overall coverage percentage.
    - RunLocalTests — All local tests in your org, including tests that originate from no-namespaced unlocked packages,
    are run. The tests that originate from installed managed packages and namespaced unlocked packages aren't run. This
    test level is the default for production deployments that include Apex classes or triggers.
    - RunAllTestsInOrg — All tests are run. The tests include all tests in your org.

  -n, --class-names=<value>...  Apex test class names to run; default is all classes.

    If you select --class-names, you can't specify --suite-names or --tests.
    For multiple classes, repeat the flag for each.
    --class-names Class1 --class-names Class2

  -s, --suite-names=<value>...  Apex test suite names to run.

    If you select --suite-names, you can't specify --class-names or --tests.
    For multiple suites, repeat the flag for each.
    --suite-names Suite1 --suite-names Suite2

  -t, --tests=<value>...  Apex test class names or IDs and, if applicable, test methods to run; default is all tests.

    If you specify --tests, you can't specify --class-names or --suite-names
    For multiple tests, repeat the flag for each.
    --tests Test1 --tests Test2
```

_See code: [src/commands/apex/run/test.ts](https://github.com/salesforcecli/plugin-apex/blob/3.6.19/src/commands/apex/run/test.ts)_

## `sf apex tail log`

Activate debug logging and display logs in the terminal.

```
USAGE
  $ sf apex tail log -o <value> [--flags-dir <value>] [--api-version <value>] [-c] [-d <value> | -s]

FLAGS
  -c, --color                Apply default colors to noteworthy log lines.
  -d, --debug-level=<value>  Debug level to set on the DEVELOPER_LOG trace flag for your user.
  -o, --target-org=<value>   (required) Username or alias of the target org. Not required if the `target-org`
                             configuration variable is already set.
  -s, --skip-trace-flag      Skip trace flag setup. Assumes that a trace flag and debug level are fully set up.
      --api-version=<value>  Override the api version used for api requests made by this command

GLOBAL FLAGS
  --flags-dir=<value>  Import flag values from a directory.

DESCRIPTION
  Activate debug logging and display logs in the terminal.

  You can also pipe the logs to a file.

ALIASES
  $ sf force apex log tail

EXAMPLES
  Activate debug logging:

    $ sf apex tail log

  Specify a debug level:

    $ sf apex tail log --debug-level MyDebugLevel

  Skip the trace flag setup and apply default colors:

    $ sf apex tail log --color --skip-trace-flag
```

_See code: [src/commands/apex/tail/log.ts](https://github.com/salesforcecli/plugin-apex/blob/3.6.19/src/commands/apex/tail/log.ts)_

<!-- commandsstop -->
