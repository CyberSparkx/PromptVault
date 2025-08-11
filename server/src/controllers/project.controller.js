const Project = require('../models/project.model.js');
const User = require('../models/user.model.js');


const createProduct = async (req, res) => {
    try {
      const { projectname } = req.body;
      const userId = req.user.id; 
  
      if (!projectname) {
        return res.status(400).json({ message: 'Project name is required' });
      }
  
      const newProject = await Project.create({
        projectname,
        prompts: [] // default empty
      });
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      user.projects.push(newProject._id);
      await user.save();
  
      res.status(201).json({
        message: 'Project created successfully',
        project: newProject
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server not responding' });
    }
  }
const  getProduct =  async (req, res) => {
    try {
      const userId = req.user.id;
  
      const user = await User.findById(userId).populate('projects');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        projects: user.projects
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server not responding' });
    }
  } 
const editProduct = async (req, res) => {
    try {
      const { projectname } = req.body;
      const userId = req.user.id;
      const projectId = req.params.id;
  
      if (!projectname) {
        return res.status(400).json({ message: 'Project name is required' });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Ensure project belongs to user
      if (!user.projects.includes(projectId)) {
        return res.status(403).json({ message: 'Not authorized to update this project' });
      }
  
      const updatedProject = await Project.findByIdAndUpdate(
        projectId,
        { projectname },
        { new: true }
      );
  
      if (!updatedProject) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      res.status(200).json({
        message: 'Project updated successfully',
        project: updatedProject
      });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server not responding' });
    }
  }

module.exports = {createProduct,getProduct,editProduct}
