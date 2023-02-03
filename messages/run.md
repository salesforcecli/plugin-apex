# summary

Invoke Apex tests in an org.

# description

Specify which tests to run by using the --class-names, --suite-names, or --tests flags. Alternatively, use the --test-level flag to run all the tests in your org, local tests, or specified tests.
To see code coverage results, use the --code-coverage flag with --result-format. The output displays a high-level summary of the test run and the code coverage values for classes in your org. If you specify human-readable result format, use the --detailed-coverage flag to see detailed coverage results for each test method run.

NOTE: The testRunCoverage value (JSON and JUnit result formats) is a percentage of the covered lines and total lines from all the Apex classes evaluated by the tests in this run.

# examples

- sfdx apex:test:run
- sfdx apex:test:run -n "MyClassTest,MyOtherClassTest" -r human
- sfdx apex:test:run -s "MySuite,MyOtherSuite" -c -v --json
- sfdx apex:test:run -t "MyClassTest.testCoolFeature,MyClassTest.testAwesomeFeature,AnotherClassTest,namespace.TheirClassTest.testThis" -r human
- sfdx apex:test:run -l RunLocalTests -d <path to outputdir> -u me@my.org

# flags.result-format.summary

Format of the test results.

# flags.class-names.summary

Comma-separated list of Apex test class names to run.

# flags.class-names.description

If you select --class-names, you can't specify --suite-names or --tests.

# flags.suite-names.summary

Comma-separated list of Apex test suite names to run.

# flags.suite-names.description

If you select --suite-names, you can't specify --class-names or --tests.

# flags.tests.summary

Comma-separated list of Apex test class names or IDs and, if applicable, test methods to run.

# flags.tests.description

If you specify --tests, you can't specify --class-names or --suite-names

# flags.code-coverage.summary

Retrieve code coverage results.

# flags.output-dir.summary

Directory in which to store test run files.

# flags.test-level.summary

Level of tests to run.

# flags.test-level.description

Here's what the levels mean:

- RunSpecifiedTests—Only the tests that you specify are run.
- RunLocalTests—All tests in your org are run, except the ones that originate from installed managed packages.
- RunAllTestsInOrg—All tests are in your org and in installed managed packages are run

# flags.wait.summary

Sets the streaming client socket timeout in minutes; specify a longer wait time if timeouts occur frequently.

# flags.synchronous.summary

Runs test methods from a single Apex class synchronously; if not specified, tests are run ansynchronously.

# flags.detailed-coverage.summary

Display detailed code coverage per test.

# missingReporterErr

Select a result format when specifying code coverage

# runTestReportCommand

Run "sfdx apex:test:report -i %s -u %s" to retrieve test results

# classSuiteTestErr

Specify either classnames, suitenames, or tests

# syncClassErr

Synchronous test runs can include test methods from only one Apex class. Omit the --synchronous flag or include tests from only one class

# testLevelErr

When specifying classnames, suitenames, or tests, indicate RunSpecifiedTests as the testlevel

# testResultProcessErr

Encountered an error when processing test results
%s

# apexTestReportFormatHint

Run "sfdx apex:test:report %s --resultformat <format>" to retrieve test results in a different format.

# outputDirHint

Test result files written to %s

# apexLibErr

Unknown error in Apex Library: %s
