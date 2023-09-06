// // // const TronWeb = require('tronweb');
// // // const fs = require('fs');
// // // const dotenv = require('dotenv');

// // // dotenv.config();

// // // const tronProApiKey = process.env.TRON_PRO_API_KEY;

// // // const tronWeb = new TronWeb({
// // //     fullHost: 'https://api.trongrid.io',
// // //     headers: { 'TRON-PRO-API-KEY': tronProApiKey },
// // // });

// // // async function storeLatestBlockData() {
// // //     try {
// // //         let latestBlockHeight = await tronWeb.trx.getCurrentBlock();
// // //         // console.log("latestBlockHeight:===", latestBlockHeight);

// // //         const jsonData = JSON.stringify(latestBlockHeight, null, 2); // The last argument adds formatting for readability
// // //         fs.writeFileSync('latestBlockData.json', jsonData);
// // //         console.log('Latest block data stored in latestBlockData.json');
// // //     } catch (e) {
// // //         console.error('Error:', e);
// // //     }
// // // }

// // // storeLatestBlockData();



// // // const TronWeb = require('tronweb');
// // // const fs = require('fs');
// // // const dotenv = require('dotenv');

// // // dotenv.config();

// // // const tronProApiKey = process.env.TRON_PRO_API_KEY;

// // // const tronWeb = new TronWeb({
// // //     fullHost: 'https://api.trongrid.io',
// // //     headers: { 'TRON-PRO-API-KEY': tronProApiKey },
// // // });

// // // async function storeLatestBlockData() {
// // //     try {
// // //         let latestBlockHeight = await tronWeb.trx.getCurrentBlock();
// // //         let latestBlockNumber = await latestBlockHeight.block_header.raw_data.number;
// // //         // Fetch transactions from the latest block
// // //         let blockData = await tronWeb.trx.getBlock(latestBlockNumber);

// // //         // Fetch transaction data from the block
// // //         let transactions = blockData.transactions;

// // //         const jsonData = JSON.stringify(transactions, null, 2); // Adding formatting for readability
// // //         fs.writeFileSync('latestTransactions.json', jsonData);
// // //         console.log('Latest transactions data stored in latestTransactions.json');
// // //     } catch (e) {
// // //         console.error('Error:', e);
// // //     }
// // // }

// // // storeLatestBlockData();




// // const TronWeb = require('tronweb');
// // const fs = require('fs');
// // const dotenv = require('dotenv');

// // dotenv.config();

// // const tronProApiKey = process.env.TRON_PRO_API_KEY;

// // const tronWeb = new TronWeb({
// //     fullHost: 'https://api.trongrid.io',
// //     headers: { 'TRON-PRO-API-KEY': tronProApiKey },
// // });

// // async function storeTransactionsFromBlock(blockHeight) {
// //     try {
// //         // Fetch transactions from the specified block
// //         let transactions = await tronWeb.trx.getTransactionFromBlock(54075720);

// //         const jsonData = JSON.stringify(transactions, null, 2); // Adding formatting for readability
// //         fs.writeFileSync(`transactionsFromBlock${blockHeight}.json`, jsonData);
// //         console.log(`Transactions from block ${blockHeight} stored in transactionsFromBlock${blockHeight}.json`);
// //     } catch (e) {
// //         console.error('Error:', e);
// //     }
// // }

// // async function storeLatestBlockTransactions() {
// //     try {
// //         let latestBlockHeight = await tronWeb.trx.getCurrentBlock();
// //         let latestBlockNumber = await latestBlockHeight.block_header.raw_data.number;
// //         await storeTransactionsFromBlock(latestBlockNumber);
// //     } catch (e) {
// //         console.error('Error:', e);
// //     }
// // }

// // storeLatestBlockTransactions();


// const TronWeb = require('tronweb');
// const fs = require('fs');
// const dotenv = require('dotenv');

// dotenv.config();

// const tronProApiKey = process.env.TRON_PRO_API_KEY;

// const tronWeb = new TronWeb({
//     fullHost: 'https://api.trongrid.io',
//     headers: { 'TRON-PRO-API-KEY': tronProApiKey },
// });

// async function storeTransactionsFromBlock(blockHeight) {
//     try {
//         // Fetch transactions from the specified block
//         let transactions = await tronWeb.trx.getTransactionFromBlock(54075720);

//         // Store the transactions as JSON in a file
//         const jsonData = JSON.stringify(transactions, null, 2); // Adding formatting for readability
//         fs.writeFileSync(`54075720 transactionsFromBlock2${blockHeight}.json`, jsonData);
//         console.log(`Transactions from block ${blockHeight} stored in transactionsFromBlock${blockHeight}.json`);
//     } catch (e) {
//         console.error('Error:', e);
//     }
// }

// async function storeBlockData(blockHeight) {
//     try {
//         // Fetch block data from the specified block
//         let block = await tronWeb.trx.getBlock(54075720);

//         // Store the block data as JSON in a file
//         const jsonData = JSON.stringify(block, null, 2); // Adding formatting for readability
//         fs.writeFileSync(`54075720 blockData2${blockHeight}.json`, jsonData);
//         console.log(`Block data from block ${blockHeight} stored in blockData${blockHeight}.json`);
//     } catch (e) {
//         console.error('Error:', e);
//     }
// }

// async function storeLatestBlockData() {
//     try {
//         let latestBlockHeight = await tronWeb.trx.getCurrentBlock();
//         let latestBlockNumber = await latestBlockHeight.block_header.raw_data.number;

//         // Store transactions from the latest block
//         await storeTransactionsFromBlock(latestBlockNumber);

//         // Store block data from the latest block
//         await storeBlockData(latestBlockNumber);
//     } catch (e) {
//         console.error('Error:', e);
//     }
// }

// storeLatestBlockData();


const TronWeb = require('tronweb');
const sqlite3 = require('sqlite3');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const tronProApiKey = process.env.TRON_PRO_API_KEY;
const privateKey = process.env.PRIVATE_KEY;
const tronRpcUrl = process.env.TRON_RPC_QN_URL;

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    // fullHost: tronRpcUrl,
    headers: { 'TRON-PRO-API-KEY': tronProApiKey },
    privateKey: privateKey,
});

function convertUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp);
    const options = { timeZone: 'UTC' };
    const localDate = date.toLocaleString("en-US", options);
    return localDate;
}

const jsonDataArray = [];

async function storeBlockAndTransactionsData(blockHeight) {
    try {
        let block = await tronWeb.trx.getBlock(blockHeight);

        let transactions = await tronWeb.trx.getTransactionFromBlock(blockHeight);

        const blockD = {
            blockHash: block.blockID,
            parentHash: block.block_header.raw_data.parentHash,
            blockNumber: block.block_header.raw_data.number,
            timestamp: convertUnixTimestamp(block.block_header.raw_data.timestamp),
            witnessAddress: tronWeb.address.fromHex(block.block_header.raw_data.witness_address),
            version: block.block_header.raw_data.version,
            witnessSignature: block.block_header.witness_signature,
        };

        jsonDataArray.push(blockD);

        for (const txs of block.transactions) {
            const transactionData = {
                txID: txs.txID,
                blockHash: blockD.blockHash,
                blockNumber: blockD.blockNumber,
                fromAddress: tronWeb.address.fromHex(txs.raw_data.contract[0].parameter.value.owner_address),
                gasPrice: txs.raw_data.contract[0].parameter.value.call_value / 10 ** 6 + " TRX",
                input: txs.raw_data.contract[0].parameter.value.data,
                stakedAssetReleasedBalance: txs.raw_data.contract[0].parameter.value.balance / 10 ** 6 + " TRX",
                resource: txs.raw_data.contract[0].parameter.value.resource,
                timestamp: convertUnixTimestamp(txs.raw_data.timestamp),
                expiration: convertUnixTimestamp(txs.raw_data.expiration),
                toAddress: tronWeb.address.fromHex(txs.raw_data.contract[0].parameter.value.to_address),
                amount: txs.raw_data.contract[0].parameter.value.amount / 10 ** 6 + " TRX",
                feeLimit: txs.raw_data.fee_limit / 10 ** 6 + " TRX",
                type: txs.raw_data.contract[0].type,
                ownerAddress: tronWeb.address.fromHex(txs.raw_data.contract[0].parameter.value.owner_address),
                contractAddress: tronWeb.address.fromHex(txs.raw_data.contract[0].parameter.value.contract_address),
                resourcesTakenFromAddress: tronWeb.address.fromHex(txs.raw_data.contract[0].parameter.value.receiver_address),
                contractData: tronWeb.address.fromHex(txs.raw_data.contract[0].parameter.value.data),
            };

            jsonDataArray.push(transactionData);
        }

        // const blockData = {
        //     blockD,
        //     transactions,
        // };

        // Store the combined data as JSON in a file
        const jsonData = JSON.stringify(jsonDataArray, null, 2); // Adding formatting for readability
        fs.writeFileSync(`${blockHeight}_BlockAndTransactions.json`, jsonData);
        console.log(`Block data and transactions from block ${blockHeight} stored in ${blockHeight}_BlockAndTransactions.json`);
    } catch (e) {
        console.error('Error:', e);
    }
}

async function storeLatestBlockAndTransactionsData() {
    try {
        // let latestBlockHeight = await tronWeb.trx.getCurrentBlock();
        // let latestBlockNumber = await latestBlockHeight.block_header.raw_data.number;
        let latestBlockNumber = 54075720;

        // Store block and transactions data from the latest block
        await storeBlockAndTransactionsData(latestBlockNumber);
    } catch (e) {
        console.error('Error:', e);
    }
}

storeLatestBlockAndTransactionsData();
