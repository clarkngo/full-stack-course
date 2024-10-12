const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.content || "Please provide a message.";

  // Set headers for SSE (Server-Sent Events)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders(); // Flush headers to establish SSE connection

  try {
    // Send the request to Llama 3.2:1b model
    const axiosResponse = await axios({
      method: 'post',
      url: 'http://localhost:11434/api/generate',
      data: {
        model: 'llama3.2:1b',
        prompt: userMessage,
      },
      responseType: 'stream',  // Enable streaming response from the model
    });

    // Stream the response from Llama model to the client
    axiosResponse.data.on('data', (chunk) => {
      const chunkStr = chunk.toString();
      res.write(`data: ${chunkStr}\n\n`);  // Send each chunk as an SSE event
    });

    axiosResponse.data.on('end', () => {
      res.write('data: [DONE]\n\n');  // Indicate the end of the response
      res.end();
    });

  } catch (error) {
    console.error('Error during chat response streaming:', error);
    res.status(500).json({ error: 'Failed to process the request with Llama 3.2:1b.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});