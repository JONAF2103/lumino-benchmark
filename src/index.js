const http = require('http')
const moment = require('moment');

let luminoEndpoint = 'localhost';
let luminoPort = 5000;
let luminoPrefix = '/api/v1';
let tokenAddress = '0x47E5b7d85Da2004781FeD64aeEe414eA9CdC4f17';
let partnerAddress = '0x8E6e44B93133C1C1526903746cE329a7ad6E96c2';
let amountOnWei = 10000000000000; // 0,00001 tokens
let totalPayments = 2;
let verbose = false;
let waitBetweenRequests = 1000;

const args = require('minimist')(process.argv.slice(2))

if (args['host']) {
    luminoEndpoint = args['host'];
}

if (args['port']) {
    luminoPort = args['port'];
}

if (args['tokenAddress']) {
    tokenAddress = args['tokenAddress'];
}

if (args['partnerAddress']) {
    partnerAddress = args['partnerAddress'];
}

if (args['amountOnWei']) {
    amountOnWei = args['amountOnWei'];
}

if (args['waitBetweenRequests']) {
    waitBetweenRequests = parseInt(args['waitBetweenRequests']) * 1000;
}

if (args['totalPayments']) {
    totalPayments = parseInt(args['totalPayments']);
}

if (args['verbose']) {
    verbose = true;
}

const requestBody = `{"amount":"${amountOnWei}"}`;

const url = `${luminoPrefix}/payments/${tokenAddress}/${partnerAddress}`;

const options = {
    hostname: luminoEndpoint,
    port: luminoPort,
    path: url,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': requestBody.length
    }
};

function formatMillis(time) {
    if (time) {
        return time < 1000 ? `${time}ms` : time < 1000 * 60 ? `${time / 1000}s` : time < 1000 * 60 * 60 ? `${time / 1000 / 60}m` : `${time / 1000 / 60 / 60}h`;
    }
    return '';
}

function executePayment() {
    return new Promise((resolve, reject) => {
        let start = moment();
        if (verbose) {
            console.log('Sending payment out...')
        }
        const req = http.request(options, res => {
            res.on('data', response => {
                const data = JSON.parse(response);
                if (data.errors) {
                    reject(data.errors);
                } else {
                    if (verbose) {
                        console.log('Payment done', data);
                    }
                    let end = moment();
                    // we wait to not overload the node
                    const timeout = setTimeout(() => {
                        resolve(end.diff(start));
                        clearTimeout(timeout);
                    }, waitBetweenRequests);
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

async function runBenchmark(totalPayments = 1) {
    console.log(`Running benchmark for ${totalPayments} payments`)
    const benchmarkStart = moment();
    const timings = [];
    let successfulPayments = 0;
    let failedPayments = 0;
    for (let currentPayment = 0; currentPayment < totalPayments; currentPayment++) {
        try {
            timings.push(await executePayment());
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
    const benchmarkDuration = formatMillis(benchmarkEnd.diff(benchmarkStart));
    return {
        paymentsAverageTime: isNaN(paymentsAverageTime) ? 'N/A' : `${paymentsAverageTime} milliseconds`,
        failedPaymentsPercentage,
        successfulPaymentsPercentage,
        paymentsPerSecond: isNaN(paymentsPerSecond) ? 'N/A' : paymentsPerSecond,
        benchmarkDuration
    }
}

runBenchmark(totalPayments).then(results => {
    console.log('------------------------------------------- RESULTS ---------------------------------------------------');
    console.log(`Total Requests: ${totalPayments}`);
    console.log(`Average Time: ${results.paymentsAverageTime}`);
    console.log(`Failed Payments: ${results.failedPaymentsPercentage}%`);
    console.log(`Success Payments: ${results.successfulPaymentsPercentage}%`);
    console.log(`Payments per second: ${results.paymentsPerSecond}`);
    console.log(`Benchmark duration: ${results.benchmarkDuration}`);
    console.log('-------------------------------------------------------------------------------------------------------');
});
