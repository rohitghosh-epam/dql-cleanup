const { ServiceBusClient } = require("@azure/service-bus");
require("dotenv").config();

console.log("TOPIC_NAME:", process.env.TOPIC_NAME);
console.log("SUBSCRIPTION_NAME:", process.env.SUBSCRIPTION_NAME);

async function test() {
  const client = new ServiceBusClient(
    process.env.SERVICEBUS_CONNECTION_STRING
  );

  const receiver = client.createReceiver(
    process.env.TOPIC_NAME,
    process.env.SUBSCRIPTION_NAME,
    {
      subQueueType: "deadLetter",
    }
  );

  const messages = await receiver.peekMessages(5);

  console.log(
    messages.map((m) => ({
      sequenceNumber: m.sequenceNumber,
      enqueuedTimeUtc: m.enqueuedTimeUtc,
      messageId: m.messageId
    }))
  );

  await receiver.close();
  await client.close();
}

test();