"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const pino_1 = __importDefault(require("pino"));
const isProduction = process.env.NODE_ENV === "production";
const logger = (0, pino_1.default)({
    level: isProduction ? "info" : "debug",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: true,
            singleLine: false,
            ignore: "",
        },
    },
});
exports.default = logger;
