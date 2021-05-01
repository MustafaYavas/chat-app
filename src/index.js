const express = require("express");
const path = require("path");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");
const {generateMessage, generateLocationMessage} = require("./utils/messages");
const {addUser, removeUser, getUser, getUsersInRoom} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);    // server tarafında socket.io'yu kullanabilmek için. client tarafında kullanmak için client tarafında bir daha yüklemek gerek

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath));


// Buradaki socket parametresi socket.io sunucusundan gelir. Client tarafından bir bağlantı kurulduğunda 
// "connection" eventi, socket serverı tarafından yayınlanır ve bu bağlantı argüman olarak iletilir.
io.on("connection", (socket) => {   // her yeni bağlantıda bu metod çalışacak
    console.log("New WebSocket connected");    

    socket.on("join", (options, cb) => {
        const {error, user} = addUser({id: socket.id, ...options})

        if(error){
            return cb(error);
        }

        socket.join(options.room);

        socket.emit("message", generateMessage("Admin", "Welcome!"));
        socket.broadcast.to(options.room).emit("message", generateMessage("Admin", `${options.username} has joined`));
        io.to(options.room).emit("roomData", {
            room: options.room,
            users: getUsersInRoom(options.room)
        })

        cb();
    })

    socket.on("sendMessage", (message, cb) => {
        const user = getUser(socket.id); //user yerine destructuring kullanabilirdik. Yani const {room} = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(message)){
            return cb("Profanity is not allowed")
        }

        io.to(user.room).emit("message", generateMessage(user.username, message));
        
        cb();
    })


    socket.on("sendLocation", (coords, cb) => {
        const user = getUser(socket.id);    //user yerine destructuring kullanabilirdik. Yani const {room} = getUser(socket.id);
        io.to(user.room).emit("locationMessage", generateLocationMessage(user.username,`https://google.com/maps?q=${coords.lat},${coords.lon}`));
        cb();
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        
        if(user) {
            io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left!`));
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }

    })

})

// Özet;
// server (emit) --> client receive - countUpdated
// client (emit) --> server receive - increment
// server, countUpdated adındaki eventi yayar ve client tarafı bu eventi alır. Daha sonra client tarafı da bir event yayar
// ve bu defa server tarafı bu eventi alır
// socket.on() --> karşılıklı olarak gelen eventleri almak için kullanılır
// socket.emit() --> karşılıklı olarak event göndermek için kullanılır. 
//                   Bu metod server tarafından kullanıldığında sadece bir ilgili client'a eventi iletir
//io.emit() --> Bu metod kullanıldığında ise oluşturulan event diğer TÜM mevcut olan bağlantılara iletilir.


server.listen(port, () =>{
    console.log(`Server is up on port ${port}!`);
})