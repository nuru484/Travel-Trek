"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CookieManager_1 = require("../../utils/CookieManager");
const logout = (req, res) => {
    CookieManager_1.CookieManager.clearAllTokens(res);
    res.status(200).json({ message: 'Logged out successfully' });
};
exports.default = logout;
