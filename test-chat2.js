const http = require('http');

const data = JSON.stringify({
  message: "Check what lists exist on this board, then create a new card called 'Final Demo' in my To Do list, and immediately move it to the Doing list.",
  context: {
    "boardName": "my-trello-board",
    "visibleLists": [],
    "selectedCard": null,
    "currentUrl": "https://trello.com/b/0uoZa7oJ/my-trello-board",
    "pageTitle": "my-trello-board | Trello"
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
  res.on('end', () => {
    console.log('No more data in response.');
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
  process.exit(1);
});

req.write(data);
req.end();
