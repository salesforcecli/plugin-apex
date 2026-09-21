# summary

Create a trace flag for a user, Apex class, or Apex trigger.

# description

Set up debug logging for a specified entity (user, Apex class, or Apex trigger) by creating a trace flag. You must specify an existing debug level and the entity to trace. The trace flag expires after the specified duration (default 30 minutes).

# examples

- Create a trace flag for a user with the SFDC_DevConsole debug level:

  <%= config.bin %> <%= command.id %> --traced-entity-id 005xx000001Svs8AAC --debug-level SFDC_DevConsole

- Create a USER_DEBUG trace flag lasting 60 minutes:

  <%= config.bin %> <%= command.id %> --traced-entity-id 005xx000001Svs8AAC --debug-level MyDebugLevel --log-type USER_DEBUG --duration 60

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
