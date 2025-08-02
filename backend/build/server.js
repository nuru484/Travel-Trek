"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// server.ts
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./src/config/env"));
const port = env_1.default.PORT || 3000;
app_1.default.listen(port, () => {
    console.log(`App is listening on http://localhost:${port}`);
});
