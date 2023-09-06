const fs = require('fs');

const inputFilePath = 'tronData.json'; // Replace with your input file path
const outputFilePath = 'valid.json'; // Replace with the desired output file path

try {
    const inputData = fs.readFileSync(inputFilePath, 'utf8');
    const validData = inputData.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');

    fs.writeFileSync(outputFilePath, validData, 'utf8');
    console.log('Keys surrounded by double quotes. Output written to valid.json');
} catch (error) {
    console.error('Error:', error.message);
}
