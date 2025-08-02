"use strict";
// src/config/multer.ts
// This file configures Multer for handling file uploads in the application
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const multerUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(), // Directly setting the memoryStorage
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});
exports.default = multerUpload;
