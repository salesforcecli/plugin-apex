# summary

Fetch the specified log or given number of most recent logs from the org.

# description

To get the IDs for your debug logs, run "sfdx apex log list". Executing this command without parameters returns the most recent log.

# examples

- sfdx apex:log:get -i <log id>
- sfdx apex:log:get -i <log id> -u me@my.org
- sfdx apex:log:get -n 2 -c
- sfdx apex:log:get -d Users/Desktop/logs -n 2

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
