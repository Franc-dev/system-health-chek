"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const axios_1 = __importDefault(require("axios"));
const os_1 = __importDefault(require("os"));
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
// Function to check API uptime
function checkAPIHealth() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get('https://your-api-endpoint.com/health');
            return response.status === 200 ? 'UP' : `DOWN (${response.status})`;
        }
        catch (error) {
            return `DOWN (${error.message})`;
        }
    });
}
// Function to monitor system health
function monitorSystemHealth() {
    return __awaiter(this, void 0, void 0, function* () {
        const systemId = os_1.default.hostname(); // Use hostname as system identifier
        const cpuLoad = os_1.default.loadavg()[0]; // 1-minute load average
        const freeMemory = os_1.default.freemem();
        const totalMemory = os_1.default.totalmem();
        const usedMemory = totalMemory - freeMemory;
        const apiStatus = yield checkAPIHealth();
        yield prisma.healthLog.create({
            data: {
                cpuLoad,
                memoryUsage: usedMemory / 1024 / 1024, // Convert to MB
                apiStatus,
                systemId
            },
        });
        console.log(`[${new Date().toISOString()}] Health Data Logged for system ${systemId}:`);
        console.log(`CPU Load: ${cpuLoad.toFixed(2)}`);
        console.log(`Memory Usage: ${(usedMemory / 1024 / 1024).toFixed(2)} MB`);
        console.log(`API Status: ${apiStatus}`);
    });
}
// Schedule tasks - runs every 2 minutes
node_cron_1.default.schedule('*/2 * * * *', monitorSystemHealth);
// Dashboard route
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const systemId = os_1.default.hostname();
    const logs = yield prisma.healthLog.findMany({
        where: { systemId },
        orderBy: { timestamp: 'desc' },
        take: 20
    });
    res.render('dashboard', {
        logs: logs.reverse(),
        systemId: systemId
    });
}));
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Run initial monitoring
    monitorSystemHealth();
});
