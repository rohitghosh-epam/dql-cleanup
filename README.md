# Azure Service Bus DLQ Cleanup Utility

## Overview

This utility is used to clean up old messages from the Azure Service Bus Dead Letter Queue (DLQ) for the following subscription:

* **Namespace:** `pauto-servicebus-cc-h`
* **Topic:** `order-data-outbound-prod`
* **Subscription:** `order-to-od`

The script retains the latest **X** messages in the DLQ and permanently deletes all older messages.

> **Note:** This utility is intended to be executed manually whenever DLQ cleanup is required.

---

## Prerequisites

* Node.js 18+ installed
* Access to Azure Service Bus namespace
* Service Bus connection string with **Manage** permissions

---

## Project Setup

Create a new directory and install dependencies:

```bash
mkdir dlq-cleanup
cd dlq-cleanup

npm init -y
npm install @azure/service-bus dotenv
```

---

## Configuration

Create a `.env` file in the project root:

```env
SERVICEBUS_CONNECTION_STRING=<PRIMARY_CONNECTION_STRING>

TOPIC_NAME=order-data-outbound-prod
SUBSCRIPTION_NAME=order-to-od
```

Example:

```env
SERVICEBUS_CONNECTION_STRING=Endpoint=sb://pauto-servicebus-cc-h.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=<KEY>

TOPIC_NAME=order-data-outbound-prod
SUBSCRIPTION_NAME=order-to-od
```

---

## Verifying Connectivity

Before running the cleanup script, create a simple test script (`test-connection.js`) and run:

```bash
node test-connection.js
```

Expected output:

```text
Found 5 messages
```

This confirms:

* Connection string is valid
* Network access is allowed
* DLQ is accessible

---

## Running the Cleanup Script

The script accepts a single argument representing the number of newest messages to retain.

### Keep latest 100 messages

```bash
node cleanup-dlq.js 100
```

### Keep latest 50 messages

```bash
node cleanup-dlq.js 50
```

### Keep latest 10 messages

```bash
node cleanup-dlq.js 10
```

---

## How the Script Works

1. Connects to the Dead Letter Queue of the configured subscription.
2. Reads all available DLQ messages.
3. Sorts messages by sequence number (newest first).
4. Retains the latest **X** messages.
5. Permanently deletes all older messages.

---

## Example Output

```text
Reading DLQ messages...

Total DLQ messages found: 589

Keeping latest 100 messages
Deleting 489 messages

Cleanup completed.

Deleted messages: 489
Retained messages: 100
```

---

## Safety Notes

* Deleted messages cannot be recovered.
* Always verify the retention count before execution.
* Run the connectivity test before performing cleanup.
* If possible, test in a lower environment before executing against Production.
* The script only affects the Dead Letter Queue and does not modify active topic messages.

---

## Target Service Bus Entity

| Property       | Value                    |
| -------------- | ------------------------ |
| Namespace      | pauto-servicebus-cc-h    |
| Topic          | order-data-outbound-prod |
| Subscription   | order-to-od              |
| Queue Type     | Dead Letter Queue (DLQ)  |
| Execution Mode | Manual                   |
