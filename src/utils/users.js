// Bu sınıfta kullanıcıların odaya girip/çıkma durumları kontrol edilecek. addUser, removeUser, getUser, getUsersInRoom
const users = [];

const addUser = ({id, username, room}) => {
    // öncelikle verileri sadeleştirelim. Yani hepsini küçük harflere çevirip, boşluk varsa temizleyelim
    username = username.trim().toLowerCase();
    room = room.trim().toLowerCase();

    // kullanıcı adı ve oda adı girilmiş mi kontrol edeliyor
    if(!username || !room){
        return {
            error: "Username and room are required!"
        }
    }

    // aynı ada sahip bir kullanıcı var mı kontrol edeliyor
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username;
        // user.room = room ve user.username === username aynıysa true dönecek
    })

    // Validate username
    if(existingUser){
        return{
            error: "Username is in use!"
        }
    }
    
    // kullanıcıyı kaydet
    const user = {id, room, username};
    users.push(user);
    return user;
}


const removeUser = (id) => {
    const index = users.findIndex(user => user.id === id);

    if(index !== -1){
        return users.splice(index, 1)[0];   //splice metodu bir array döner. Dolaysıyla [0] yapmak bu arrayden bir elemanı almaktır.s
    }
}

const getUser = (id) => {
    return users.find((user) => {
        return user.id === id;
    }) 

}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase();
    return users.filter((user) =>  user.room === room)
    
}


module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}


