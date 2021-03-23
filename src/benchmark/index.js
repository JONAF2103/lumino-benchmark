const http = require('http');
const moment = require('moment');
const utils = require('../utils');

function executePayment(setupValues) {
    const {requestSetup, requestBody} = utils.buildPaymentRequest(setupValues);
    return new Promise((resolve, reject) => {
        let start = moment();
        if (setupValues.verbose) {
            console.log('Sending payment out...')
        }
        const req = http.request(requestSetup, res => {
            res.on('data', response => {
                const data = JSON.parse(response);
                if (data.errors) {
                    reject(data.errors);
                } else {
                    if (setupValues.verbose) {
                        console.log('Payment done', data);
                    }
                    let end = moment();
                    // we wait to not overload the node
                    const timeout = setTimeout(() => {
                        resolve(end.diff(start));
                        clearTimeout(timeout);
                    }, setupValues.waitBetweenRequests);
                }
            });
        });
        req.on('error', error => {
            reject(error);
        });
        req.write(requestBody);
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
        verbose
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
    }

    console.log(`Running benchmark for ${totalPayments} payments`)

    const benchmarkStart = moment();
    const timings = [];
    let successfulPayments = 0;
    let failedPayments = 0;
    for (let currentPayment = 0; currentPayment < totalPayments; currentPayment++) {
        try {
            timings.push(await executePayment(setupValues));
            successfulPayments++;
        } catch (error) {
            console.error(error);
            failedPayments++;
        }
    }
    const total = timings.length > 0 ? timings.reduce((a, b) => a + b) : 0;
    const paymentsAverageTime = total / timings.length;
    const failedPaymentsPercentage = (failedPayments * 100 / totalPayments).toFixed(3);
    const successfulPaymentsPercentage = (successfulPayments * 100 / totalPayments).toFixed(3);
    const paymentsPerSecond = (1 / (paymentsAverageTime / 1000)).toFixed(3);
    const benchmarkEnd = moment();
    const benchmarkDuration = benchmarkEnd.diff(benchmarkStart) - (waitBetweenRequests * (totalPayments - failedPayments));
    return {
        totalPayments,
        paymentsAverageTime: isNaN(paymentsAverageTime) ? 'N/A' : `${paymentsAverageTime} milliseconds`,
        failedPaymentsPercentage,
        successfulPaymentsPercentage,
        paymentsPerSecond: isNaN(paymentsPerSecond) ? 'N/A' : paymentsPerSecond,
        benchmarkDuration: isNaN(benchmarkDuration) ? 'N/A' : utils.formatMillis(benchmarkDuration)
    }
}

module.exports = {
    run
};
