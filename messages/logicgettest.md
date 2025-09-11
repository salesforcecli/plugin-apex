# summary

Get the results of a test run.

# description

When you run 'sf logic run test' to test Apex classes and Flows asynchronously, it returns a test run ID. Use that ID with this command to see the results.

To see code coverage results, use the --code-coverage flag with --result-format. The output displays a high-level summary of the test run and the code coverage values for classes in your org. If you specify human-readable result format, use the --detailed-coverage flag to see detailed coverage results for each test method run.

# examples

- Get the results for a specific test run ID in the default human-readable format; uses your default org:

  <%= config.bin %> <%= command.id %> --test-run-id <test run id>

- Get the results for a specific test run ID, format them as JUnit, and save them to the "test-results/junit" directory; uses the org with alias "my-scratch":

  <%= config.bin %> <%= command.id %> --test-run-id <test run id> --result-format junit --target-org my-scratch

# flags.test-run-id.summary

ID of the test run.

# flags.output-dir.summary

Directory in which to store test result files.

# flags.concise.summary

Display only failed test results; works with human-readable output only.

# apexLibErr

Unknown error in Apex Library: %s

# flags.detailed-coverage.summary

Display detailed code coverage per test.
