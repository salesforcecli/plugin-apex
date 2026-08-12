# summary

Invoke tests for Apex, Flows, and Agentforce agents in an org.

# description

This command provides a single and unified way to run tests for multiple Salesforce features, such as Apex classes, Flows, and Agentforce agents. Running the tests together with a single command ensures seamless interoperability between the features.

By default, the command executes asynchronously and returns a test run ID. Then use the displayed "sf logic get test" command to retrieve the results. If you want to wait for the test run to complete and see the results in the command output, use the --synchronous flag.

To run specific tests, use the --tests flag and pass it the names of Apex, Flow, and Agentforce agent tests. Here's how to find the name of each type of test:

- For Apex, simply specify the name of the Apex test class.
- For Flows, use the format "FlowTesting.<name-of-flow-test>". To find the name of all the Flow tests in your org, run this command and specify the Flow category, such as "sf logic run test --synchronous --test-category Flow --test-level RunAllTestsInOrg". The command displays a table of all the Flow tests it ran; see the "TEST NAME" column for the full name of all available Flow tests in your org.
- For Agentforce agents, use the format "AgentTesting.<name-of-agent-test>". To find the names of all the Agentforce agent tests in your org, run the "sf agent test list" command. The command displays the available agent tests in the "API Name" column.

You can also run specific test methods, although if you run the tests synchronously, the methods must belong to a single Apex class, Flow test, or Agentforce agent test. To run all tests of a certain category, use --test-category and --test-level together. If neither of these flags is specified, all local tests for all categories are run by default. You can also use the --class-names and --suite-names flags to run Apex test classes or suites.

To see code coverage results, use the --code-coverage flag with --result-format. The output displays a high-level summary of the test run and the code coverage values for the tested Apex classes, Flows, or Agentforce agents. If you specify human-readable result format, use the --detailed-coverage flag to see detailed coverage results for each test method run.

You must have the "View All Data" org system permission to use this command. The permission is disabled by default and can be enabled only by a system administrator.

# examples

- Run a specific Agentforce agent test asynchronously in your default org:

  <%= config.bin %> <%= command.id %> --tests AgentTesting.Guest_Experience_Agent_Test

- Run a mix of specific Agentforce agent, Apex, and Flow tests asynchronously in your default org:

  <%= config.bin %> <%= command.id %> --tests AgentTesting.Guest_Experience_Agent_Test --tests MyApexClassTest --tests FlowTesting.Modify_Account_Desc.Modify_Account_Desc_TestAccountDescription

- Run all local Apex and Flow tests and wait for the results to complete; run the tests in the org with alias "my-scratch":

  <%= config.bin %> <%= command.id %> --test-level RunLocalTests --test-category Apex --test-category Flow --synchronous --target-org my-scratch

- Run two methods in an Apex test class and an Apex test suite:

  <%= config.bin %> <%= command.id %> --class-names MyApexClassTest.methodA --class-names MyApexClassTest.methodB --suite-names MySuite

- Run all local tests for all categories (the default behavior), save the JUnit results to the "test-results" directory, and include code coverage results:

  <%= config.bin %> <%= command.id %> --result-format junit --output-dir test-results --synchronous --code-coverage

# flags.logicTests.summary

List of test names to run. Can include Apex test classes, Flow tests, and Agentforce agent tests.

# flags.test-category.summary

Category of tests to run, such as Agent, Apex, or Flow.
