# summary

Activate debug logging and display logs in the terminal.

# description

You can also pipe the logs to a file.

# examples

- Activate debug logging:

  <%= config.bin %> <%= command.id %>

- Specify a debug level:

  <%= config.bin %> <%= command.id %> --debug-level MyDebugLevel

- Skip the trace flag setup and apply default colors:

  <%= config.bin %> <%= command.id %> --color --skip-trace-flag

# flags.color.summary

Apply default colors to noteworthy log lines.

# flags.debug-level.summary

Debug level to set on the DEVELOPER_LOG trace flag for your user.

# flags.skip-trace-flag.summary

Skip trace flag setup. Assumes that a trace flag and debug level are fully set up.

# finishedTailing

Finished tailing logs
