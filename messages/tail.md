# summary

Activate debug logging and display logs in the terminal.

# description

You can also pipe the logs to a file.

# examples

- sfdx apex:log:tail
- sfdx apex:log:tail --debuglevel MyDebugLevel
- sfdx apex:log:tail -c -s

# flags.color.summary

Apply default colors to noteworthy log lines.

# flags.debug-level.summary

Debug level to set on the DEVELOPER_LOG trace flag for your user.

# flags.skip-trace-flag.summary

Skip trace flag setup. Assumes that a trace flag and debug level are fully set up.

# finishedTailing

Finished tailing logs
