const fs = require('fs')
const Book = require('../models/Book');

/***********************************************************
 *     RETRIEVE ALL BOOKS
 ***********************************************************/
/**
 * 
 * @param {Object} request - The request object containing information about the HTTP request.
 * @param {Object} response - The response object used to send HTTP responses.
 * @param {Function} next - The next middleware function in the Express middleware chain.
 * @returns {Promise} A Promise representing the asynchronous operation.
 */
exports.getAllBooks = (request, response, next) => {
    Book.find()
     .then(books => response.status(200).json(books))
     .catch(error => response.status(400).json({ error }));
};

/***********************************************************
 *      MANAGE INDIVIDUAL BOOK
 ***********************************************************/
/**
 * Adds new book to the db.
 * 
 * @param {Object} request - The request object containing information about the HTTP request.
 * @param {Object} response - The response object used to send HTTP responses.
 * @param {Function} next - The next middleware function in the Express middleware chain.
 * @returns {Promise} A Promise representing the asynchronous operation.
 */
exports.createBook = (request, response, next) => {
    const bookObject = JSON.parse(request.body.book);
    const userId = request.auth.userId;
    const grade = bookObject.ratings[0].grade;

    const imageUrl = `${request.protocol}://${request.get('host')}/images/${request.file.filename}`;

    const book = new Book({
        userId: userId,
        title: bookObject.title,
        author: bookObject.author,
        year: bookObject.year,
        genre: bookObject.genre,
        imageUrl: imageUrl,
        ratings: [{ userId: userId, grade: grade }],
        averageRating: bookObject.averageRating
    });

    book.save()
     .then(() => {
         response.status(201).json({ message: 'Book saved !'});
     })
     .catch(error => {
         if (request.file) {
             fs.unlink(request.file.path, (err) => {
                 if (err) {
                     console.error("Error deleting image:", err);
                 }
                 console.log("Image deleted");
             });
         }
         response.status(400).json({ error });
     });
};

/**
 * Edit on book on its id.
 * 
 * @param {Object} request - The request object containing information about the HTTP request.
 * @param {Object} response - The response object used to send HTTP responses.
 * @param {Function} next - The next middleware function in the Express middleware chain.
 * @returns {Promise} A Promise representing the asynchronous operation.
 */
exports.editBook = (request, response, next) => {
    const bookObject = request.file ? {
        ...JSON.parse(request.body.book),
        imageUrl: `${request.protocol}://${request.get('host')}/images/${request.file.filename}`
    } : { ...request.body}; 
    delete bookObject._userid;

    Book.findOne({ _id: request.params.id })
     .then((book) => {
        if (book.userId != request.auth.userId) {
            response.status(403).json({ message: 'Unauthorized request' });
        } else {
            Book.updateOne({ _id: request.params.id }, { ...bookObject, _id: request.params.id })
            .then(() => response.status(200).json({ message: 'Book modified !' }))
            .catch(error => response.status(400).json({ error }));  
        }
     })
     .catch(error => response.status(400).json({ error })); 
};

/**
 * Delete one book on its id.
 * 
 * @param {Object} request - The request object containing information about the HTTP request.
 * @param {Object} response - The response object used to send HTTP responses.
 * @param {Function} next - The next middleware function in the Express middleware chain.
 * @returns {Promise} A Promise representing the asynchronous operation.
 */
exports.deleteBook = (request, response, next) => {
    Book.findOne({ _id: request.params.id })
     .then(book => {
        if (book.userId != request.auth.userId) {
            response.status(403).json({ message: 'Unauthorized request' });
        } else {
            const filename = book.imageUrl.split('/images')[1];
            fs.unlink(`images/${filename}`, () => {
                Book.deleteOne({ _id: request.params.id })
                 .then(() => response.status(200).json({ message: 'Book deleted !' }))
                 .catch(error => response.status(400).json({ error }));
            })
        }
     })
     .catch(error => response.status(500).json({ error }));
};

/**
 * Retrieves one book by its id
 * 
 * @param {Object} request - The request object containing information about the HTTP request.
 * @param {Object} response - The response object used to send HTTP responses.
 * @param {Function} next - The next middleware function in the Express middleware chain.
 * @returns {Promise} A Promise representing the asynchronous operation.
 */
exports.getOneBook = (request, response, next) => {
    Book.findOne({ _id: request.params.id })
     .then(book => response.status(200).json(book))
     .catch(error => response.status(404).json({ error }));
};

/***********************************************************
 *      RATING
 ***********************************************************/

/**
 * Retrieves the best-rated books.
 * 
 * @param {Object} request - The request object containing information about the HTTP request.
 * @param {Object} response - The response object used to send HTTP responses.
 * @param {Function} next - The next middleware function in the Express middleware chain.
 * @returns {Promise} A Promise representing the asynchronous operation.
 */
exports.getBestBooks = async (request, response, next) => {
    try {
        const books = await Book.find();
        
        books.sort((book1, book2) => {
            return book2.averageRating - book1.averageRating;
        });

        const bestBooks = books.slice(0, 3);

        return response.status(200).json( bestBooks );
    } catch (error) {
        return response.status(400).json({ error });
    }
};

/**
 * Creates a rating for a book.
 * I the user already rated this book, an error is returned.
 * 
 * @param {Object} request - The request object containing information about the HTTP request.
 * @param {Object} response - The response object used to send HTTP responses.
 * @param {Function} next - The next middleware function in the Express middleware chain.
 * @returns {Promise} A Promise representing the asynchronous operation.
 */
exports.createRating = async (request, response, next) => {
    try {
        const book = await Book.findOne({ _id: request.params.id });

        const userRating = book.ratings.find((rating) => rating.userId === request.body.userId);
        if (userRating) {
            return response.status(400).json({ message: 'You have already rated this book' });
        } else {
            const newRating = {
                userId: request.body.userId,
                grade: request.body.rating
            };
            book.ratings.push(newRating);

            let grades = [];
            for (const rating of book.ratings) {
                grades.push(rating.grade);
            }

            const totalRatings = grades.length;
            const sumOfRatings = grades.reduce((accumulator, rating) => accumulator + rating, 0);
            const averageRating = sumOfRatings / totalRatings;
            
            book.averageRating = averageRating;
            book.id = request.params.id;

            await book.save();
            return response.status(200).json( book );
        }
    } catch (error) {
        return response.status(400).json({ error: error.message });
    }
};