const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authenticator.middleware.js');
const {savePrompt,getPrompt,editPrompt,deletePrompt} = require('../controllers/prompt.controller.js')


router.post('/prompts', verifyToken,savePrompt );
  
router.get('/prompts', verifyToken,getPrompt);

router.put('/prompts/:id', verifyToken,editPrompt);

router.delete('/prompts/:id', verifyToken,deletePrompt);
module.exports = router;
