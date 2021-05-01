const socket = io();    // server'a bağlanmak için. server ve client arasındaki event'leri alıp vermemize izin verir.

// Elements
const messageForm = document.querySelector("#form-message");
const inputMessageForm = messageForm.querySelector("input");
const btnMessageForm = messageForm.querySelector("button")
const btnSendLocation = document.querySelector("#btn-send-location");
const divMessage = document.querySelector("#messages");

// Templates
const templateMessage = document.querySelector("#template-message").innerHTML;
const templateMessageLocation = document.querySelector("#template-message-location").innerHTML;
const templateSidebar = document.querySelector("#template-sidebar").innerHTML;

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    // new message element
    const newMessage = divMessage.lastElementChild;

    // height of the new message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    // visible height
    const visibleHeight = divMessage.offsetHeight;

    // height of message container
    const containerHeight = divMessage.scrollHeight;

    // How far have I scrolled?
    const scrolledOffset = divMessage.scrollTop + visibleHeight;

    if(containerHeight - newMessageHeight <= scrolledOffset){
        divMessage.scrollTop = divMessage.scrollHeight;
    }
    
}

socket.on("message", (message) => {
    const html = Mustache.render(templateMessage, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("k:mm")
    });
    divMessage.insertAdjacentHTML("beforeend", html);
    autoscroll();
})

socket.on("locationMessage", (mapURL) => {
    const html = Mustache.render(templateMessageLocation, {
        username: mapURL.username,
        url: mapURL.url,
        createdAt: moment(mapURL.createdAt).format("k:mm")
    });
    divMessage.insertAdjacentHTML("beforeend", html);
    autoscroll();
})

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(templateSidebar, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html;
    autoscroll();
})

messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // disabled - mesaj gönderilene kadar btonu kullanılamaz hale getirir
    btnMessageForm.setAttribute("disabled", "disabled");
 
    const inputText = inputMessageForm.value;

    socket.emit("sendMessage", inputText, (error) => {
        btnMessageForm.removeAttribute("disabled");
        // enabled - mesaj gönderildikten sonra buton eski haline döner
        inputMessageForm.value = "";
        inputMessageForm.focus();   // mesaj gönderildikten sonra tekrar buraya odaklanmayı sağlar
        
        if(error) {
            return console.log(error);
        }
    });

})


btnSendLocation.addEventListener("click", () => {
    if(!navigator.geolocation)
        return alert("Geolocation is not supported by your browser");

    // butona bir kere bastıktan sonra konum gönderilene kadar buton devre dışı kalıyor
    btnSendLocation.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {
            lat: position.coords.latitude,
            lon: position.coords.longitude
        }, (status) => {
            // console.log(status); // konum paylaşımı başarılı ise "location shared!" mesajını yazdırır
            // konum gönderilden sonra buton tekrar kullanılabilir hale geliyor.
            btnSendLocation.removeAttribute("disabled");
        });
    })
})

socket.emit("join", {username, room}, (error) => {
    if(error){
        alert(error);
        location.href = "/"; 
    }
});