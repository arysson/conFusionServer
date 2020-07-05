const express = require('express');
const bodyParser = require('body-parser');
const assert = require('assert');

const Favorite = require('../models/favorites');
const cors = require('./cors');

var authenticate = require('../authenticate');
const Favorites = require('../models/favorites');

const success = (res, obj) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(obj);
};

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/').options(cors.corsWithOptions, (req, res) => res.sendStatus(200)).get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({
        user: req.user._id
    }).populate(['user', 'dishes']).then(favorites => {
        assert(favorites.length <= 1);
        success(res, favorites.length ? favorites[0] : null);
    }).catch(err => next(err));
}).post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({
        user: req.user._id
    }).then(favorites => {
        assert(favorites.length <= 1);
        const favorite = favorites.length ? favorites[0] : new Favorite({
            user: req.user._id
        });
        favorite.dishes = [... new Set([... favorite.dishes.map(dish => dish.toString()), ... req.body.map(dish => dish._id)])];
        favorite.save().then(favorite => success(res, favorite)).catch(err => next(err));
    }).catch(err => next(err));
}).put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites');
}).delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({
        user: req.user._id
    }).then(favorites => {
        assert(favorites.length <= 1);
        if (!favorites.length) {
            return success(res, null);
        }
        const favorite = favorites[0];
        favorite.remove().then(() => success(res, favorite)).catch(err => next(err));
    }).catch(err => next(err));
});

favoriteRouter.route('/:dishId').options(cors.corsWithOptions, (req, res) => res.sendStatus(200)).get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favorites.findOne({
        user: req.user._id
    }).then(favorites => {
        if (!favorites) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                exists: false,
                favorites: favorites
            });
        } else {
            if (favorites.dishes.indexOf(req.params.dishId) < 0) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    exists: false,
                    favorites: favorites
                });
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    exists: true,
                    favorites: favorites
                });
            }
        }
    }, err => next(err)).catch(err => next(err));
}).post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({
        user: req.user._id
    }).then(favorites => {
        assert(favorites.length <= 1);
        const favorite = favorites.length ? favorites[0] : new Favorite({
            user: req.user._id
        });
        if (!favorite.dishes.includes(req.params.dishId)) {
            favorite.dishes.push(req.params.dishId);
        }
        favorite.save().then(favorite => success(res, favorite)).catch(err => next(err));
    }).catch(err => next(err));
}).put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favorites/' + req.params.dishId);
}).delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favorite.find({
        user: req.user._id
    }).populate('dishes').then(favorites => {
        assert(favorites.length <= 1);
        if (favorites.length) {
            const favorite = favorites[0];
            var removed = 0;
            for (var i = favorite.dishes.length - 1; i >= 0; i--) {
                if (favorite.dishes[i].equals(req.params.dishId)) {
                    favorite.dishes.splice(i, 1);
                    removed++;
                }
            }
            assert(removed <= 1);
            favorite.save().then(favorite => success(res, favorite)).catch(err => next(err));
        } else {
            success(res, null);
        }
    }).catch(err => next(err));
});

module.exports = favoriteRouter;