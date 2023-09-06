const TronWeb = require('tronweb');
const mongoose = require('mongoose');
require('dotenv').config();

const atlasConnectionString = process.env.ATLAS_CONNECTION_STRING;
const tronProApiKey = process.env.TRON_PRO_API_KEY;
const privateKey = process.env.PRIVATE_KEY;

// Configure TRON Web instance
const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { 'TRON-PRO-API-KEY': tronProApiKey },
    privateKey: privateKey,
});

// Define schemas and models
const blockSchema = new mongoose.Schema({
    blockHash: String,
    parentHash: String,
    blockHeight: Number,
    timeStamp: Number,
    baseFeePerGas: Number,
    difficulty: String,
    logsBloom: String,
    miner: String,
    mixHash: String,
    nonce: String,
    receiptsRoot: String,
    sha3Uncles: String,
    size: Number,
    stateRoot: String,
    totalDifficulty: String,
    transactionsRoot: String,
    uncles: [String],
    gasLimit: Number,
    gasUsed: Number,
    extraData: String,
    // Other block fields...
});

// Define schema for the Transaction model
const transactionSchema = new mongoose.Schema({
    blockHash: String,
    blockNumber: Number,
    fromAddress: String,
    toAddress: String,
    value: String,
    gas: Number,
    gasPrice: String,
    hash: String,
    input: String,
    maxFeePerGas: String,
    maxPriorityFeePerGas: String,
    nonce: Number,
    r: String,
    s: String,
    transactionIndex: Number,
    type: String,
    v: Number,
    // Other transaction fields...
});

const Block = mongoose.model('Block', blockSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

// Connect to MongoDB Atlas
(async () => {
    try {
        await mongoose.connect(atlasConnectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB Atlas');

        // Start listening to TRON blocks and storing data
        listenToBlocks();
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
})();

// Listen to TRON blocks and store data
async function listenToBlocks() {
    try {
        const latestBlockHeight = await tronWeb.trx.getCurrentBlock();
        const latestBlockNumber = parseInt(latestBlockHeight.block_header.raw_data.number);

        let blockNum = await Block.findOne().sort({ blockHeight: -1 });
        if (blockNum) {
            blockNum = blockNum.blockHeight + 1;
        } else {
            blockNum = 1;
        }

        while (blockNum <= latestBlockNumber) {
            const block = await tronWeb.trx.getBlock(blockNum);
            if (block) {
                // Create a new Block instance
                const blockData = new Block({
                    blockHash: block.blockID,
                    parentHash: block.block_header.raw_data.parentHash,
                    blockHeight: blockNum,
                    timeStamp: block.block_header.raw_data.timestamp,
                    baseFeePerGas: block.block_header.raw_data.baseFee,
                    difficulty: block.block_header.raw_data.number, // You might need to adjust this field
                    logsBloom: block.block_header.raw_data.logsBloom,
                    miner: block.block_header.raw_data.witness_address,
                    mixHash: block.block_header.raw_data.mixHash,
                    nonce: block.block_header.raw_data.nonce,
                    receiptsRoot: block.block_header.raw_data.receiptsRoot,
                    sha3Uncles: block.block_header.raw_data.sha3Uncles,
                    size: block.block_header.raw_data.size,
                    stateRoot: block.block_header.raw_data.stateRoot,
                    totalDifficulty: block.block_header.raw_data.totalDifficulty,
                    transactionsRoot: block.block_header.raw_data.transactionsRoot,
                    uncles: block.block_header.raw_data.parentHash, // Update with actual uncles data
                    gasLimit: block.block_header.raw_data.gasLimit,
                    gasUsed: block.block_header.raw_data.gasUsed,
                    extraData: block.block_header.raw_data.extraData,
                    // Other block fields...
                });

                // Save the block data
                await blockData.save();

                // Iterate through transactions and create instances

                if (Array.isArray(block.transactions)) {
                    for (const txnHash of block.transactions) {
                        const txn = await tronWeb.trx.getTransaction(txnHash);
                        // ... (transaction data initialization)
                        const transactionData = new Transaction({
                            blockHash: txn.txID,
                            blockNumber: blockNum,
                            fromAddress: txn.raw_data.contract[0].parameter.value.owner_address,
                            toAddress: txn.raw_data.contract[0].parameter.value.to_address,
                            // value: new mongoose.Types.Decimal128(txn.raw_data.contract[0].parameter.value.amount),
                            value: txn.raw_data.contract[0].parameter.value.amount,
                            gas: txn.raw_data.contract[0].parameter.value.data?.call_value || 0,
                            gasPrice: txn.raw_data.contract[0].parameter.value.data?.price || '0',
                            hash: txn.txID,
                            input: txn.raw_data.contract[0].parameter.value.data?.data || '',
                            maxFeePerGas: txn.raw_data.fee_limit,
                            maxPriorityFeePerGas: '0', // Adjust based on available data
                            nonce: txn.raw_data.contract[0].parameter.value.data?.nonce || 0,
                            r: txn.signature[0],
                            s: txn.signature[1],
                            transactionIndex: 0, // This may not be available
                            type: 'normal', // Adjust based on available data
                            v: parseInt(txn.signature[2], 16), // Convert hexadecimal to decimal
                            // Other transaction fields...
                        });

                        // Save the transaction data
                        await transactionData.save();
                    }
                } else if (typeof block.transactions === 'string') {
                    const txnHash = block.transactions;
                    const txn = await tronWeb.trx.getTransaction(txnHash);
                    // ... (transaction data initialization)
                    const transactionData = new Transaction({
                        blockHash: txn.txID,
                        blockNumber: blockNum,
                        fromAddress: txn.raw_data.contract[0].parameter.value.owner_address,
                        toAddress: txn.raw_data.contract[0].parameter.value.to_address,
                        // value: new mongoose.Types.Decimal128(txn.raw_data.contract[0].parameter.value.amount),
                        value: txn.raw_data.contract[0].parameter.value.amount,
                        gas: txn.raw_data.contract[0].parameter.value.data?.call_value || 0,
                        gasPrice: txn.raw_data.contract[0].parameter.value.data?.price || '0',
                        hash: txn.txID,
                        input: txn.raw_data.contract[0].parameter.value.data?.data || '',
                        maxFeePerGas: txn.raw_data.fee_limit,
                        maxPriorityFeePerGas: '0', // Adjust based on available data
                        nonce: txn.raw_data.contract[0].parameter.value.data?.nonce || 0,
                        r: txn.signature[0],
                        s: txn.signature[1],
                        transactionIndex: 0, // This may not be available
                        type: 'normal', // Adjust based on available data
                        v: parseInt(txn.signature[2], 16), // Convert hexadecimal to decimal
                        // Other transaction fields...
                    });

                    // Save the transaction data
                    await transactionData.save();
                }

            }
            blockNum++;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
