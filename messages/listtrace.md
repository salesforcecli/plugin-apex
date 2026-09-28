# summary

List trace flags in your org.

# description

Display a list of active and recently expired trace flags in your org org. Trace flags control debug logging for a specific user, Apex class, or Apex trigger. Use the "apex trace create" CLI command to create a trace flag.

# examples

- List all trace flags in your default org: 

  <%= config.bin %> <%= command.id %> 

- List trace flags for an org with alias "my-org":

  <%= config.bin %> <%= command.id %> --target-org my-org

# noTraceFlagsFound

No trace flags found in org.
