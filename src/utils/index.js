const fs = require('fs');
const dotenv = require('dotenv');

function defaultValues() {

    const {
        luminoEndpoint,
        luminoPort,
        luminoPrefix,
        tokenAddress,
        partnerAddress,
        amountOnWei,
        totalPayments,
        verbose,
        waitBetweenRequests
    } = dotenv.parse(fs.readFileSync('.env'));

    return {
        luminoEndpoint,
        luminoPort,
        luminoPrefix,
        tokenAddress,
        partnerAddress,
        amountOnWei,
        totalPayments,
        verbose,
        waitBetweenRequests
    };
}

function setup(args) {
    const setup = defaultValues();
    if (args['host']) {
        setup.luminoEndpoint = args['host'];
    }

    if (args['port']) {
        setup.luminoPort = args['port'];
    }

    if (args['tokenAddress']) {
        setup.tokenAddress = args['tokenAddress'];
    }

    if (args['partnerAddress']) {
        setup.partnerAddress = args['partnerAddress'];
    }

    if (args['amountOnWei']) {
        setup.amountOnWei = args['amountOnWei'];
    }

    if (args['waitBetweenRequests']) {
        setup.waitBetweenRequests = parseInt(args['waitBetweenRequests']) * 1000;
    }

    if (args['totalPayments']) {
        setup.totalPayments = parseInt(args['totalPayments']);
    }

    if (args['verbose']) {
        setup.verbose = true;
    }

    return {
        luminoEndpoint: setup.luminoEndpoint,
        luminoPort: setup.luminoPort,
        luminoPrefix: setup.luminoPrefix,
        tokenAddress: setup.tokenAddress,
        partnerAddress: setup.partnerAddress,
        amountOnWei: setup.amountOnWei,
        totalPayments: setup.totalPayments,
        verbose: setup.verbose,
        waitBetweenRequests: setup.waitBetweenRequests
    }
}

function formatMillis(time) {
    if (time) {
        return time < 1000 ? `${time}ms` : time < 1000 * 60 ? `${time / 1000}s` : time < 1000 * 60 * 60 ? `${time / 1000 / 60}m` : `${time / 1000 / 60 / 60}h`;
    }
    return time;
}

function buildPaymentRequest({amountOnWei, luminoPrefix, tokenAddress, partnerAddress, luminoEndpoint, luminoPort}) {
    const requestBody = `{"amount":"${amountOnWei}"}`;

    const url = `${luminoPrefix}/payments/${tokenAddress}/${partnerAddress}`;

    const requestSetup = {
        hostname: luminoEndpoint,
        port: luminoPort,
        path: url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestBody.length
        }
    };

    return {
        requestSetup,
        requestBody
    };
}

module.exports = {
    setup,
    formatMillis,
    buildPaymentRequest
};
