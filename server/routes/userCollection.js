const express = require('express');
const router = express.Router();
const UserCollection = require('../models/UserCollection');

// Get the user's collection
// This route is fine as is, it fetches the whole document.
// If the collection grows extremely large, you might consider pagination here.
router.get('/', async (req, res) => {
  try {
    let collection = await UserCollection.findOne();
    if (!collection) {
      // If no collection exists, create an empty one
      collection = new UserCollection({ cards: [] });
      await collection.save();
    }
    res.json({ collection: collection.cards });
  } catch (err) {
    console.error('Error fetching collection:', err); // Log the error for debugging
    res.status(500).json({ error: 'Failed to fetch collection.', details: err.message });
  }
});

// Add a card to the collection
// Uses $push to efficiently add to the array without fetching the whole document
router.post('/add', async (req, res) => {
  try {
    const { card } = req.body;

    // Use findOneAndUpdate to find the collection and push the new card
    // { new: true } returns the modified document
    // { upsert: true } creates the document if it doesn't exist
    const updatedCollection = await UserCollection.findOneAndUpdate(
      {}, // Query for the single collection document (assuming only one)
      { $push: { cards: card } }, // Push the new card to the 'cards' array
      { new: true, upsert: true, runValidators: true } // Return updated doc, create if not exists, run schema validators
    );

    res.json({ collection: updatedCollection.cards });
  } catch (err) {
    console.error('Error adding card:', err); // Log the error for debugging
    res.status(500).json({ error: 'Failed to add card.', details: err.message });
  }
});

// Remove a card from the collection
// Uses $pull to efficiently remove from the array without fetching the whole document
router.post('/remove', async (req, res) => {
  try {
    const { cardId } = req.body;

    // Use $pull to remove elements from the 'cards' array that match the condition
    const updatedCollection = await UserCollection.findOneAndUpdate(
      {}, // Query for the single collection document
      { $pull: { 'cards': { id: cardId } } }, // Pull elements where 'id' matches cardId
      { new: true } // Return the modified document
    );

    res.json({ collection: updatedCollection ? updatedCollection.cards : [] });
  } catch (err) {
    console.error('Error removing card:', err); // Log the error for debugging
    res.status(500).json({ error: 'Failed to remove card.', details: err.message });
  }
});

// Add multiple cards to the collection (optimized)
// This uses a loop of individual updates for each card.
// For very large 'cards' arrays in the document, and 'cards' array in req.body,
// you might consider a bulkWrite operation, but this is a significant improvement.
router.post('/addMany', async (req, res) => {
  try {
    const { cards } = req.body; // Array of cards to add/update

    let collection = await UserCollection.findOne();
    if (!collection) {
      collection = new UserCollection({ cards: [] });
      await collection.save();
    }

    // Prepare a list of operations for bulkWrite
    const bulkOperations = [];

    cards.forEach(card => {
      // Check if the card already exists in the current collection
      const existingCardIndex = collection.cards.findIndex(c => c.id === card.id);

      if (existingCardIndex !== -1) {
        // If it exists, increment its count
        const currentCount = collection.cards[existingCardIndex].count || 1;
        bulkOperations.push({
          updateOne: {
            filter: { 'cards.id': card.id },
            update: { $set: { [`cards.${existingCardIndex}.count`]: currentCount + 1 } }
          }
        });
        // Also update the in-memory object to reflect changes for the final response
        collection.cards[existingCardIndex].count = currentCount + 1;
      } else {
        // If it doesn't exist, push a new card
        bulkOperations.push({
          updateOne: {
            filter: {}, // Target the single collection document
            update: { $push: { cards: { ...card, count: 1 } } }
          }
        });
        // Also update the in-memory object for the final response
        collection.cards.push({ ...card, count: 1 });
      }
    });

    // Execute bulk operations if any
    if (bulkOperations.length > 0) {
      await UserCollection.bulkWrite(bulkOperations);
    }
    
    // After all operations, fetch the latest state or return the modified in-memory object
    // For simplicity and to reflect the exact state after updates, re-fetch.
    // Alternatively, if collection.cards was updated reliably in the loop, you could return it.
    const updatedCollection = await UserCollection.findOne();
    res.json({ collection: updatedCollection.cards });

  } catch (err) {
    console.error('Error adding multiple cards:', err); // Log the error for debugging
    res.status(500).json({ error: 'Failed to add cards.', details: err.message });
  }
});


// Clear the collection
// Uses $set to efficiently clear the array without fetching the whole document
router.post('/clear', async (req, res) => {
  try {
    // Use findOneAndUpdate to find the collection and set the 'cards' array to empty
    const updatedCollection = await UserCollection.findOneAndUpdate(
      {}, // Query for the single collection document
      { $set: { cards: [] } }, // Set the 'cards' array to an empty array
      { new: true } // Return the modified document
    );

    res.json({ collection: updatedCollection ? updatedCollection.cards : [] });
  } catch (err) {
    console.error('Error clearing collection:', err); // Log the error for debugging
    res.status(500).json({ error: 'Failed to clear collection.', details: err.message });
  }
});

module.exports = router;