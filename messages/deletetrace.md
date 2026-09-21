# summary

Delete a trace flag.

# description

Remove a trace flag by its ID. Use "<%= config.bin %> apex list trace" to find trace flag IDs.

# examples

- Delete a trace flag by ID:

  <%= config.bin %> <%= command.id %> --trace-flag-id 7tf000000000001AAA

# flags.trace-flag-id.summary

ID of the trace flag to delete.

# traceFlagDeleteSuccess

Successfully deleted trace flag %s.

# traceFlagDeleteFailed

Failed to delete trace flag %s.
