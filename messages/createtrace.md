# summary

Create a trace flag for a user, Apex class, or Apex trigger.

# description

Use trace flags to set up debug logging for a specified entity (user, Apex class, or Apex trigger). You must specify an existing debug level and the entity to trace. The trace flag expires after the specified duration (default 30 minutes).

To find the list of existing debug levels, run this Tooling API query on your org using the "data query" CLI command: "sf data query --query "SELECT DeveloperName FROM DebugLevel" --use-tooling-api".  To create a debug level in your org, see "Set Up Debug Logging" (https://help.salesforce.com/s/articleView?id=xcloud.code_add_users_debug_log.htm)

Use the --log-type flag to specify the type of debug log file to create; you have these two options:

- DEVELOPER_LOG (default) — captures a full debug log, including Apex execution, SOQL, DML, callouts, and so on.
- USER_DEBUG — captures only System.debug() statements and user-generated log lines. Use this option for lighter-weight smaller logs.

After you create the trace flag, follow these steps to use it:

1. Perform the action that you want to debug.  For example, if you created a trace flag for an Apex class, run the class.
2. Run the "apex log list" CLI command to get a list of the available debug logs in your org.  Make note of the ID of the debug log you're interested in.
3. Run the "apex log get" command and specify this ID log with the --log-id flag. You can also use the --number flag to get the most recent debug logs.
4. Examine the debug log for information about the entity you created a trace flag for. See "Debug Log" (https://developer.salesforce.com/docs/atlas.en-us.apexcode.meta/apexcode/apex_debugging_debug_log.htm) for more information.

# examples

- Create a trace flag for a user (ID starts with 005) with the SFDC_DevConsole debug level in your default org:

  <%= config.bin %> <%= command.id %> --traced-entity-id 005xx000001Svs8AAC --debug-level SFDC_DevConsole

- Create a USER_DEBUG trace flag that lasts 60 minutes in the org with alias "my-org":

  <%= config.bin %> <%= command.id %> --traced-entity-id 005xx000001Svs8AAC --debug-level MyDebugLevel --log-type USER_DEBUG --duration 60 --target-org my-org

# flags.traced-entity-id.summary

ID of the user, Apex class, or Apex trigger to trace.

# flags.debug-level.summary

Developer name of an existing debug level to apply.

# flags.log-type.summary

Type of trace flag to create.

# flags.duration.summary

Duration, in minutes, before the trace flag expires. Maximum is 1440 (24 hours).

# debugLevelNotFound

Debug level "%s" not found. Create one in Setup or specify an existing debug level.

# traceFlagCreateSuccess

Successfully created trace flag %s.

# traceFlagCreateFailed

Failed to create trace flag.
