# summary

Invoke tests for Apex and Flows in an org.

# description

This command provides a single, unified interface to run tests for multiple metadata types.
By default, the command executes asynchronously, returning a test run ID. Use 'sf logic get test' to retrieve the results.
Use the --synchronous flag to wait for the test run to complete and see the results in the command output.
To run specific tests, use --test-names. To run all tests of a certain type, use --test-level with --test-category. If neither is specified, all local tests for all categories will be run.

# examples

- Run a mix of specific named tests for Apex and Flow asynchronously:

  <%= config.bin %> <%= command.id %> --test-names MyApexClassTest,FlowTest.ProcessOrder

- Run all local tests for only the Apex and Flow categories, waiting for the results to complete:

  <%= config.bin %> <%= command.id %> --test-level RunLocalTests --test-category Apex --test-category Flow --synchronous

- Run all local tests for ALL categories (the default behavior) and save the JUnit results to the "test-results" directory:

  <%= config.bin %> <%= command.id %> --result-format junit --output-dir test-results --synchronous

# flags.logicTests.summary

Comma-separated list of test names to run. Can include Apex classes, Flow tests (FlowTest.<name>), and Agent tests (AgentTest.<name>).

# flags.test-category.summary

Category of tests to run.

# flags.test-category.description

Category of tests to run. Can be specified multiple times. Valid values are 'Apex' and 'Flow'.

# runLogicTestReportCommand

Run "%s logic get test -i %s -o %s" to retrieve test results

# runTestSyncInstructions

Run with --synchronous or increase --wait timeout to wait for results.
