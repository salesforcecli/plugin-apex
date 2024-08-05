# summary

Display test results for a specific asynchronous test run.

# description

Provide a test run ID to display test results for an enqueued or completed asynchronous test run. The test run ID is displayed after running the "<%= config.bin %> apex test run" command.

# examples

- Display test results for your default org using a test run ID:

  <%= config.bin %> <%= command.id %> --test-run-id <test run id>

- Similar to previous example, but output the result in JUnit format:

  <%= config.bin %> <%= command.id %> --test-run-id <test run id> --result-format junit

- Also retrieve code coverage results and output in JSON format:

  <%= config.bin %> <%= command.id %> --test-run-id <test run id> --code-coverage --json

- Specify a directory in which to save the test results from the org with the specified username (rather than your default org):

  <%= config.bin %> <%= command.id %> --test-run-id <test run id> --code-coverage --output-dir <path to outputdir> --target-org me@myorg'

# flags.test-run-id.summary

ID of the test run.

# flags.output-dir.summary

Directory in which to store test result files.

# flags.concise.summary

Display only failed test results; works with human-readable output only.

# apexLibErr

Unknown error in Apex Library: %s
