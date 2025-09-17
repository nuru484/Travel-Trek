"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// app.ts
require('dotenv').config();
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./src/routes"));
const env_1 = __importDefault(require("./src/config/env"));
const rateLimit_1 = __importDefault(require("./src/middlewares/rateLimit"));
const error_handler_1 = require("./src/middlewares/error-handler");
const app = (0, express_1.default)();
const allowedOrigins = new Set(env_1.default.CORS_ACCESS ? env_1.default.CORS_ACCESS.split(',') : []);
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
        }
        else {
            callback(new error_handler_1.UnauthorizedError('Not allowed by CORS', {
                layer: 'cors',
                code: 'CORS_NOT_ALLOWED',
                context: { origin },
            }), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.set('trust proxy', true); // Enable trust proxy for proper IP handling behind proxies
app.use((0, morgan_1.default)(':method :url :status :response-time ms'));
app.use(rateLimit_1.default);
app.use('/api/v1', routes_1.default);
app.use(error_handler_1.errorHandler);
exports.default = app;
