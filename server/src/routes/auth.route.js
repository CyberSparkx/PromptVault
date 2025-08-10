const express = require('express');
const router = express.Router();
const {registerController,loginWithToken} = require('../controllers/auth.controller.js')
const verifyToken = require('../middleware/authenticator.middleware.js');

router.post('/register', registerController);
router.get('/login',verifyToken, loginWithToken);


module.exports = {
    registerRoute: router,
    loginRoute: router
  };
