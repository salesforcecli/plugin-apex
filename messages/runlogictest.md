# summary

Invoke tests for Apex and Flows in an org.

# description

This command provides a single and unified way to run tests for multiple Salesforce features, such as Apex classes and Flows. Running the tests together with a single command ensures seamless interoperability between the features.

By default, the command executes asynchronously and returns a test run ID. Then use the "sf logic get test" command to retrieve the results. If you want to wait for the test run to complete and see the results in the command output, use the --synchronous flag.

To run specific tests, use the --tests flag, passing it the Apex test class names or the Flow tests in the form Flowtest.<name>. You can also run specific test methods, although if you run the tests synchronously, the methods must belong to a single Apex class or Flow test. To run all tests of a certain category, use --test-level with --test-category. If neither flag is specified, all local tests for all categories are run by default. You can also use the --class-names and --suite-names flags to run Apex test classes or suites.

To see code coverage results, use the --code-coverage flag with --result-format. The output displays a high-level summary of the test run and the code coverage values for the tested classes or flows. If you specify human-readable result format, use the --detailed-coverage flag to see detailed coverage results for each test method run.

You must have the "View All Data" org system permission to use this command. The permission is disabled by default and can be enabled only by a system administrator.

# examples

- Run a mix of specific Apex and Flow tests asynchronously in your default org:

  <%= config.bin %> <%= command.id %> --tests MyApexClassTest,FlowTest.ProcessOrder

- Run all local Apex and Flow tests and wait for the results to complete; run the tests in the org with alias "my-scratch":

  <%= config.bin %> <%= command.id %> --test-level RunLocalTests --test-category Apex --test-category Flow --synchronous --target-org my-scratch

- Run two methods in an Apex test class and an Apex test suite:

  <%= config.bin %> <%= command.id %> --class-names MyApexClassTest.methodA --class-names MyApexClassTest.methodB --suite-names MySuite

- Run all local tests for all categories (the default behavior), save the JUnit results to the "test-results" directory, and include code coverage results:

  <%= config.bin %> <%= command.id %> --result-format junit --output-dir test-results --synchronous --code-coverage

# flags.logicTests.summary

Comma-separated list of test names to run. Can include Apex test classes and Flow tests.

# flags.test-category.summary

Category of tests to run, such as Apex or Flow.

# runLogicTestReportCommand

Run "%s logic get test -i %s -o %s" to retrieve the test results.

# runTestSyncInstructions

Run with --synchronous or increase --wait timeout to wait for results.