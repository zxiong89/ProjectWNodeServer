"use strict";

const express = require('express');
const parseHandler = require("./handlers/parseRequests");
const PORT = 3000;
const HOST = "0.0.0.0";

const app = express();
app.use(express.urlencoded({ extended : false }));
app.use(express.json());

app.post(`/`, async (req, res) =>  {
    if (req.body) {
        const response = await parseHandler.handler(req.body);
        res.send(response);
    }
});

app.listen(PORT, HOST, () => {
    console.log(`App listening on http://${HOST}:${PORT}`);
});