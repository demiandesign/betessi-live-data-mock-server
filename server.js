const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Function to generate a random price adjustment
function getRandomPriceAdjustment() {
    const min = -100; // Minimum price change
    const max = 100;  // Maximum price change
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to generate a random point adjustment
function getRandomPointAdjustment() {
    const min = -1.5; // Minimum point change
    const max = 1.5;  // Maximum point change
    return (Math.random() * (max - min) + min).toFixed(1);
}

// Function to generate a random score adjustment
function getRandomScoreAdjustment() {
    const min = 0; // Minimum score change
    const max = 3;  // Maximum score change
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to update odds in all odds files
function updateOdds() {
    const oddsInputDirectory = path.join(__dirname, 'data', '/input/odds');
    const oddsOutputDirectory = path.join(__dirname, 'data', '/output/odds');
    const files = fs.readdirSync(oddsInputDirectory);

    files.forEach(file => {
        const inputFilePath = path.join(oddsInputDirectory, file);
        const outputFilePath = path.join(oddsOutputDirectory, file);

        // Read the file
        fs.readFile(inputFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading file ${file}:`, err);
                return;
            }

            try {
                const jsonData = JSON.parse(data);

                // Ensure the jsonData is an array before proceeding
                if (!Array.isArray(jsonData)) {
                    console.error(`Unexpected data format in ${file}: Expected an array`);
                    return;
                }

                // Update odds
                jsonData.forEach(event => {
                    if (event.bookmakers) {
                        event.bookmakers.forEach(bookmaker => {
                            if (bookmaker.markets) {
                                bookmaker.markets.forEach(market => {
                                    if (market.outcomes) {
                                        market.outcomes.forEach(outcome => {
                                            outcome.price += getRandomPriceAdjustment();
                                            // Optionally update points if they exist
                                            if (outcome.point !== undefined) {
                                                outcome.point = parseFloat(outcome.point) + parseFloat(getRandomPointAdjustment());
                                            }
                                        });
                                    }
                                    market.last_update = new Date().toISOString();
                                });
                            }
                            bookmaker.last_update = new Date().toISOString();
                        });
                    }
                    event.last_update = new Date().toISOString();
                });

                // Write the updated data back to the file
                fs.writeFile(outputFilePath, JSON.stringify(jsonData, null, 2), 'utf8', err => {
                    if (err) {
                        console.error(`Error writing file ${file}:`, err);
                    } else {
                        console.log(`Odds updated in file ${file}`);
                    }
                });
            } catch (parseError) {
                console.error(`Error parsing JSON in file ${file}:`, parseError);
            }
        });
    });
}

// Function to update scores in all scores files
function updateScores() {
    const scoresInputDirectory = path.join(__dirname, 'data', '/input/scores');
    const oddsOutputDirectory = path.join(__dirname, 'data', '/output/scores');
    const files = fs.readdirSync(scoresInputDirectory);

    files.forEach(file => {
        const inputFilePath = path.join(scoresInputDirectory, file);
        const outputFilePath = path.join(oddsOutputDirectory, file);

        // Read the file
        fs.readFile(inputFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading file ${file}:`, err);
                return;
            }

            try {
                const jsonData = JSON.parse(data);

                // Ensure the jsonData is an array before proceeding
                if (!Array.isArray(jsonData)) {
                    console.error(`Unexpected data format in ${file}: Expected an array`);
                    return;
                }

                // Update scores
                jsonData.forEach(event => {
                    if (event.scores) {
                        event.scores.forEach(score => {
                            score.score = String(parseInt(score.score) + getRandomScoreAdjustment());
                        });
                    }
                    event.last_update = new Date().toISOString();
                });

                // Write the updated data back to the file
                fs.writeFile(outputFilePath, JSON.stringify(jsonData, null, 2), 'utf8', err => {
                    if (err) {
                        console.error(`Error writing file ${file}:`, err);
                    } else {
                        console.log(`Scores updated in file ${file}`);
                    }
                });
            } catch (parseError) {
                console.error(`Error parsing JSON in file ${file}:`, parseError);
            }
        });
    });
}

// Start updating odds and scores every five seconds
setInterval(updateOdds, 5000);
setInterval(updateScores, 5000);

// Route to serve odds JSON files
app.get('/sports/:sport_key/odds', (req, res) => {
    const sportKey = req.params.sport_key;
    const fileName = `${sportKey}_odds.json`;
    const filePath = path.join(__dirname, 'data', '/output/odds', fileName);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ error: 'File not found' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            res.status(500).json({ error: 'Error parsing JSON' });
        }
    });
});

// Route to serve scores JSON files
app.get('/sports/:sport_key/scores', (req, res) => {
    const sportKey = req.params.sport_key;
    const fileName = `${sportKey}_scores.json`;
    const filePath = path.join(__dirname, 'data', '/output/scores', fileName);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.status(404).json({ error: 'File not found' });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }

        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (parseError) {
            res.status(500).json({ error: 'Error parsing JSON' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
