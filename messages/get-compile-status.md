# summary

Fetches the compilation status for Apex classes that are currently invalid or have compilation warnings.

# description

Return compile results for only Apex classes and triggers with validation errors or warnings, instead of recompiling the entire org.

# examples

- Fetch invalid Apex classes or classes that have compilation warnings for a target org

  <%= config.bin %> <%= command.id %> --target-org me@my.org

# noResultsFound

No results found
