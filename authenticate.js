var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens

var User = require('./models/users');
var config = require('./config');
const { ExtractJwt } = require('passport-jwt');

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

exports.getToken = function(user) {
    return jwt.sign(user, config.secretKey, {
        expiresIn: 3600
    });
};

var opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
    console.log('JWT payload:', jwt_payload);
    User.findOne({
        _id: jwt_payload._id
    }, (err, user) => {
        if (err) {
            done(err);
        } else if (user) {
            done(null, user);
        } else {
            done(null);
        }
    });
}));

exports.verifyUser = passport.authenticate('jwt', {
    session: false
});

exports.notAuthorizedError = (next) => {
    const err = new Error('You are not authorized to perform this operation!');
    err.status = 403;
    next(err);
};

exports.verifyAdmin = (req, res, next) => {
    if (req.user.admin) {
        next();
    } else {
        this.notAuthorizedError(next);
    }
};