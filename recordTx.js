const Web3 = require('web3');
const sqlite3 = require('sqlite3');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const rpcUrl = process.env.RPC_URL;

// Connect to the Ethereum node
const provider = new Web3.providers.HttpProvider(rpcUrl);
const web3 = new Web3(provider);

// Create tables for `transaction_data`, `withdrawal_data`, and `block_data`
const db = new sqlite3.Database('tronData.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Database opened');
    }
});

// Create a table for `transaction_data`
db.run(`
  CREATE TABLE IF NOT EXISTS transaction_data (
    blockHash TEXT,
    blockNumber INTEGER,
    fromAddress TEXT,
    gas INTEGER,
    gasPrice INTEGER,
    hash TEXT,
    input TEXT,
    maxFeePerGas INTEGER,
    maxPriorityFeePerGas INTEGER,
    nonce INTEGER,
    r TEXT,
    s TEXT,
    toAddress TEXT,
    transactionIndex INTEGER,
    type TEXT,
    v INTEGER,
    value TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS block_data (
    blockHash TEXT,
    parentHash TEXT,
    blockHeight INTEGER PRIMARY KEY,
    timeStamp INTEGER,
    baseFeePerGas INTEGER,
    difficulty TEXT,
    logsBloom TEXT,
    miner TEXT,
    mixHash TEXT,
    nonce TEXT,
    receiptsRoot TEXT,
    sha3Uncles TEXT,
    size INTEGER,
    stateRoot TEXT,
    totalDifficulty TEXT,
    transactionsRoot TEXT,
    uncles TEXT,
    gasLimit TEXT,
    gasUsed INTEGER,
    extraData TEXT
  )
`);

console.log('Tables created');

// Create a lock for controlling database access
const dbLock = new (require('async-mutex')).Mutex();

async function getLatestBlockNumber() {
    try {
        const latestBlock = await web3.eth.getBlockNumber();
        return latestBlock;
    } catch (e) {
        console.error('Error getting latest block number:', e);
        return null;
    }
}

async function getLastIndex() {
    try {
        const conn = await sqlite3.open('tronData.db', sqlite3.OPEN_READWRITE);
        const result = await conn.get('SELECT MAX(blockHeight) AS maxBlockHeight FROM block_data');
        await conn.close();

        const latestBlockHeight = result.maxBlockHeight !== null ? result.maxBlockHeight : 0;
        console.log('Latest block height (Actual fetched value from database):', latestBlockHeight);
        return latestBlockHeight + 1;
    } catch (e) {
        console.error('Error getting last index:', e);
        return null;
    }
}

async function listenToBlocks() {
    try {
        let blockNum = await getLastIndex();

        if (blockNum === 1) {
            blockNum = 108019738; // decided index to start fetching data from
        }

        const latestBlock = await getLatestBlockNumber();

        while (true) {
            try {
                const block = await web3.eth.getBlock(blockNum);

                // Rest of the code to process the block remains the same
                async function processBlock(block) {
                    try {
                        const blockData = {
                            blockHash: block.hash,
                            parentHash: block.parentHash,
                            blockHeight: block.number,
                            timeStamp: block.timestamp,
                            baseFeePerGas: block.baseFeePerGas,
                            difficulty: block.difficulty.toString(),
                            logsBloom: block.logsBloom,
                            miner: block.miner,
                            mixHash: block.mixHash,
                            nonce: block.nonce,
                            receiptsRoot: block.receiptsRoot,
                            sha3Uncles: block.sha3Uncles,
                            size: block.size,
                            stateRoot: block.stateRoot,
                            totalDifficulty: block.totalDifficulty.toString(),
                            transactionsRoot: block.transactionsRoot,
                            uncles: block.uncles.join(','),
                            gasLimit: block.gasLimit.toString(),
                            gasUsed: block.gasUsed,
                            extraData: block.extraData,
                        };

                        // Insert block data into the block_data table
                        const blockInsertSql = `INSERT INTO block_data VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                        await db.run(blockInsertSql, [
                            blockData.blockHash,
                            blockData.parentHash,
                            blockData.blockHeight,
                            blockData.timeStamp,
                            blockData.baseFeePerGas,
                            blockData.difficulty,
                            blockData.logsBloom,
                            blockData.miner,
                            blockData.mixHash,
                            blockData.nonce,
                            blockData.receiptsRoot,
                            blockData.sha3Uncles,
                            blockData.size,
                            blockData.stateRoot,
                            blockData.totalDifficulty,
                            blockData.transactionsRoot,
                            blockData.uncles,
                            blockData.gasLimit,
                            blockData.gasUsed,
                            blockData.extraData,
                        ]);

                        const txDetails = [];
                        for (const txnHash of block.transactions) {
                            const txnData = await web3.eth.getTransaction(txnHash);
                            const transactionData = {
                                blockHash: txnData.blockHash,
                                blockNumber: txnData.blockNumber,
                                fromAddress: txnData.from,
                                gas: txnData.gas,
                                gasPrice: txnData.gasPrice,
                                hash: txnData.hash,
                                input: txnData.input,
                                maxFeePerGas: txnData.maxFeePerGas,
                                maxPriorityFeePerGas: txnData.maxPriorityFeePerGas,
                                nonce: txnData.nonce,
                                r: txnData.r,
                                s: txnData.s,
                                toAddress: txnData.to,
                                transactionIndex: txnData.transactionIndex,
                                type: txnData.type,
                                v: txnData.v,
                                value: txnData.value.toString(),
                            };
                            txDetails.push(transactionData);

                            // Insert transaction data into the transaction_data table
                            const txInsertSql = `
        INSERT INTO transaction_data VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

                            await db.run(txInsertSql, [
                                transactionData.blockHash,
                                transactionData.blockNumber,
                                transactionData.fromAddress,
                                transactionData.gas,
                                transactionData.gasPrice,
                                transactionData.hash,
                                transactionData.input,
                                transactionData.maxFeePerGas,
                                transactionData.maxPriorityFeePerGas,
                                transactionData.nonce,
                                transactionData.r,
                                transactionData.s,
                                transactionData.toAddress,
                                transactionData.transactionIndex,
                                transactionData.type,
                                transactionData.v,
                                transactionData.value,
                            ]);
                        }

                        console.log(`Block ${block.number} processed`);
                    } catch (e) {
                        console.error('Error processing block:', e);
                    }
                }

                // Inside listenToBlocks() loop
                try {
                    const block = await web3.eth.getBlock(blockNum);
                    await processBlock(block);

                    if (blockNum > latestBlock) {
                        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before checking again
                        continue;
                    }

                    blockNum++;
                } catch (e) {
                    console.error(`Error processing block ${blockNum}:`, e);
                }


                if (blockNum > latestBlock) {
                    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before checking again
                    continue;
                }

                blockNum++;
            } catch (e) {
                console.error(`Error processing block ${blockNum}:`, e);
            }
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        db.close();
    }
}

async function main() {
    await listenToBlocks();
    // await getLastIndex();
}

main();
