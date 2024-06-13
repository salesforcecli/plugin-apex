# summary

Display a list of IDs and general information about debug logs.

# description

Run this command in a project to list the IDs and general information for all debug logs in your default org.

To fetch a specific log from your org, obtain the ID from this command's output, then run the “<%= config.bin %> apex log get” command.

# examples

- List the IDs and information about the debug logs in your default org:

  <%= config.bin %> <%= command.id %>

- Similar to previous example, but use the org with the specified username:

  <%= config.bin %> <%= command.id %> --target-org me@my.org

# noDebugLogsFound

No debug logs found in org
