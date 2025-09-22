"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authenticate_jwt_1 = __importDefault(require("../middlewares/authenticate-jwt"));
const authentication_1 = require("./authentication");
const tour_1 = __importDefault(require("./tour"));
const destination_1 = __importDefault(require("./destination"));
const hotel_1 = __importDefault(require("./hotel"));
const flight_1 = __importDefault(require("./flight"));
const booking_1 = __importDefault(require("./booking"));
const payment_1 = __importDefault(require("./payment"));
const room_1 = __importDefault(require("./room"));
const itinerary_1 = __importDefault(require("./itinerary"));
const tourInclusion_1 = __importDefault(require("./tourInclusion"));
const user_1 = __importDefault(require("./user"));
const dashboard_1 = __importDefault(require("./dashboard"));
const reports_1 = __importDefault(require("./reports"));
const routes = express_1.default.Router();
// Authentication routes
routes.use('/', authentication_1.authenticationRouter);
// Payment routes
routes.use(payment_1.default);
routes.use(authenticate_jwt_1.default);
// Tour routes
routes.use(tour_1.default);
// Destination routes
routes.use(destination_1.default);
// Hotel routes
routes.use(hotel_1.default);
// Flight routes
routes.use(flight_1.default);
// Booking routes
routes.use(booking_1.default);
// Room routes
routes.use(room_1.default);
// Itinerary routes
routes.use(itinerary_1.default);
// Tour Inclusion routes
routes.use(tourInclusion_1.default);
// User routes
routes.use(user_1.default);
// Dashboard routes
routes.use(dashboard_1.default);
// Reports routes
routes.use(reports_1.default);
exports.default = routes;
