## Migrations

1. Create migration scripts by using the "Generate Migrations" task in the VSCode actions.
1. To run the migrations locally, open the SST Console and invoke the `migrateToLatest`
   function.

## Creating the JWT Signing Secret for getting a GH Installation Accces Token

TODO: Haven't remembered or written down how to do this, but I do remmeber using a 
Ruby application to run this. I've now added `./scripts/getSigningSecret.sh` but I'm 
still unsure if it writes it out in the correct format.