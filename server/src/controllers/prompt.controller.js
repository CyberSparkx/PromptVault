const User = require('../models/user.model');
const Prompt = require('../models/prompt.model'); 
const { model } = require('mongoose');

const savePrompt = async (req, res) => {
    try {
      const { title, prompt, tags, projectId, isCommunity } = req.body;
      const userId = req.user.id; // set by verifyToken middleware
  
      if (!title || !prompt) {
        return res.status(400).json({ message: 'Title and prompt are required' });
      }
  
      // 1️⃣ Create the new prompt
      const newPrompt = await Prompt.create({
        title,
        prompt,
        tags: tags || [],
        isCommunity: Boolean(isCommunity),
        date: new Date()
      });
  
      // 2️⃣ Find the user
      const user = await User.findById(userId).populate('projects');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Add prompt to the user's prompts list
      user.prompts.push(newPrompt._id);
  
      // 3️⃣ If projectId provided, validate it belongs to the user
      if (projectId) {
        const project = user.projects.find(
          p => p._id.toString() === projectId.toString()
        );
  
        if (!project) {
          return res.status(400).json({ message: 'Project not found in your account' });
        }
  
        project.prompts.push(newPrompt._id);
        await project.save();
      }
  
      // 4️⃣ Save updated user
      await user.save();
  
      // 5️⃣ Respond
      res.status(201).json({
        message: 'Prompt created successfully',
        prompt: newPrompt
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server not responding' });
    }
  }

const getPrompt = async (req, res) => {
    try {
      const userId = req.user.id;
  
      const user = await User.findById(userId).populate('prompts');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        prompts: user.prompts
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server not responding' });
    }
  }

const editPrompt =async (req, res) => {
    try {
      const { title, prompt, tags, isCommunity } = req.body;
      const userId = req.user.id;
      const promptId = req.params.id;
  
      // Ensure the prompt belongs to the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (!user.prompts.includes(promptId)) {
        return res.status(403).json({ message: 'Not authorized to update this prompt' });
      }
  
      // Update the prompt
      const updatedPrompt = await Prompt.findByIdAndUpdate(
        promptId,
        {
          ...(title && { title }),
          ...(prompt && { prompt }),
          ...(tags && { tags }),
          ...(typeof isCommunity === 'boolean' && { isCommunity })
        },
        { new: true }
      );
  
      if (!updatedPrompt) {
        return res.status(404).json({ message: 'Prompt not found' });
      }
  
      res.status(200).json({
        message: 'Prompt updated successfully',
        prompt: updatedPrompt
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server not responding' });
    }
  }

const deletePrompt =  async (req, res) => {
    try {
      const promptId = req.params.id;
      const userId = req.user.id;
  
      // Find the prompt
      const prompt = await Prompt.findById(promptId);
      if (!prompt) {
        return res.status(404).json({ message: 'Prompt not found' });
      }
  
      // Remove from user prompts
      const user = await User.findById(userId).populate('projects');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.prompts = user.prompts.filter(id => id.toString() !== promptId);
  
      // Remove from project prompts
      user.projects.forEach(project => {
        project.prompts = project.prompts.filter(id => id.toString() !== promptId);
      });
  
      // Save user & projects
      await Promise.all([
        user.save(),
        ...user.projects.map(p => p.save())
      ]);
  
      // Delete the prompt itself
      await Prompt.findByIdAndDelete(promptId);
  
      res.status(200).json({ message: 'Prompt deleted successfully' });
  
    } catch (error) {
      console.error('Error deleting prompt:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

module.exports={savePrompt,getPrompt,editPrompt,deletePrompt}