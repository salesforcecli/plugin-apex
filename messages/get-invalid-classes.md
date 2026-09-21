# summary

Fetch Apex classes that are currently invalid.

# description

Return compile results for Apex classes and triggers with validation errors or warnings, without recompiling the entire org.

# examples

- Fetch invalid Apex classes for a target org:

  <%= config.bin %> <%= command.id %> --target-org my-org

# noResultsFound

No invalid Apex classes found.
