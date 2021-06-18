const http = require('http');
const moment = require('moment');
const utils = require('../utils');

function executePayments(setupValues) {
    const requests = utils.buildPaymentRequests(setupValues);
    return new Promise((resolve) => {
        if (setupValues.verbose) {
            if (setupValues.channels || setupValues.partnerAddresses) {
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
        partnerAddresses,
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

        if (partnerAddresses) {
            console.log('partnerAddresses = ', partnerAddresses);
        }

        console.log(`amountOnWei=${amountOnWei}`);
        console.log(`waitBetweenRequests=${waitBetweenRequests}`);
        console.log(`totalPayments=${totalPayments}`);
        console.log(`verbose=${verbose}`);

        if (channels) {
            console.log('channels =', channels);
        }
    }

    if (setupValues.channels || setupValues.partnerAddresses) {
        console.log(`Running multi benchmark for ${totalPayments} payments`)
    } else {
        console.log(`Running benchmark for ${totalPayments} payments`)
    }

    const benchmarkStart = moment();
    const paymentDurations = [];
    const paymentEstimations = [];
    let successfulPaymentAmount = 0;
    let failedPaymentAmount = 0;
    let totalRequests = 0;
    for (let currentPayment = 0; currentPayment < totalPayments; currentPayment++) {
        const results = await executePayments(setupValues);
        totalRequests += results.length;
        failedPaymentAmount += results.filter(result => result.paymentFailed).length;
        let successfulPayments = results.filter(result => !result.paymentFailed);
        successfulPaymentAmount += successfulPayments.length;
        let successfulPaymentDurationAvg = 0;
	successfulPayments.forEach(successfulPayment => {
		paymentDurations.push(successfulPayment.duration);
		successfulPaymentDurationAvg += successfulPayment.duration;
	});
	successfulPaymentDurationAvg = successfulPaymentDurationAvg / successfulPayments.length;
        // all these successful payments are executed at the same time so we need to calculate
        // the payments per second with these durations and later make an avg of these values
        // example: if we have 10 payments with duration average of 3206ms, if we calculate the
        // payments per second with that value it will be not an accurate value since it took only 3206ms
        // to send all the parallel payments. So here we have to take that average value and divide it
        // into the amount of payments to get an approximation value of ms that should take those payments,
        // later we can do the inverse of that to know the payments per second with parallel payments.
        paymentEstimations.push(successfulPaymentDurationAvg / successfulPayments.length);
    }

    const benchmarkDuration = getBenchmarkDuration(benchmarkStart, waitBetweenRequests, totalRequests, failedPaymentAmount);
    const totalPaymentDurations = getTotalPaymentDurations(paymentDurations);
    const paymentDurationAverage = totalPaymentDurations / paymentDurations.length;
    const failedPaymentsPercentage = getPaymentPercentage(failedPaymentAmount, totalRequests);
    const successfulPaymentsPercentage = getPaymentPercentage(successfulPaymentAmount, totalRequests);
    const paymentsPerSecond = getPaymentsPerSecond(paymentEstimations);
    return {
        totalRequests,
        paymentDurationAverage: isNaN(paymentDurationAverage) ? 'N/A' : `${paymentDurationAverage.toFixed(0)} ms`,
        failedPaymentsPercentage,
        successfulPaymentsPercentage,
        paymentsPerSecond: isNaN(paymentsPerSecond) ? 'N/A' : paymentsPerSecond.toFixed(1),
        benchmarkDuration
    }
}

function getPaymentPercentage(paymentAmount, totalPayments) {
    return (paymentAmount * 100 / totalPayments).toFixed(1);
}

function getTotalPaymentDurations(paymentDurations) {
    return paymentDurations.length > 0 ? paymentDurations.reduce((a, b) => a + b) : 0;
}

function getBenchmarkDuration(benchmarkStart, waitBetweenRequests, totalPayments, failedPaymentAmount) {
    const benchmarkEnd = moment();
    let benchmarkDuration = benchmarkEnd.diff(benchmarkStart);
    let result = isNaN(benchmarkDuration) ? 'N/A' : utils.formatMillis(benchmarkDuration);
    return result + ` (waiting between requests ${waitBetweenRequests * (totalPayments - failedPaymentAmount)})`
}

function getPaymentsPerSecond(paymentEstimations) {
    const estimatedDuration = (paymentEstimations.length > 0 ? paymentEstimations.reduce((a, b) => a + b) / paymentEstimations.length : 0);
    if (estimatedDuration > 0) {
        return 1000 / estimatedDuration;
    }
    return estimatedDuration;
}

module.exports = {
    run
};
