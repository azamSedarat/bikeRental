const amqplib = require('amqplib');
const requestType = process.argv.slice(2);
let username,bikeModel,rentTime;
if(requestType[0]==="list"){
    if(requestType[1]==="free"){
        bikeList("free");
    }
    else if(requestType[0]==="rented"){
        bikeList("rented");
    }
}
if(requestType[0]==="rent"){
    username = requestType[1];
    bikeModel =  requestType[2];
    rentTime = requestType[3];
    rent(username, bikeModel, rentTime);
}
if(requestType[0]==="return"){
    username = requestType[1];
    returnBike(username);
}


async function bikeList(listType) {
    try {
        const connection = await amqplib.connect('amqp://localhost');
        const ch = await connection.createChannel();
        const bikeQReply = await ch.assertQueue("", {exclusive: true})
        const queueName = 'rent_rpc';
        const correlationId = generateUuid();
        ch.consume(bikeQReply.queue, (msg) => {
            if(msg.properties.correlationId === correlationId){
                console.log(msg.content.toString())
            }
            setTimeout(() => {
                connection.close()
                process.exit(0)
            })
        },
        {noAck: true}
        )
        const temp = listType+"bikeList"
        ch.sendToQueue(queueName, Buffer.from(temp.toString()), {
            correlationId,
            replyTo: bikeQReply.queue
        })
    } catch (error) {
        throw error
    }
}

async function rent(username, bikeModel, rentTime) {
    try {
        const connection = await amqplib.connect('amqp://localhost');
        const ch = await connection.createChannel();
        const userQReply = await ch.assertQueue("", {exclusive: true})
        const bikeQReply = await ch.assertQueue("", {exclusive: true})
        const queueName = 'rent_rpc';
        const userCorrelationId = generateUuid();
        const bikeCorrelationId = generateUuid();
        ch.consume(userQReply.queue, (msg) => {
            if(msg.properties.correlationId === userCorrelationId){
                console.log(msg.content.toString());
                if(msg.content.toString()==="valid"){
                    ch.sendToQueue(queueName, Buffer.from([requestType[0],username,bikeModel,rentTime].toString()), {
                        correlationId: bikeCorrelationId,
                        replyTo: bikeQReply.queue
                    })
                }
                else{
                    console.log("this user  not exist");
                }
            }
                setTimeout(() => {
                    connection.close()
                    process.exit(0)
                })
        },
        {noAck: true}
        )
        ch.consume(bikeQReply.queue, (msg) => {
            if(msg.properties.correlationId === bikeCorrelationId){
                console.log(msg.content.toString());
            }
        },
        {noAck: true}
        )
        ch.sendToQueue(queueName, Buffer.from(username.toString()), {
            correlationId: userCorrelationId,
            replyTo: userQReply.queue
        })
    } catch (error) {
        throw error
    }
}

async function returnBike(username) {
    try {
        const connection = await amqplib.connect('amqp://localhost');
        const ch = await connection.createChannel();
        const userQReply = await ch.assertQueue("", {exclusive: true})
        const bikeQReply = await ch.assertQueue("", {exclusive: true})
        const queueName = 'rent_rpc';
        const userCorrelationId = generateUuid();
        const bikeCorrelationId = generateUuid();
        ch.consume(userQReply.queue, (msg) => {
            if(msg.properties.correlationId === userCorrelationId){
                if(msg.content.toString()==="valid"){
                    ch.sendToQueue(queueName, Buffer.from("valid".toString()), {
                        correlationId: bikeCorrelationId,
                        replyTo: bikeQReply.queue
                    })
                }
            }
                setTimeout(() => {
                    connection.close()
                    process.exit(0)
                })
        },
        {noAck: true}
        )
        ch.consume(bikeQReply.queue, (msg) => {
            if(msg.properties.correlationId === bikeCorrelationId){
                console.log(msg.content.toString());
            }
        },
        {noAck: true}
        )
        ch.sendToQueue(queueName, Buffer.from(({reqType: "return",username}).toString()), {
            correlationId: userCorrelationId,
            replyTo: userQReply.queue
        })
    } catch (error) {
        throw error
    }
}

function generateUuid() {
    return Math.random().toString() +
        Math.random().toString() +
        Math.random().toString();
}