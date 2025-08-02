"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidBase64Image = void 0;
/**
 * Validates if a string is a valid Base64 image
 *
 * @param str - String to validate
 * @returns boolean indicating if the string is a valid Base64 image
 */
const isValidBase64Image = (str) => {
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,[A-Za-z0-9+/=]+$/;
    return base64Regex.test(str);
};
exports.isValidBase64Image = isValidBase64Image;
