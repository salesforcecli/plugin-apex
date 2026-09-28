# summary

Delete a trace flag in your org.

# description

Remove a trace flag by its ID. Use "<%= config.bin %> apex trace list" to find trace flag IDs in your org.

# examples

- Delete a trace flag by ID in your default org:

  <%= config.bin %> <%= command.id %> --trace-flag-id 7tf000000000001AAA

- Delete a trace flag by ID in an org with alias "my-org":

  <%= config.bin %> <%= command.id %> --trace-flag-id 7tf000000000001AAA --target-org my-org

# flags.trace-flag-id.summary

ID of the trace flag to delete.

# traceFlagDeleteSuccess

Successfully deleted trace flag %s.

# traceFlagDeleteFailed

Failed to delete trace flag %s.
