const amqplib = require("amqplib");
const redis = require('redis')
const client = redis.createClient({
    url: 'redis://localhost:6379/1'
})
client.connect().then((msg) => console.log("connected to rediis!"))

async function sampleBike() {
  const bikeModels = [{modelA: 10},{modelB: 10},{modelC: 10}];
  const rentedBikes = [{model: 'B',user: "user1",rentTime: 30},{model: 'C',user: "user2",rentTime: 10}];
  const freeBikes = {modelA: 5,modelB: 7,modelC: 3};

  try {
      await client.set("bikeModels", JSON.stringify(bikeModels));
      await client.set("rentedBikes", JSON.stringify(rentedBikes));
      await client.set("freeBikes", JSON.stringify(freeBikes));
  }

  catch (error) {
      console.error(error);
  }
}
sampleBike();


(async() => {
  try {
    const connection = await amqplib.connect("amqp://localhost:5672")
    const ch = await connection.createChannel();
    const queueName = 'rent_rpc';

    ch.assertQueue(queueName, {
        durable: false
      });

    console.log(' [x] waiting for request');

    ch.consume(queueName, async(msg) => {
      const reqType = msg.content.toString()[0]
      const args = msg.content.toString().slice(1)
      let result;
      switch (reqType){
        case "list":
          result = getList(args)
          break;
        case "rent":
          result = rentBike(args)
          break;
        case "return":
          result = returnBike(args)
          break;
      }
        ch.sendToQueue(msg.properties.replyTo, Buffer.from(result.toString()), {
            correlationId: msg.properties.correlationId
        })
        ch.ack(msg)
      })
     } catch (error) {
        throw error
    }
})()

async function getList(args){
  if(temp=="freebikeList"){
    return await client.get("freeBikes")
  }
  if(temp=="rentedbikeList"){
    return await client.get("rentedBikes")
  }
}

async function rentBike(args){
  const username = args[0];
  const bikeModel = args[1];
  const rentTime = args[2];
  const rentBike = {model: bikeModel,user: username,rentTime: rentTime}
  return await client.append(rentBike,{ EX: 60*60*1000 })
}

async function returnBike(args){
  const username = args[0];
  return await client.getDel(username)
}
