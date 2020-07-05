const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const favoriteSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    dishes: [{
        type: Schema.Types.ObjectId,
        ref: 'Dish'
    }]
}, {
    timestamps: true
});

var Favorites = mongoose.model('Favorite', favoriteSchema);

module.exports = Favorites;