require("dotenv").config();
const { ServiceBusClient } = require("@azure/service-bus");
const Long = require("long");

const KEEP_COUNT = parseInt(process.argv[2], 10);

if (isNaN(KEEP_COUNT)) {
  console.error("Usage: node cleanup-dlq.js <keepCount>");
  process.exit(1);
}

const connectionString =
  process.env.SERVICEBUS_CONNECTION_STRING;

const topicName = process.env.TOPIC_NAME;
const subscriptionName = process.env.SUBSCRIPTION_NAME;

async function main() {
  const client = new ServiceBusClient(connectionString);

  const receiver = client.createReceiver(
    topicName,
    subscriptionName,
    {
      subQueueType: "deadLetter",
      receiveMode: "peekLock",
    }
  );

  console.log("Reading DLQ messages...");

  const allMessages = [];
  let fromSequenceNumber;

  while (true) {
    const messages = await receiver.peekMessages(
      100,
      { fromSequenceNumber }
    );

    if (messages.length === 0) {
      break;
    }

    allMessages.push(...messages);

    fromSequenceNumber =
      messages[messages.length - 1].sequenceNumber.add(1);
  }

  console.log(
    `Total DLQ messages found: ${allMessages.length}`
  );

  if (allMessages.length <= KEEP_COUNT) {
    console.log(
      `Queue already contains less than ${KEEP_COUNT} messages.`
    );

    await receiver.close();
    await client.close();
    return;
  }

  allMessages.sort(
    (a, b) => b.sequenceNumber.compare(a.sequenceNumber)
  );

  const keepSequenceNumbers = new Set(
    allMessages
      .slice(0, KEEP_COUNT)
      .map((m) => m.sequenceNumber.toString())
  );

  console.log(
    `Keeping latest ${KEEP_COUNT} messages`
  );

  console.log(
    `Deleting ${
      allMessages.length - KEEP_COUNT
    } messages`
  );

  let deletedCount = 0;

  while (true) {
    const batch = await receiver.receiveMessages(
      100,
      { maxWaitTimeInMs: 3000 }
    );

    if (batch.length === 0) {
      break;
    }

    for (const msg of batch) {
      if (
        keepSequenceNumbers.has(
          msg.sequenceNumber.toString()
        )
      ) {
        await receiver.abandonMessage(msg);
      } else {
        await receiver.completeMessage(msg);
        deletedCount++;
      }
    }

    process.stdout.write(
      `Deleted ${deletedCount}\r`
    );
  }

  console.log("\nCleanup completed.");
  console.log(
    `Deleted messages: ${deletedCount}`
  );
  console.log(
    `Retained messages: ${KEEP_COUNT}`
  );

  await receiver.close();
  await client.close();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });