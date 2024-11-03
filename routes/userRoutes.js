const express = require('express');
const { getUserProfile, updateUserAvailability } = require('../controllers/userController');
const User = require('../models/User'); // Import the User model
const verifyJWT  = require('../utils/authMiddleware');
const { login } = require('../controllers/authController');
const router = express.Router();
const mongoose = require('mongoose');

// Get User Profile by lexusId
router.get('/:lexusId', async (req, res) => {
  const { lexusId } = req.params;
  try {
    const user = await User.findOne({ lexusId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update Availability by lexusId
router.patch('/:lexusId/availability', async (req, res) => {
  const { lexusId } = req.params;
  const { isAvailable } = req.body;
  try {
    const user = await User.findOneAndUpdate({ lexusId }, { isAvailable }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// Add a friend to the current user's list by searching for friend using lexusId
router.post('/add-friend/:friendId', verifyJWT, async (req, res) => {
  const { friendId } = req.params; // Expecting friendId in the request body
  const lexusId = req.user.lexusId; // Get user lexusId from JWT
  console.log("Request from user route:", friendId, lexusId);
  
  // Validate that friendId is provided
  if (!friendId) {
    console.log("Friend ID is required");
    return res.status(400).json({ error: 'Friend ID is required' });
  }

  try {
    // Find the current user by lexusId
    const user = await User.findOne({ lexusId });
    // console.log("User:", user);
    
    // Find the friend by lexusId (friendId)
    const friend = await User.findOne({ lexusId: friendId });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ error: 'User not found' });
    }
    if (!friend) {
      console.log("Friend not found");
      return res.status(404).json({ error: 'Friend not found' });
    }

    // Check if the friend is already in the user's friend list
    if (user.friends.includes(friendId)) { // Check using lexusId
      console.log("Friend already added");
      return res.status(400).json({ error: 'Friend already added' });
    }

    // Add friend to current user's friend list using lexusId
    user.friends.push(friendId); // Use friendId (lexusId) directly
    await user.save(); // Only save the user

    // Return the updated friend list
    const updatedFriendList = await User.findOne({ lexusId }).select('friends lexusId email');
    res.json({ friends: updatedFriendList.friends }); 
  } catch (error) {
    console.log("Error in user route add friend:", error);
    res.status(500).json({ error: 'Failed to add friend' });
  }
});

// Search for users by lexusId
router.get('/search/:query', async (req, res) => {
  const { query } = req.params;
  try {
    const users = await User.find({ lexusId: { $regex: query, $options: 'i' } })
      .select('lexusId'); // Select lexusId
    res.json(users); // Always return an array (empty if no match)
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Search failed' }); // Send error response
  }
});

// Fetch contacts for the current user by lexusId
router.get('/contacts/:lexusId', async (req, res) => {
  const { lexusId } = req.params;
  // console.log("Request params:", req.params);
  
  try {
    // Find the user by lexusId
    const user = await User.findOne({ lexusId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find friends using their lexusId
    const friends = await User.find({ lexusId: { $in: user.friends } }, 'lexusId email');
    
    res.json({ contacts: friends });
    
  } catch (error) {
    console.log('Error fetching contacts:', error);
    res.status(500).json({ error: 'Error fetching contacts' });
  }
});

module.exports = router;
