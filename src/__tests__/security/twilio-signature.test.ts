import crypto from "crypto";
import { verifyTwilioSignature } from "@/lib/whatsapp/config";

/**
 * The WhatsApp inbound webhook authenticates Twilio by X-Twilio-Signature.
 * A wrong implementation would reject every legitimate message (or, worse,
 * accept forged ones), so we pin the algorithm against Twilio's official test
 * vector and assert the accept/reject behavior.
 */
describe("verifyTwilioSignature", () => {
  // Official vector from https://www.twilio.com/docs/usage/security
  const authToken = "12345";
  const url = "https://example.com/myapp.php?foo=1&bar=2";
  const params = {
    CallSid: "CA1234567890ABCDE",
    Caller: "+14158675310",
    Digits: "1234",
    From: "+14158675310",
    To: "+18005551212",
  };
  const officialSignature = "L/OH5YylLD5NRKLltdqwSvS0BnU=";

  it("accepts the official Twilio test vector", () => {
    expect(verifyTwilioSignature(url, params, officialSignature, authToken)).toBe(true);
  });

  it("rejects a tampered signature", () => {
    expect(verifyTwilioSignature(url, params, "AAAAAAAAAAAAAAAAAAAAAAAAAAA=", authToken)).toBe(false);
  });

  it("rejects when a param value is altered (forged body)", () => {
    const forged = { ...params, Digits: "9999" };
    expect(verifyTwilioSignature(url, forged, officialSignature, authToken)).toBe(false);
  });

  it("rejects empty signature / token / url", () => {
    expect(verifyTwilioSignature(url, params, "", authToken)).toBe(false);
    expect(verifyTwilioSignature(url, params, officialSignature, "")).toBe(false);
    expect(verifyTwilioSignature("", params, officialSignature, authToken)).toBe(false);
  });

  it("is self-consistent for a webhook-shaped payload (no query string)", () => {
    const token = "test_auth_token_abc";
    const webhookUrl = "https://www.rowiia.com/api/integrations/whatsapp/webhook";
    const body = {
      From: "whatsapp:+5215512345678",
      To: "whatsapp:+14155238886",
      Body: "Hola Rowi",
      MessageSid: "SM0123456789abcdef",
    };
    const sortedKeys = Object.keys(body).sort();
    let data = webhookUrl;
    for (const k of sortedKeys) data += k + (body as Record<string, string>)[k];
    const sig = crypto.createHmac("sha1", token).update(Buffer.from(data, "utf-8")).digest("base64");

    expect(verifyTwilioSignature(webhookUrl, body, sig, token)).toBe(true);
    expect(verifyTwilioSignature(webhookUrl, body, sig, "wrong_token")).toBe(false);
  });
});
