const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

exports.signup = (request, response, next) => {
    bcrypt.hash(request.body.password, 10)
     .then(hash => {
        const user = new User({
            email: request.body.email,
            password: hash
        });
        user.save()
         .then(() => response.status(201).json({ message: 'User created !' }))
         .catch(error => response.status(400).json({ error }));
     })
     .catch(error => response.status(500).json({ error }));
};

exports.login = (request, response, next) => {
    User.findOne({ email: request.body.email })
     .then(user => {
        if (user === null) {
            response.status(401).json({ message: 'Wrong user id and/or password' });
        } else {
            bcrypt.compare(request.body.password, user.password)
             .then(valid => {
                if (!valid) {
                    response.status(401).json({ message: 'Wrong user id and/or password' });
                } else {
                    response.status(200).json({ 
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            'RANDOM_TOKEN_SECRET',
                            { expiresIn: '24h' }
                        )
                    })
                }
             })
             .catch(error => response.status(400).json({ error }));
        }
     })
     .catch(error => response.status(500).json({ error }));
};