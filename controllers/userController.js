const User = require('../models/User');

// Get User Profile
exports.getUserProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching user profile' });
  }
};

// Update User Availability
exports.updateUserAvailability = async (req, res) => {
  const { userId } = req.params;
  const { isAvailable } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { isAvailable },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User availability updated', user });
  } catch (error) {
    res.status(500).json({ error: 'Error updating availability' });
  }
};

// Search for users by Lexus ID
exports.searchUsers = async (req, res) => {
  const { query } = req.params;
  try {
    const users = await User.find({ lexusId: { $regex: query, $options: 'i' } }).select('lexusId _id');
    res.json(users); // Always return an array (empty if no match)
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// Fetch contacts for the current user
exports.getContacts = async (req, res) => {
  const { lexusId } = req.params;
  try {
    const user = await User.findOne({ lexusId }).populate('friends', 'lexusId email');
    res.json({ contacts: user.friends });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

exports.addFriend = async (req, res) => {
  const { friendId } = req.params;
  const lexusId = req.body.lexusId; // Assuming you're getting the lexusId from the request body

  try {
    // Find both users by their IDs
    const user = await User.findById(lexusId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: 'User or friend not found' });
    }

    // Check if the friend is already in the user's friend list
    if (user.friends.includes(friendId)) {
      return res.status(400).json({ error: 'Friend already added' });
    }

    // Add friend to the current user's friend list and vice versa
    user.friends.push(friendId);
    friend.friends.push(lexusId);
    
    await user.save();
    await friend.save();
    // console.log(lexusId, friendId);
    
    res.json({ message: 'Friend added successfully', friends: user.friends });
  } catch (error) {
    // console.log("error ayi from user controller", error, lexusId, friendId);
    
    console.error('Error adding friend:', error);
    res.status(500).json({ error: 'Failed to add friend' });
  }
};