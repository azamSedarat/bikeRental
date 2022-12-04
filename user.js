const redis = require('redis')
const amqplib = require("amqplib");
const client = redis.createClient({url: 'redis://localhost:6379/0'})
client.connect().then((msg) => console.log("connected to rediis!"))
async function sampleUser() {
  try {
    await client.set("user1", "1234");
    await client.set("user2", "5678");
    await client.set("user3", "9101");
    await client.set("user4", "1112");
  }
  catch (error) {
      console.error(error);
  }
}
sampleUser();


(async() => {
  try {
    const connection = await amqplib.connect("amqp://localhost:5672")
    const ch = await connection.createChannel();
    const queueName = 'rent_rpc';

    ch.assertQueue(queueName, {
        durable: false
      });

    console.log(' [x] waiting for request');

    ch.consume(queueName, async (msg) => {
      const username = msg.content.toString()
        const result = await client.exists(username)?"valid":"invalid";

        ch.sendToQueue(msg.properties.replyTo, Buffer.from(result.toString()), {
            correlationId: msg.properties.correlationId
        })
        ch.ack(msg)
      })
     } catch (error) {
        throw error
    }
})()


function getUser(username) {
  return 
}