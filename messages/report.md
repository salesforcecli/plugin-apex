# summary

Display test results for a specific asynchronous test run.

# description

Provide a test run ID to display test results for an enqueued or completed asynchronous test run. The test run ID is displayed after running the "sfdx apex:test:run" command.

# examples

- sfdx apex:test:report -i <test run id>
- sfdx apex:test:report -i <test run id> -r junit
- sfdx apex:test:report -i <test run id> -c --json
- sfdx apex:test:report -i <test run id> -c -d <path to outputdir> -u me@myorg',

# flags.test-run-id.summary

ID of the test run.

# flags.result-format.summary

Format of the results.

# flags.code-coverage.summary

Retrieve code coverage results.

# flags.output-dir.summary

Directory in which to store test result files.

# apexTestReportFormatHint

Run "sfdx apex test report %s --result-format <format>" to retrieve test results in a different format.

# outputDirHint

Test result files written to %s

# testResultProcessErr

Encountered an error when processing test results
%s

# apexLibErr

Unknown error in Apex Library: %s
