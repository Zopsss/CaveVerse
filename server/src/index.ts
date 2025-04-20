import http from "http";
import express from "express";
import cors from "cors";
import { Server, LobbyRoom } from "colyseus";
import { monitor } from "@colyseus/monitor";
import { MyRoom } from "./rooms/MyRoom";

// import socialRoutes from "@colyseus/social/express"

const port = Number(process.env.PORT || 2567);
const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "https://caveverse-frontend.onrender.com",
];

// ✅ Apply CORS for Express routes
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);
app.use(express.json());

const server = http.createServer(app);

// ✅ Manually handle CORS for Colyseus matchmake routes
server.on("request", (req, res) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin || "")) {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Credentials", "true");
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
        }
    }
});

const gameServer = new Server({
    server,
});

// register room handlers
gameServer.define("LOBBY_ROOM", LobbyRoom);
gameServer.define("PUBLIC_ROOM", MyRoom);
gameServer.define("PRIVATE_ROOM", MyRoom).enableRealtimeListing();

/**
 * Register @colyseus/social routes
 *
 * - uncomment if you want to use default authentication (https://docs.colyseus.io/server/authentication/)
 * - also uncomment the import statement
 */
// app.use("/", socialRoutes);

// register colyseus monitor AFTER registering your room handlers
app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`Listening on ws://localhost:${port}`);
