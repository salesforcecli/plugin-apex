# summary

Execute anonymous Apex code entered on the command line or from a local file.

# description

If you don’t run this command from within a Salesforce DX project, you must specify the —-target-org flag.

To execute your code interactively, run this command with no flags. At the prompt, enter all your Apex code; press CTRL-D when you're finished. Your code is then executed in a single execute anonymous request.
For more information, see "Anonymous Blocks" in the Apex Developer Guide.

# flags.file.summary

Path to a local file that contains Apex code.

# examples

- Execute the Apex code that's in the ~/test.apex file in the org with the specified username:

  <%= config.bin %> <%= command.id %> --target-org testusername@salesforce.org --file ~/test.apex

- Similar to previous example, but execute the code in your default org:

  <%= config.bin %> <%= command.id %> --file ~/test.apex

- Run the command with no flags to start interactive mode; the code will execute in your default org when you exit. At the prompt, start type Apex code and press the Enter key after each line. Press CTRL+D when finished.

  <%= config.bin %> <%= command.id %>

# executeCompileSuccess

Compiled successfully.

# executeRuntimeSuccess

Executed successfully.

# executeRuntimeFailure

Execution failed at this code:

%s

# executeCompileFailure

Compilation failed at Line %s column %s with the error:

%s

# executeRuntimeSuccess

Executed successfully.
