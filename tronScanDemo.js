// // const fetch = require('node-fetch');
// // const dotenv = require('dotenv');

// import fetch from 'node-fetch';
// import dotenv from 'dotenv';

// dotenv.config();

// const tronProApiKey = process.env.TRON_PRO_API_KEY;
// const endpoint = 'https://apilist.tronscanapi.com/api/';

// fetch(endpoint, {
//     headers: {
//         'TRON-PRO-API-KEY': tronProApiKey
//     }
// })
//     .then(response => {
//         console.log('Response Headers:', response.headers);
//         return response.json();
//     })
//     .then(data => console.log(data))
//     .catch(error => console.error(error));



// import fetch from 'node-fetch';
// import dotenv from 'dotenv';

// dotenv.config();

// const tronProApiKey = process.env.TRON_PRO_API_KEY;
// console.log(tronProApiKey)
// const endpoint = 'https://apilist.tronscanapi.com/api/';

// const processStreamedJson = async (response) => {
//     const reader = response.body.getReader();
//     let chunks = [];

//     while (true) {
//         const { done, value } = await reader.read();
//         if (done) break;
//         chunks.push(value);
//     }

//     const jsonData = JSON.parse(new TextDecoder().decode(Uint8Array.concat(chunks)));
//     console.log(jsonData);
// };

// fetch(endpoint, {
//     headers: {
//         'TRON-PRO-API-KEY': tronProApiKey
//     }
// })
//     .then(response => {
//         console.log('Response Headers:', response.headers);
//         return response.text(); // Get the raw response content
//     })
//     .then(data => console.log(data))
//     .catch(error => console.error(error));


import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const tronProApiKey = process.env.TRON_SCAN_API_KEY;
const endpoint = 'https://apilist.tronscanapi.com/api/block';

fetch(endpoint, {
    headers: {
        'TRON-PRO-API-KEY': tronProApiKey
    }
})
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error(error));

