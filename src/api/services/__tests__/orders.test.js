import Query from "../../../database/query.builder.js";
import { redisFunctions } from "../../../redis.js";
import { telegramChatsServices } from "../../../telegram/index.js";
import { processOrder, receiveOrder } from "../orders.service.js";

jest.mock("../../../redis.js");
jest.mock("../../../telegram/index.js");
jest.mock("../../../database/query.builder.js");

describe("Receive Order", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should receive an order, send a telegram message, save it to the database and process it", async () => {
        redisFunctions.setLock.mockResolvedValue(true);

        telegramChatsServices.sendMessage.mockResolvedValue();

        Query.insert.mockResolvedValue({ rows: [{ id: 1 }] });

        const mockRequest = {
            category: "linear",
            symbol: "SOLUSDT.P",
            side: "Sell",
            orderType: "Market",
            qty: "0.7",
            sandbox: "true",
            reduceOnly: false,
            testing: true,
        };

        const response = await receiveOrder(mockRequest);

        expect(response).toEqual({ success: true, message: "Order received successfully" });

        expect(telegramChatsServices.sendMessage).toHaveBeenCalledWith({
            message: expect.objectContaining({
                title: `🔄 Sandbox Order Received.`,
                symbol: "SOLUSDT",
                side: mockRequest.side,
                category: mockRequest.category,
                orderType: mockRequest.orderType,
                qty: mockRequest.qty,
            }),
        });

        expect(Query.insert).toHaveBeenCalledWith({
            table: "orders",
            data: expect.objectContaining({
                symbol: "SOLUSDT",
                side: mockRequest.side,
                category: mockRequest.category,
                type: mockRequest.orderType,
                quantity: mockRequest.qty,
                environment: "Sandbox",
            }),
        });
    });

    it("should reject an order if it is already being processed", async () => {
        redisFunctions.setLock.mockResolvedValue(false);

        const mockRequest = {
            category: "linear",
            symbol: "SOLUSDT.P",
            side: "Sell",
            orderType: "Market",
            qty: "0.7",
            sandbox: "true",
            reduceOnly: false,
            testing: true,
        };

        const response = await receiveOrder(mockRequest);

        expect(response).toEqual({ success: true, message: "Order is already being processed" });
    });

    it("should send an alert if an error occurs", async () => {
        redisFunctions.setLock.mockResolvedValue(true);

        const mockRequest = {
            category: "linear",
            symbol: "SOLUSDT.P",
            orderType: "Market",
            qty: "0.7",
            sandbox: "true",
            reduceOnly: false,
            testing: true,
        };

        const response = receiveOrder(mockRequest);

        await expect(response).rejects.toThrow(Error);

        expect(telegramChatsServices.sendMessage).toHaveBeenCalledWith({
            message: expect.objectContaining({
                title: `❌ Order Failed: Failed to place a new order.`,
                symbol: mockRequest.symbol,
                category: mockRequest.category,
                orderType: mockRequest.orderType,
                qty: mockRequest.qty,
                error: expect.any(Error),
            }),
        });
    });
});
