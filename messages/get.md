# summary

Fetch the specified log or given number of most recent logs from the org.

# description

To get the IDs for your debug logs, run "<%= config.bin %> apex log list". Executing this command without flags returns the most recent log.

# examples

- Fetch the log in your default org using an ID:

  <%= config.bin %> <%= command.id %> --log-id <log id>

- Fetch the log in the org with the specified username using an ID:

  <%= config.bin %> <%= command.id %> --log-id <log id> --target-org me@my.org

- Fetch the two most recent logs in your default org:

  <%= config.bin %> <%= command.id %> --number 2

- Similar to previous example, but save the two log files in the specified directory:

  <%= config.bin %> <%= command.id %> --output-dir /Users/sfdxUser/logs --number 2

# flags.log-id.summary

ID of the specific log to display.

# flags.number.summary

Number of the most recent logs to display.

# flags.output-dir.summary

Directory for saving the log files.

# flags.output-dir.description

The location can be an absolute path or relative to the current working directory. The default is the current directory.

# noResultsFound

No results found
