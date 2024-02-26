# Chatbot UI

This repo is forked from an old version of Chatbot UI:
https://github.com/mckaywrigley/chatbot-ui/tree/legacy

## Pre-requisites
npm >= 10.2.3
node >= v20.10.0

You need to clone the chatbot server and make sure it is running:
```
git clone git@ssh.dev.azure.com:v3/Autoliv/ALV-BIDS-GenAI/alv-alv-aa-genai-chatbot-server01
python chatbot-client.py localhost 5000
```

## Installation
npm i

## Run
OPENAI_API_KEY="" DEFAULT_MODEL="llama-2-70b-shanghai" DEFAULT_EMBEDDING_MODEL="all-mpnet-base-v2-local" DEFAULT_MEMORY_TYPE="NO-MEMORY" OPENAI_API_HOST="http://localhost:5000" ENABLE_OPENAI="true" ENABLE_AZURE_OPENAI="true" PASSWORD="" npm run dev

In above command, OPENAI_API_HOST is the end point to the chatbot-ui-server mentioned above.




