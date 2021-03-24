# lumino-benchmark
Benchmark for lumino node

### Usage

`npm run benchmark`

### Setup

Setup values on `.env` file located at the root of the project or pass values as parameters like this:

`npm run benchmark -- --paramName=paramValue`

For multichannel configurations you can provide parameters like this:

`npm run benchmark -- --channels=tokenAddress,partnerAddress --channels=otherTokenAddress,otherPartnerAddress`

Or you can setup the `.env` file adding an option like this:

`channels=[{"tokenAddress": "someTokenAddress", "partnerAddress": "somePartnerAddress"},{"tokenAddress": "anotherTokenAddress", "partnerAddress": "anotherPartnerAddress"}]`

Also you can specify an array of partnerAddresses with the option `--partnerAddresses=someaddress,otheraddress,...` by command line
or in the `.env` file you can put `partnerAddresses="someaddress,otheraddress"` to specify those. With that option 
you need to be aware that the tokenAddress will be taken from the global option, so we asume the
same token for all the channels.
