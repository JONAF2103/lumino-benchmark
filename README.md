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
