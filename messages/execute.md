# summary

Execute anonymous Apex code entered on the command line or from a local file.

# description

If you don’t run this command from within a Salesforce DX project, you must specify the —-target-org flag.

To execute your code interactively, run this command with no parameters. At the prompt, enter all your Apex code; press CTRL-D when you're finished. Your code is then executed in a single execute anonymous request.
For more information, see "Anonymous Blocks" in the Apex Developer Guide.

# flags.apex-code-file.summary

Path to a local file that contains Apex code.

# examples

- sfdx apex:execute -u testusername@salesforce.org -f ~/test.apex
- sfdx apex:execute -f ~/test.apex
- sfdx apex:execute \nStart typing Apex code. Press the Enter key after each line, then press CTRL+D when finished.

# executeCompileSuccess

Compiled successfully.

# executeRuntimeSuccess

Executed successfully.
