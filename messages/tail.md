# summary

Follows active log

Activates debug logging and displays logs in the terminal. You can also pipe the logs to a file.

# examples

- sfdx apex:log:tail
- sfdx apex:log:tail --debuglevel MyDebugLevel
- sfdx apex:log:tail -c -s

# longDescription

Activates debug logging and displays logs in the terminal. You can also pipe the logs to a file.

# colorDescription

Applies default colors to noteworthy log lines.

# debugLevelDescription

Debug level to set on the DEVELOPER_LOG trace flag for your user.

# skipTraceFlagDescription

Skips trace flag setup. Assumes that a trace flag and debug level are fully set up.

# finishedTailing

Finished tailing logs
