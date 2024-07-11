const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const multer = require('../middlewares/multer-config');

const bookController = require('../controllers/books.controller');

router.get('/', bookController.getAllBooks);
router.post('/', auth, multer.upload, multer.compressImage, bookController.createBook);

router.get('/bestrating', bookController.getBestBooks);

router.get('/:id', bookController.getOneBook);
router.put('/:id', auth, multer.upload, multer.compressImage, bookController.editBook);
router.delete('/:id', auth, bookController.deleteBook);

router.post('/:id/rating', auth, bookController.createRating);

module.exports = router;
