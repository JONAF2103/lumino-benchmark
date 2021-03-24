const utils = require('./utils');
const benchmark = require('./benchmark');

const args = require('minimist')(process.argv.slice(2));

const setupValues = utils.setup(args);

benchmark.run(setupValues).then(results => {
    const {
        totalRequests,
        paymentDurationAverage,
        failedPaymentsPercentage,
        successfulPaymentsPercentage,
        paymentsPerSecond,
        benchmarkDuration
    } = results;

    console.log('------------------------------------------- RESULTS ---------------------------------------------------');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Average Time: ${paymentDurationAverage}`);
    console.log(`Failed Payments: ${failedPaymentsPercentage}%`);
    console.log(`Success Payments: ${successfulPaymentsPercentage}%`);
    console.log(`Payments per second: ${paymentsPerSecond}`);
    console.log(`Benchmark duration: ${benchmarkDuration}`);
    console.log('-------------------------------------------------------------------------------------------------------');
});
