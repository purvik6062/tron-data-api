require('dotenv').config();
const TronWeb = require('tronweb');
const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';
const dbName = 'tron_data_db';

const private_key = process.env.PRIVATE_KEY;
const tron_pro_api_key = process.env.TRON_PRO_API_KEY;

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io',
    headers: { "TRON-PRO-API-KEY": tron_pro_api_key },
    privateKey: private_key
});

// Connect to MongoDB
MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, client) => {
    if (err) {
        console.error('Error connecting to MongoDB:', err);
        return;
    }

    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    const collection = db.collection('tron_blocks');

    try {
        // Get latest block number from the blockchain
        const latestBlockNumber = await tronWeb.trx.getCurrentBlock();

        // Get latest block data from the blockchain
        const latestBlockData = await tronWeb.trx.getBlock(latestBlockNumber);

        // Insert latest block data into MongoDB
        collection.insertOne(latestBlockData, (insertErr, result) => {
            if (insertErr) {
                console.error('Error inserting data:', insertErr);
            } else {
                console.log('Latest block data inserted:', result.insertedId);
            }

            client.close();
        });
    } catch (error) {
        console.error('Error retrieving latest block data:', error);
        client.close();
    }
});
