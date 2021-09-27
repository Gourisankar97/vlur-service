const { Images } = require("../ImageGalery/Images");

exports.composeGame = async (rounds) => {
    var game = [];
    var set = new Set([]);
    let n = Images.length;
    for(let i = 0; i < rounds; i++) {
        var level = [];
        for(let j = 0; j < 3; j++) {
            let rand = Math.floor(Math.random() * n);
            if(set.has(Images[rand])) {
                j--;
            }
            else {
                level.push(Images[rand]);
                set.add(Images[rand]);
            }
        }
        game.push(level);
    }

    if(game.length)
        return game;
}