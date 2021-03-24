const http = require('http');
const moment = require('moment');
const utils = require('../utils');

function executePayments(setupValues) {
    const requests = utils.buildPaymentRequests(setupValues);
    return new Promise((resolve) => {
        if (setupValues.verbose) {
            if (setupValues.channels) {
                console.log('Sending multiple payments out...');
            } else {
                console.log('Sending payment out...');
            }
        }
        const paymentsOut = requests.map(request => sendPayment(request));
        Promise.all(paymentsOut).then(results => {
            // we wait to not overload the node
            const timeout = setTimeout(() => {
                resolve(results);
                clearTimeout(timeout);
            }, setupValues.waitBetweenRequests);
        });
    });
}

function sendPayment(paymentRequest) {
    return new Promise((resolve) => {
        let start = moment();
        const req = http.request(paymentRequest.options, res => {
            res.on('data', response => {
                const data = JSON.parse(response);
                if (data.errors) {
                    resolve({paymentFailed: true, errors: data.errors});
                } else {
                    let end = moment();
                    resolve({paymentFailed: false, duration: end.diff(start)});
                }
            });
        });
        req.on('error', error => {
            resolve({paymentFailed: true, errors: error});
        });
        req.write(paymentRequest.requestBody);
        req.end();
    });
}

async function run(setupValues) {

    const {
        luminoEndpoint,
        luminoPort,
        luminoPrefix,
        tokenAddress,
        partnerAddress,
        amountOnWei,
        waitBetweenRequests,
        totalPayments,
        verbose,
        channels
    } = setupValues;

    if (verbose) {
        console.log('Starting payment benchmark....');
        console.log(`luminoEndpoint=${luminoEndpoint}`);
        console.log(`luminoPort=${luminoPort}`);
        console.log(`luminoPrefix=${luminoPrefix}`);
        console.log(`tokenAddress=${tokenAddress}`);
        console.log(`partnerAddress=${partnerAddress}`);
        console.log(`amountOnWei=${amountOnWei}`);
        console.log(`waitBetweenRequests=${waitBetweenRequests}`);
        console.log(`totalPayments=${totalPayments}`);
        console.log(`verbose=${verbose}`);
        if (channels) {
            console.log('channels =', channels);
        }
    }

    if (setupValues.channels) {
        console.log(`Running multi benchmark for ${totalPayments} payments`)
    } else {
        console.log(`Running benchmark for ${totalPayments} payments`)
    }

    const benchmarkStart = moment();
    const timings = [];
    const paymentsPerSecond = [];
    let successfulPayments = 0;
    let failedPayments = 0;
    for (let currentPayment = 0; currentPayment < totalPayments; currentPayment++) {
        const results = await executePayments(setupValues);
        const failures = results.filter(result => result.paymentFailed).length;
        failedPayments += failures;
        const paymentResults = results.filter(result => !result.paymentFailed);
        successfulPayments += paymentResults.length;
        paymentResults.forEach(paymentResult => timings.push(paymentResult.duration));
        // all these successful payments are executed at the same time so we need to calculate
        // the payments per second with these durations and later make an avg of these values
        let perSecondTiming = 0;
        paymentResults.forEach(paymentResult => {
            perSecondTiming += paymentResult.duration;
        });
        paymentsPerSecond.push(perSecondTiming / paymentResults.length);
    }
    const total = timings.length > 0 ? timings.reduce((a, b) => a + b) : 0;
    const paymentsAverageTime = total / timings.length;
    const failedPaymentsPercentage = (failedPayments * 100 / totalPayments).toFixed(3);
    const successfulPaymentsPercentage = (successfulPayments * 100 / totalPayments).toFixed(3);
    let perSecondBenchmark = paymentsPerSecond.length > 0 ? paymentsPerSecond.reduce((a, b) => a + b) / paymentsPerSecond.length : 0;
    perSecondBenchmark = perSecondBenchmark > 0 ? (1 / perSecondBenchmark) : 0;
    const benchmarkEnd = moment();
    const benchmarkDuration = benchmarkEnd.diff(benchmarkStart) - (waitBetweenRequests * (totalPayments - failedPayments));
    return {
        totalPayments,
        paymentsAverageTime: isNaN(paymentsAverageTime) ? 'N/A' : `${paymentsAverageTime} milliseconds`,
        failedPaymentsPercentage,
        successfulPaymentsPercentage,
        paymentsPerSecond: isNaN(perSecondBenchmark) ? 'N/A' : perSecondBenchmark,
        benchmarkDuration: isNaN(benchmarkDuration) ? 'N/A' : utils.formatMillis(benchmarkDuration)
    }
}

module.exports = {
    run
};
