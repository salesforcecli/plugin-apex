# longDescription

Specify which tests to run by using the --classnames, --suites, or --tests parameters. Alternatively, use the --testlevel parameter to run all the tests in your org, local tests, or specified tests.
To see code coverage results, use the --codecoverage parameter with --resultformat. The output displays a high-level summary of the test run and the code coverage values for classes in your org. If you specify human-readable result format, use the --detailedcoverage parameter to see detailed coverage results for each test method run.

NOTE: The testRunCoverage value (JSON and JUnit result formats) is a percentage of the covered lines and total lines from all the Apex classes evaluated by the tests in this run.

# summary

invoke Apex tests

Specify which tests to run by using the --classnames, --suites, or --tests parameters. Alternatively, use the --testlevel parameter to run all the tests in your org, local tests, or specified tests.
To see code coverage results, use the --codecoverage parameter with --resultformat. The output displays a high-level summary of the test run and the code coverage values for classes in your org. If you specify human-readable result format, use the --detailedcoverage parameter to see detailed coverage results for each test method run.

NOTE: The testRunCoverage value (JSON and JUnit result formats) is a percentage of the covered lines and total lines from all the Apex classes evaluated by the tests in this run.

# examples

- sfdx apex:test:run
- sfdx apex:test:run -n "MyClassTest,MyOtherClassTest" -r human
- sfdx apex:test:run -s "MySuite,MyOtherSuite" -c -v --json
- sfdx apex:test:run -t "MyClassTest.testCoolFeature,MyClassTest.testAwesomeFeature,AnotherClassTest,namespace.TheirClassTest.testThis" -r human
- sfdx apex:test:run -l RunLocalTests -d <path to outputdir> -u me@my.org

# resultFormatLongDescription

Permissible values are: human, tap, junit, json

# classNamesDescription

comma-separated list of Apex test class names to run; if you select --classnames, you can't specify --suitenames or --tests

# suiteNamesDescription

comma-separated list of Apex test suite names to run; if you select --suitenames, you can't specify --classnames or --tests

# testsDescription

comma-separated list of Apex test class names or IDs and, if applicable, test methods to run; if you specify --tests, you can't specify --classnames or --suitenames

# codeCoverageDescription

retrieves code coverage results

# outputDirectoryDescription

directory to store test run files

# testLevelDescription

specifies which tests to run, using one of these TestLevel enum values:
RunSpecifiedTests—Only the tests that you specify are run.
RunLocalTests—All tests in your org are run, except the ones that originate from installed managed packages.
RunAllTestsInOrg—All tests are in your org and in installed managed packages are run

# waitDescription

sets the streaming client socket timeout in minutes; specify a longer wait time if timeouts occur frequently

# synchronousDescription

runs test methods from a single Apex class synchronously; if not specified, tests are run ansynchronously

# detailedCoverageDescription

display detailed code coverage per test

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
