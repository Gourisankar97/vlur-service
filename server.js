
const { GameMap, openQueue, roundMap, composedGame, runningRooms } = require('./utils/Game/game');
const { generate } = require('./utils/IdGenerator/RoomIdGenerator');
const express = require('express');
const app = express();
const Server = require('http').createServer(app);
const io = require("socket.io")(Server);

const UUID =  require('uuid').v4;
const { composeGame } = require('./utils/Game/ComposeGame');
const cors = require('cors');
const { env } = require('./env');

app.use(cors({origin : '*'}));
app.use(express.json());


app.get('/clean', async (req, res) => {
    try {

        //clean everything that are not in running rooms and players cound = 0

        await GameMap.forEach((players, roomId) => {
            if(players.length === 0) {
                if(runningRooms.has(roomId)) {
                    runningRooms.delete(roomId);
                }
                if(players.length === 0) {
                    GameMap.delete(roomId);
                }
            }
        });


        await composedGame.forEach((game, roomId)=> {
            if(!GameMap.has(roomId)) {
                composedGame.delete(roomId);
            }
        })
        await roundMap.forEach((game, roomId)=> {
            if(!GameMap.has(roomId)) {
                roundMap.delete(roomId);
            }
        });

        res.status(200).send({info: 'Clean-up finished!'});
    }
    catch(e) {
        if(env === 'DEV')   console.log("ERROR /ROOM : " +e);
        res.status(500).send({error: e});
    }
});



app.get('/health', async (req, res) => {

    try{

        const used = await process.memoryUsage().heapUsed / 1024 / 1024;
        const ram = Math.round(used * 100) / 100 ;
        const RAM = `${Math.round(used * 100) / 100} MB`;

        const health =  {
                            ramUsage : RAM,
                            runningRooms: runningRooms.size,
                            openQueueSize: openQueue.length,
                            composedGameSize: composedGame.size,
                            gameMapSize: GameMap.size,
                            info: ram < 500 ? 'GOOD: Everything looks Good!' : 'WARNING : Ram usage alert!'
                        };
        res.status(200).send(health);
    }
    catch(e) {
        if(env === 'DEV')   console.log("ERROR /ROOM : " +e);
        res.status(500).send({error: e});
    }

});


app.post('/room', async (req, res) => {

        try{
            let roomId = await generate();
            let body = req.body;
            /*{
                username: '',
                playerId: '',
                avatar: ''
                score: ''
                isAdmin: boolean
            }*/
    
            const player = {
                name: body.name,
                playerId: await UUID(),
                avatar: body.avatar,
                score: 0,
                isAdmin: true
            };
            var players = [];
            players.push(player);
            GameMap.set(roomId,players);
    
            res.status(200).send({roomId: roomId, players: players});
        }
        catch(e) {
            if(env === 'DEV')   console.log("ERROR /ROOM : " +e);
            res.status(500).send({roomId: null, players: null});
        }

});


app.post('/room/:id', async (req, res) => {
        try {

            let roomId = req.params.id;
            let body = req.body;
    
            if(GameMap.has(roomId)) {
                const player = {
                    name: body.name,
                    playerId: await UUID(),
                    avatar: body.avatar,
                    score: 0,
                    isAdmin: false
                };
                var players = GameMap.get(roomId);
                players.push(player);
                GameMap.set(roomId, players);
    
                res.status(200).send(player);
            }
            else {
                res.status(404).send({message: 'INVALID ROOM'});
            }
        }
        catch(e) {
            if(env === 'DEV')   console.log("LOG : ERROR /room/:id : "+e);
            res.status(500).send({roomId: null, players: null});
        }
    });

app.post('/join-random', async (req, res) => {
        try {

            let body = req.body;
    
            const player = {
                name: body.name,
                playerId: await UUID(),
                avatar: body.avatar,
                score: 0,
                isAdmin: false
            };
    
            let size = openQueue.length;
            let roomToJoin = null;

            let fullQueues = [];
    
            await openQueue.some(async (roomId)=> {
                let room = GameMap.get(roomId);
                if(env === 'DEV')   console.log("ROOM : "+ roomId+"  : " +JSON.stringify(room));
                if(room && room.length > 0 && room.length < 12) {
                    roomToJoin = roomId;
                    return false;
                }
                else if(room && room.length === 12){

                    let ids = openQueue.shift();
                    fullQueues.push(ids);
                }
                else {
                    openQueue.shift();
                }
            });

            openQueue.concat(fullQueues);

    
            if(roomToJoin === null) {
                let roomId = await generate();
                let players = [];
                player.isAdmin = true;
                players.push(player);
                GameMap.set(roomId,players);
                openQueue.push(roomId);

                let game = await composeGame(5);

                composedGame.set(roomId, game);
                runningRooms.add(roomId);
                const hrtime = process.hrtime();
                let milliSeconds = parseInt(((hrtime[0] * 1e3) + (hrtime[1]) * 1e-6));
                let startTime = milliSeconds/1000;
                roundMap.set(roomId, {sup: 1, sub: 1, updateTime: startTime});

                res.status(200).send({roomId: roomId, player: player});
            }
            else {
                let players = GameMap.get(roomToJoin);
    
                players.push(player);
                GameMap.set(roomToJoin, players);
    
                res.status(200).send({roomId: roomToJoin, player: player});
            }
        }
        catch (e) {
            if(env === 'DEV')   console.log("LOG : ERROR /join-random : "+e);
            res.status(500).send({roomId: null, player: null});
        }
});





/*
*   express server programming above
*   socket programming below
*/

io.on('connection', function (socket) {
    socket.on('join', function (data) {    

        try {

        if(env === 'DEV')   console.log("JOINED");
        socket.join(data.roomId);
        socket.playerId = data.playerId;
        socket.roomId = data.roomId;

        const hrtime = process.hrtime();
        let milliSeconds = parseInt(((hrtime[0] * 1e3) + (hrtime[1]) * 1e-6));
        let currentTime = milliSeconds/1000;
        let round = roundMap.get(data.roomId);

        if(runningRooms.has(data.roomId)) {
            io.to(data.roomId).emit('join-room', {msg: 'YOU JOINED', players: GameMap.get(data.roomId), game: composedGame.get(data.roomId), currentRound: round, gameStarted: true, skipTime: Math.round(currentTime - round.updateTime) });
        }
        io.to(data.roomId).emit('join-room', {msg: 'YOU JOINED', players: GameMap.get(data.roomId), gameStarted: false});
        }
        catch (e) {
            if(env === 'DEV')   console.log("LOG : ERROR-SOCKET-JOIN  : "+e);
            io.to(data.roomId).emit('join-room', {msg: 'Unable to join', players: [] });
        }
   });

   socket.on('send', (data)=> {
       io.to(data.roomId).emit('message', {msg: data.msg});
   });

   socket.on('disconnect', async (data)=> {

        try {
            if(env === 'DEV')   console.log("DISCONNECT");

            if(socket.playerId && socket.roomId && GameMap.get(socket.roomId)) {
                if(env === 'DEV')   console.log("DISCONNECTED : "+socket.playerId);
            
                let players = GameMap.get(socket.roomId);
                let wasAdmin = false;
                await players.map((player)=>{
                    if(player.isAdmin && player.playerId === socket.playerId) {
                        wasAdmin = true;
                    }
                });

                players = await players.filter((player)=>{
                    if(player.playerId !== socket.playerId) {
                        return player;
                    }
                });

                if(wasAdmin) {
                    if(players.length) {
                        players[0].isAdmin = true;
                    }
                }                

                GameMap.set(socket.roomId, players);

                io.to(socket.roomId).emit('someone-disconnected', {players:players});

            }
        }
        catch (e) {
            if(env === 'DEV')   console.log("LOGGER : DISCONNECT : ERROR : "+ e);
        }
    });

    socket.on('game-start', async (data)=> {


        try {

            let rounds = data.rounds;
            let open = data.open;
            let roomId = data.roomId;
            const hrtime = process.hrtime();
            let milliSeconds = parseInt(((hrtime[0] * 1e3) + (hrtime[1]) * 1e-6));

            let startTime = milliSeconds/1000;

            if(open) {
                openQueue.push(roomId);
            }

            roundMap.set(roomId, {sup: 1, sub: 1, updateTime: startTime});
            let game = await composeGame(rounds);
            composedGame.set(roomId, game);
            runningRooms.add(roomId);
            io.to(roomId).emit('start-game', {start: true, game: game});
        }
        catch (e) {
            if(env === 'DEV')   console.log("LOGGER : GAME-START : ERROR : "+ e);
        }
    });

    socket.on('chat', (data)=> {

        try {
            io.to(data.roomId).emit('room-chat', {from:data.from, playerId:data.playerId, message:data.content});
        }
        catch (e) {
            if(env === 'DEV')   console.log("LOGGER : CHAT : ERROR : "+ e);
        }
    });


    socket.on('update-score', async (data) => {

        try {

            let roomId = data.roomId;
            let playerId = data.playerId;
            let point = data.points;

            // if(env === 'DEV')    console.log("points to be added : "+ point +" player-id "+playerId);

            let players = GameMap.get(roomId);
            // if(env === 'DEV')    console.log("players : "+ JSON.stringify(players));

            if(players)
                await players.map((player)=>{
                    if(player.playerId === playerId) {
                        player.score += point;
                        // if(env === 'DEV')    console.log("updated player : "+ JSON.stringify(player));
                    }
                });

            GameMap.set(roomId, players);
            io.to(roomId).emit('score', {players:players});
            
        }
        catch (e) {
            if(env === 'DEV')   console.log("LOGGER : UPDATE-SCORE : ERROR : "+ e);
        }

        
    });


    socket.on('join-random', async (data) => {

        try {

            socket.join(data.roomId);
            socket.playerId = data.playerId;
            socket.roomId = data.roomId;

            const hrtime = process.hrtime();
            let milliSeconds = parseInt(((hrtime[0] * 1e3) + (hrtime[1]) * 1e-6));
            let currentTime = milliSeconds/1000;
            let round = roundMap.get(data.roomId);
            let players = GameMap.get(data.roomId);
            let skipTime = round.sub === 1 ? Math.round( currentTime - round.updateTime)-2 : Math.round( currentTime - round.updateTime);
            if(skipTime < 0 || players.length === 1) {
                skipTime = 0;
            }

            io.to(data.roomId).emit('join-random', { players: players, game: composedGame.get(data.roomId), currentRound: round, skipTime: skipTime});
        }
        catch (e) {
            if(env === 'DEV')   console.log("LOGGER : JOIN-RANDOM : ERROR : "+ e);
        }

    });

    socket.on('update-round', async (data)=> {

        try {

            let roomId = data.roomId;
            let currentRound = data.currentRound;

            const hrtime = process.hrtime();
            let milliSeconds = parseInt(((hrtime[0] * 1e3) + (hrtime[1]) * 1e-6));

            let updateTime = milliSeconds/1000;

            let round = roundMap.get(roomId);
            if(round) {
                roundMap.set(roomId, {sup: currentRound.sup, sub: currentRound.sub, updateTime: updateTime });
            }

        }
        catch (e) {
            if(env === 'DEV')   console.log("LOGGER : UPDATE-ROUND : ERROR : "+ e);
        }


    })

 });


Server.listen(8888, ()=> console.log("Server up on : 8888"));