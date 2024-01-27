// create a socket to port 8080 on the server
const socket = new WebSocket("ws://localhost:8080/master");

socket.onmessage = (event) => {
    console.log(event.data);
  };

/*socket.on('message', function (data) {
    message = JSON.parse(data);
    if (data["id"]=="joined") {
    console.log(data);
    //add a child to an element
    var node = document.querySelector("#connected clients");
    var textnode = document.createTextNode(data);
    //set the id of the node
    node.setAttribute("id", data);
    node.appendChild(textnode);
    }
    if (data["id"]=="left") {
        console.log(data);
        //add a child to an element
        var node = document.querySelector("#connectedclients");
        var textnode = document.createTextNode(data);
        //set the id of the node
        node.setAttribute("id", data);
        node.appendChild(textnode);
    }
    if (data["id"]=="epochnumber") {
        console.log(data);
        var node = document.querySelector("#epochnumber");
        node.innerHTML = parseInt(node.innerHTML) + 1;
    }
    if (data["id"]=="bestaccuracy") {
        console.log(data);
        var node = document.querySelector("#bestaccuracy");
        node.innerHTML = data["peepeepoopoo"];
    }
}
);


*/