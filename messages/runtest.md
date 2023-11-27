# summary

Invoke Apex tests in an org.

# description

Specify which tests to run by using the --class-names, --suite-names, or --tests flags. Alternatively, use the --test-level flag to run all the tests in your org, local tests, or specified tests.

To see code coverage results, use the --code-coverage flag with --result-format. The output displays a high-level summary of the test run and the code coverage values for classes in your org. If you specify human-readable result format, use the --detailed-coverage flag to see detailed coverage results for each test method run.

By default, Apex tests run asynchronously and immediately return a test run ID. You can use the --wait flag to specify the number of minutes to wait; if the tests finish in that timeframe, the command displays the results. If the tests haven't finished by the end of the wait time, the command displays a test run ID. Use the "<%= config.bin %> apex get test --test-run-id" command to get the results.

NOTE: The testRunCoverage value (JSON and JUnit result formats) is a percentage of the covered lines and total lines from all the Apex classes evaluated by the tests in this run.

# examples

- Run all Apex tests and suites in your default org:

  <%= config.bin %> <%= command.id %>

- Run the specified Apex test classes in your default org and display results in human-readable form:

  <%= config.bin %> <%= command.id %> --class-names MyClassTest --class-names MyOtherClassTest --result-format human

- Run the specified Apex test suites in your default org and include code coverage results and additional details:

  <%= config.bin %> <%= command.id %> --suite-names MySuite --suite-names MyOtherSuite --code-coverage --detailed-coverage

- Run the specified Apex tests in your default org and display results in human-readable output:

  <%= config.bin %> <%= command.id %> --tests MyClassTest.testCoolFeature --tests MyClassTest.testAwesomeFeature --tests AnotherClassTest --tests namespace.TheirClassTest.testThis --result-format human

- Run all tests in the org with the specified username with the specified test level; save the output to the specified directory:

  <%= config.bin %> <%= command.id %> --test-level RunLocalTests --output-dir <path to outputdir> --target-org me@my.org

# flags.result-format.summary

Format of the test results.

# flags.class-names.summary

Apex test class names to run; default is all classes.

# flags.class-names.description

If you select --class-names, you can't specify --suite-names or --tests.
For multiple classes, repeat the flag for each.
--class-names Class1 --class-names Class2

# flags.suite-names.summary

Apex test suite names to run.

# flags.suite-names.description

If you select --suite-names, you can't specify --class-names or --tests.
For multiple suites, repeat the flag for each.
--suite-names Suite1 --suite-names Suite2

# flags.tests.summary

Apex test class names or IDs and, if applicable, test methods to run; default is all tests.

# flags.tests.description

If you specify --tests, you can't specify --class-names or --suite-names
For multiple tests, repeat the flag for each.
--tests Test1 --tests Test2

# flags.code-coverage.summary

Retrieve code coverage results.

# flags.output-dir.summary

Directory in which to store test run files.

# flags.test-level.summary

Level of tests to run; default is RunLocalTests.

# flags.test-level.description

Here's what the levels mean:

- RunSpecifiedTests — Only the tests that you specify are run.
- RunLocalTests — All tests in your org are run, except the ones that originate from installed managed packages.
- RunAllTestsInOrg — All tests are in your org and in installed managed packages are run

# flags.wait.summary

Sets the streaming client socket timeout in minutes; specify a longer wait time if timeouts occur frequently.

# flags.synchronous.summary

Runs test methods from a single Apex class synchronously; if not specified, tests are run asynchronously.

# flags.detailed-coverage.summary

Display detailed code coverage per test.

# runTestReportCommand

Run "%s apex get test -i %s -o %s" to retrieve test results

# runTestSyncInstructions

Run with --synchronous or increase --wait timeout to wait for results.

# syncClassErr

Synchronous test runs can include test methods from only one Apex class. Omit the --synchronous flag or include tests from only one class

# testLevelErr

When specifying classnames, suitenames, or tests, indicate RunSpecifiedTests as the testlevel

# testResultProcessErr

Encountered an error when processing test results
%s

# apexTestReportFormatHint

Run "%s apex get test %s --result-format <format>" to retrieve test results in a different format.

# outputDirHint

Test result files written to %s

# apexLibErr

Unknown error in Apex Library: %s
