const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors'); // Import the cors middleware

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// Helper function to read data from the file
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Helper function to write data to the file
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// API endpoint to get all items
app.get('/api/items', (req, res) => {
    const data = readData();
    res.json(data);
});

// API endpoint to get an item by ID
app.get('/api/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id, 10);
    const data = readData();
    const item = data.find(item => item.id === itemId);

    if (!item) {
        return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
});

// API endpoint to add a new item
app.post('/api/items', (req, res) => {
    const newItem = { id: Date.now(), ...req.body }; // Generate a unique ID
    const data = readData();
    data.push(newItem);
    writeData(data);
    res.status(201).json(newItem);
});

// API endpoint to update an item by ID
app.put('/api/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id, 10);
    const updatedItem = req.body;
    const data = readData();
    const itemIndex = data.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
        return res.status(404).json({ message: 'Item not found' });
    }

    data[itemIndex] = { ...data[itemIndex], ...updatedItem };
    writeData(data);
    res.json(data[itemIndex]);
});

// API endpoint to delete an item by ID
app.delete('/api/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id, 10);
    const data = readData();
    const newData = data.filter(item => item.id !== itemId);

    if (newData.length === data.length) {
        return res.status(404).json({ message: 'Item not found' });
    }

    writeData(newData);
    res.status(204).send();
});

// API endpoint to delete all items
app.delete('/api/items', (req, res) => {
    writeData([]);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
