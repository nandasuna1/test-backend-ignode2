import { it, describe, beforeAll, afterAll, expect, beforeEach } from "vitest";
import { execSync } from "node:child_process";
import request from "supertest";
import { app } from "../src/app";

describe("Transaction routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  it("shoud be able to create a new transaction", async () => {
    await request(app.server)
      .post("/transactions")
      .send({
        title: "Nes transaction test",
        amount: 3000,
        type: "credit",
      })
      .expect(201);
  });

  it("should be able to list all transactions", async () => {
    const creteTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Transaction test",
        amount: 3000,
        type: "credit",
      });

    const cookies = creteTransactionResponse.get("Set-Cookie");

    const listTransactionsResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    // console.log(listTransactionsResponse.body);

    expect(listTransactionsResponse.body.transaction).toEqual([
      expect.objectContaining({
        title: "Transaction test",
        amount: 3000,
      }),
    ]);
  });

  it("to get all transactions", async () => {
    const creteTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Transaction test",
        amount: 3000,
        type: "credit",
      });

    const cookies = creteTransactionResponse.get("Set-Cookie");

    const listTransactionsResponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    const transactionId = listTransactionsResponse.body.transaction[0].id;

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: "Transaction test",
        amount: 3000,
      })
    );
  });

  it("should be able to get the summary", async () => {
    const creteCreditTransactionResponse = await request(app.server)
      .post("/transactions")
      .send({
        title: "Credit test",
        amount: 3000,
        type: "credit",
      });

    const cookies = creteCreditTransactionResponse.get("Set-Cookie");

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "Debit test",
        amount: 2000,
        type: "debit",
      });

    const summaryResponse = await request(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200);

    console.log(summaryResponse.body);

    expect(summaryResponse.body.summary).toEqual({
      amount: 1000,
    });
  });
});
