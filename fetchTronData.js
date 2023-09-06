const TronWeb = require('tronweb');
const sqlite3 = require('sqlite3');
const dotenv = require('dotenv');
const fs = require('fs');
// const fetch = require('node-fetch');

dotenv.config();

const tronProApiKey = process.env.TRON_PRO_API_KEY;
const privateKey = process.env.PRIVATE_KEY;
const tronRpcUrl = process.env.TRON_RPC_QN_URL;

const HttpProvider = TronWeb.providers.HttpProvider;
// const fullNode = new HttpProvider("https://api.trongrid.io");
// const solidityNode = new HttpProvider("https://api.trongrid.io");
// const eventServer = new HttpProvider("https://api.trongrid.io");
const fullNode = new HttpProvider(tronRpcUrl);
const solidityNode = new HttpProvider(tronRpcUrl);
const eventServer = new HttpProvider(tronRpcUrl);
const tronWeb = new TronWeb(fullNode, solidityNode, eventServer, privateKey);
tronWeb.setHeader({ "TRON-PRO-API-KEY": tronProApiKey });

// const tronWeb = new TronWeb({
//     fullHost: 'https://api.trongrid.io',
//     // fullHost: tronRpcUrl,
//     headers: { 'TRON-PRO-API-KEY': tronProApiKey },
//     privateKey: privateKey,
// });

const db = new sqlite3.Database('tronData.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Database opened');
    }
});

db.run(`
  CREATE TABLE IF NOT EXISTS transaction_data (
    blockHash TEXT,
    blockNumber INTEGER,
    fromAddress TEXT,
    gas INTEGER,
    gasPrice INTEGER,
    hash TEXT,
    input TEXT,
    nonce INTEGER,
    timestamp INTEGER,
    toAddress TEXT,
    transactionIndex INTEGER,
    value TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS block_data (
    blockHash TEXT PRIMARY KEY,
    parentHash TEXT,
    blockNumber INTEGER,
    timestamp INTEGER,
    witnessAddress TEXT,
    baseFeePerEnergy INTEGER,
    difficulty TEXT,
    size INTEGER,
    transactions TEXT,
    version INTEGER,
    witnessSignature TEXT
  )
`);

console.log('Tables created');

async function listenToBlocks() {
    try {
        console.log(await tronWeb.trx.getCurrentBlock());
        let latestBlockHeight = await tronWeb.trx.getCurrentBlock();
        console.log("latestBlockHeight:===", latestBlockHeight)
        let latestBlockNumber = await latestBlockHeight.block_header.raw_data.number;
        console.log("latestBlockNumber:===", latestBlockNumber)

        while (true) {
            try {
                const block = await tronWeb.trx.getBlock(latestBlockNumber, false);
                console.log("block.blockID:===", block.blockID);
                // Process block and transactions
                console.log("blockHash:", block.blockID, "\n",
                    "parentHash:", block.block_header.raw_data.parentHash, "\n",
                    "blockNumber:", block.block_header.raw_data.number, "\n",
                    "timestamp:", block.block_header.raw_data.timestamp, "\n",
                    "witnessAddress:", block.block_header.raw_data.witness_address, "\n",
                    // "baseFeePerEnergy:", block.block_header.raw_data.base_fee_per_energy,"\n",
                    // "difficulty:", block.block_header.raw_data.difficulty,"\n",
                    // "size:", block.block_header.raw_data.size,"\n",
                    "transactions:", block.transactions.map(tx => tx.txID).join(','),
                    "version:", block.block_header.raw_data.version, "\n",
                    "witnessSignature:", block.block_header.witness_signature,)


                const blockData = {
                    blockHash: block.blockID,
                    parentHash: block.block_header.raw_data.parentHash,
                    blockNumber: block.block_header.raw_data.number,
                    timestamp: block.block_header.raw_data.timestamp,
                    witnessAddress: block.block_header.raw_data.witness_address,
                    baseFeePerEnergy: block.block_header.raw_data.base_fee_per_energy,
                    difficulty: block.block_header.raw_data.difficulty,
                    size: block.block_header.raw_data.size,
                    transactions: block.transactions.map(tx => tx.txID).join(','),
                    version: block.block_header.raw_data.version,
                    witnessSignature: block.block_header.witness_signature,
                };

                const blockInsertSql = `
                    INSERT INTO block_data VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.run(blockInsertSql, [
                    blockData.blockHash,
                    blockData.parentHash,
                    blockData.blockNumber,
                    blockData.timestamp,
                    blockData.witnessAddress,
                    // blockData.baseFeePerEnergy,
                    // blockData.difficulty,
                    // blockData.size,
                    blockData.transactions.txID,
                    blockData.version,
                    blockData.witnessSignature,
                ]);

                // console.log("block.transactions.txID:===", block.transactions.txID)
                for (const txs of block.transactions) {
                    console.log("txs:===", txs.txID)
                    const tx = await tronWeb.trx.getTransaction(txs.txID);
                    console.log("tx:===", tx)
                    console.log("blockHash:", tx.blockID, "\n",
                        "blockNumber:", tx.raw_data.ref_block_bytes, "\n",
                        "fromAddress:", tx.raw_data.contract[0].parameter.value.owner_address, "\n",
                        "gas:", tx.raw_data.contract[0].parameter.value.fee_limit, "\n",
                        "gasPrice:", tx.raw_data.contract[0].parameter.value.call_value, "\n",
                        "hash:", tx.txID, "\n",
                        "input:", tx.raw_data.contract[0].parameter.value.data, "\n",
                        "nonce:", tx.raw_data.contract[0].parameter.value.nonce, "\n",
                        "timestamp:", tx.raw_data.timestamp, "\n",
                        "toAddress:", tx.raw_data.contract[0].parameter.value.contract_address, "\n",
                        "transactionIndex:", tx.raw_data.contract[0].parameter.value.call_token_value, "\n",
                        "value:", tx.raw_data.contract[0].parameter.value.call_token_value,)


                    const transactionData = {
                        blockHash: tx.blockID,
                        // blockNumber: tx.raw_data.ref_block_bytes,
                        fromAddress: tx.raw_data.contract[0].parameter.value.owner_address,
                        gas: tx.raw_data.contract[0].parameter.value.fee_limit,
                        gasPrice: tx.raw_data.contract[0].parameter.value.call_value,
                        hash: tx.txID,
                        input: tx.raw_data.contract[0].parameter.value.data,
                        nonce: tx.raw_data.contract[0].parameter.value.nonce,
                        timestamp: tx.raw_data.timestamp,
                        toAddress: tx.raw_data.contract[0].parameter.value.contract_address,
                        transactionIndex: tx.raw_data.contract[0].parameter.value.call_token_value,
                        value: tx.raw_data.contract[0].parameter.value.call_token_value,
                    };

                    const txInsertSql = `
                        INSERT INTO transaction_data VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    db.run(txInsertSql, [
                        transactionData.blockHash,
                        transactionData.blockNumber,
                        transactionData.fromAddress,
                        transactionData.gas,
                        transactionData.gasPrice,
                        transactionData.hash,
                        transactionData.input,
                        transactionData.nonce,
                        transactionData.timestamp,
                        transactionData.toAddress,
                        transactionData.transactionIndex,
                        transactionData.value,
                    ]);
                }

                console.log(`Block ${latestBlockNumber} processed`);
            } catch (e) {
                console.error(`Error processing block ${latestBlockNumber}:`, e);
            }

            latestBlockNumber++;

            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds before checking the next block
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        db.close();
    }
}

async function main() {
    await listenToBlocks();
}

main();
