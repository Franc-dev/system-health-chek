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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_cron_1 = require("node-cron");
var axios_1 = require("axios");
var os_1 = require("os");
var express_1 = require("express");
var client_1 = require("@prisma/client");
var path_1 = require("path");
var prisma = new client_1.PrismaClient();
var app = (0, express_1.default)();
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.set('view engine', 'ejs');
app.set('views', path_1.default.join(__dirname, '../views'));
// Function to check API uptime
function checkAPIHealth() {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.get('https://your-api-endpoint.com/health')];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.status === 200 ? 'UP' : "DOWN (".concat(response.status, ")")];
                case 2:
                    error_1 = _a.sent();
                    return [2 /*return*/, "DOWN (".concat(error_1.message, ")")];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Function to monitor system health
function monitorSystemHealth() {
    return __awaiter(this, void 0, void 0, function () {
        var cpuLoad, freeMemory, totalMemory, usedMemory, apiStatus;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cpuLoad = os_1.default.loadavg()[0];
                    freeMemory = os_1.default.freemem();
                    totalMemory = os_1.default.totalmem();
                    usedMemory = totalMemory - freeMemory;
                    return [4 /*yield*/, checkAPIHealth()];
                case 1:
                    apiStatus = _a.sent();
                    return [4 /*yield*/, prisma.healthLog.create({
                            data: {
                                cpuLoad: cpuLoad,
                                memoryUsage: usedMemory / 1024 / 1024, // Convert to MB
                                apiStatus: apiStatus,
                            },
                        })];
                case 2:
                    _a.sent();
                    console.log("[".concat(new Date().toISOString(), "] Health Data Logged:"));
                    console.log("CPU Load: ".concat(cpuLoad.toFixed(2)));
                    console.log("Memory Usage: ".concat((usedMemory / 1024 / 1024).toFixed(2), " MB"));
                    console.log("API Status: ".concat(apiStatus));
                    return [2 /*return*/];
            }
        });
    });
}
// Schedule tasks
node_cron_1.default.schedule('*/5 * * * *', monitorSystemHealth);
// Dashboard route
app.get('/', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var logs;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.healthLog.findMany({
                    orderBy: { timestamp: 'desc' },
                    take: 10,
                })];
            case 1:
                logs = _a.sent();
                res.render('dashboard', { logs: logs });
                return [2 /*return*/];
        }
    });
}); });
// Start the server
var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
    console.log("Server running on http://localhost:".concat(PORT));
});