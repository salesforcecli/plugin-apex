# summary

List trace flags in your org.

# description

Display a list of active and recently expired trace flags in your default org. Trace flags control debug logging for a specific user, Apex class, or Apex trigger.

# examples

- List all trace flags in your default org:

  <%= config.bin %> <%= command.id %>

- List trace flags for a specific org:

  <%= config.bin %> <%= command.id %> --target-org me@my.org

# noTraceFlagsFound

No trace flags found in org.
