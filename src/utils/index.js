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
        waitBetweenRequests,
        channels
    } = dotenv.parse(fs.readFileSync('.env'));

    return {
        luminoEndpoint,
        luminoPort,
        luminoPrefix,
        tokenAddress,
        partnerAddress,
        amountOnWei: parseInt(amountOnWei),
        totalPayments: parseInt(totalPayments),
        verbose: verbose === 'true',
        waitBetweenRequests: parseInt(waitBetweenRequests),
        channels: channels ? JSON.parse(channels) : null
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

    if (args['channels']) {
        let channels = [];
        for (let channel of args['channels']) {
            let tokenAddress = channel.split(',')[0];
            let partnerAddress = channel.split(',')[1];
            channels.push({
                tokenAddress,
                partnerAddress
            });
        }
        setup.channels = channels;
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
        waitBetweenRequests: setup.waitBetweenRequests,
        channels: setup.channels
    }
}

function formatMillis(time) {
    if (time) {
        return time < 1000 ? `${time}ms` : time < 1000 * 60 ? `${time / 1000}s` : time < 1000 * 60 * 60 ? `${time / 1000 / 60}m` : `${time / 1000 / 60 / 60}h`;
    }
    return time;
}

function buildPaymentRequests({amountOnWei, luminoPrefix, tokenAddress, partnerAddress, luminoEndpoint, luminoPort, channels}) {
    const requests = [];
    const requestBody = `{"amount":"${amountOnWei}"}`;
    if (channels) {
        channels.forEach(channel => {
            const options = {
                hostname: luminoEndpoint,
                port: luminoPort,
                path: `${luminoPrefix}/payments/${channel.tokenAddress}/${channel.partnerAddress}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': requestBody.length
                }
            };
            requests.push({
                options,
                requestBody
            });
        });
    } else {
        const options = {
            hostname: luminoEndpoint,
            port: luminoPort,
            path: `${luminoPrefix}/payments/${tokenAddress}/${partnerAddress}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': requestBody.length
            }
        };
        requests.push({
            options,
            requestBody
        });
    }
    return requests;
}

module.exports = {
    setup,
    formatMillis,
    buildPaymentRequests
};
