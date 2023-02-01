# summary

fetch debug logs

Fetches the specified log or given number of most recent logs from the scratch org.
To get the IDs for your debug logs, run "sfdx apex:log:list".
Use the --logid parameter to return a specific log.
Use the --number parameter to return the specified number of recent logs.
Use the --outputdir parameter to specify the directory to store the logs in.
Executing this command without parameters returns the most recent log.

# examples

- sfdx apex:log:get -i <log id>
- sfdx apex:log:get -i <log id> -u me@my.org
- sfdx apex:log:get -n 2 -c
- sfdx apex:log:get -d Users/Desktop/logs -n 2

# longDescription

Fetches the specified log or given number of most recent logs from the scratch org.
To get the IDs for your debug logs, run "sfdx apex:log:list".
Use the --logid parameter to return a specific log.
Use the --number parameter to return the specified number of recent logs.
Use the --outputdir parameter to specify the directory to store the logs in.
Executing this command without parameters returns the most recent log.

# logIDDescription

id of the log to display

# numberDescription

number of most recent logs to display

# outputDirDescription

directory for saving the log files

# outputDirLongDescription

The location can be an absolute path or relative to the current working directory. The default is the current directory.

# noResultsFound

No results found
