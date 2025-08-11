const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authenticator.middleware.js');
const {createProduct,getProduct,editProduct} = require('../controllers/project.controller.js')

router.post('/projects', verifyToken,createProduct );
router.get('/projects', verifyToken,getProduct);
router.put('/projects/:id', verifyToken,editProduct );

module.exports = router;
