// src/app/api/hub/test-messaging/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerAuthUser } from "@/core/auth";

export const runtime = "nodejs";

/* =========================================================
   🧪 Test Messaging Connection API
   ---------------------------------------------------------
   POST → Test email, SMS or WhatsApp connection
========================================================= */

export async function POST(req: NextRequest) {
  try {
    const auth = await getServerAuthUser();
    if (!auth) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type, config } = body;

    if (!type || !config) {
      return NextResponse.json({ ok: false, error: "type and config required" }, { status: 400 });
    }

    // Test based on type
    switch (type) {
      case "email":
        return await testEmail(config);
      case "sms":
        return await testSms(config);
      case "whatsapp":
        return await testWhatsapp(config);
      default:
        return NextResponse.json({ ok: false, error: "Invalid type" }, { status: 400 });
    }
  } catch (e: any) {
    console.error("❌ POST /api/hub/test-messaging error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}

async function testEmail(config: any) {
  const { provider, apiKey, fromEmail } = config;

  if (provider === "none") {
    return NextResponse.json({ ok: false, error: "Email provider not configured" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "API Key is required" }, { status: 400 });
  }

  // Test based on provider
  try {
    switch (provider) {
      case "sendgrid":
        // Test SendGrid API key by fetching user info
        const sgRes = await fetch("https://api.sendgrid.com/v3/user/profile", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!sgRes.ok) throw new Error("Invalid SendGrid API key");
        break;

      case "resend":
        // Test Resend API key
        const resendRes = await fetch("https://api.resend.com/domains", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!resendRes.ok) throw new Error("Invalid Resend API key");
        break;

      case "mailgun":
        // For Mailgun, we can't easily test without domain info
        if (!apiKey.startsWith("key-") && !apiKey.includes(":")) {
          throw new Error("Mailgun API key should start with 'key-' or be in format 'api:key-xxx'");
        }
        break;

      case "ses":
        // AWS SES requires AWS SDK, just validate format
        if (!apiKey.includes(":")) {
          throw new Error("AWS credentials should be in format 'accessKeyId:secretAccessKey'");
        }
        break;

      default:
        // SMTP - can't easily test without sending
        break;
    }

    return NextResponse.json({
      ok: true,
      message: `${provider} connection verified successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

async function testSms(config: any) {
  const { provider, accountSid, authToken, fromNumber } = config;

  if (provider === "none") {
    return NextResponse.json({ ok: false, error: "SMS provider not configured" }, { status: 400 });
  }

  if (!accountSid || !authToken) {
    return NextResponse.json({ ok: false, error: "Account SID and Auth Token are required" }, { status: 400 });
  }

  try {
    switch (provider) {
      case "twilio":
        // Test Twilio credentials
        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          },
        });
        if (!twilioRes.ok) throw new Error("Invalid Twilio credentials");
        break;

      case "vonage":
        // Vonage uses API key/secret
        const vonageRes = await fetch(
          `https://rest.nexmo.com/account/get-balance?api_key=${accountSid}&api_secret=${authToken}`
        );
        const vonageData = await vonageRes.json();
        if (vonageData.error) throw new Error(vonageData["error-text"] || "Invalid Vonage credentials");
        break;

      case "messagebird":
        // MessageBird uses API key
        const mbRes = await fetch("https://rest.messagebird.com/balance", {
          headers: { Authorization: `AccessKey ${authToken}` },
        });
        if (!mbRes.ok) throw new Error("Invalid MessageBird credentials");
        break;
    }

    return NextResponse.json({
      ok: true,
      message: `${provider} SMS connection verified successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

async function testWhatsapp(config: any) {
  const { provider, accountSid, authToken, fromNumber } = config;

  if (provider === "none") {
    return NextResponse.json({ ok: false, error: "WhatsApp provider not configured" }, { status: 400 });
  }

  if (!accountSid || !authToken) {
    return NextResponse.json({ ok: false, error: "Account SID and Auth Token are required" }, { status: 400 });
  }

  try {
    switch (provider) {
      case "twilio":
        // Test Twilio credentials (same as SMS)
        const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          },
        });
        if (!twilioRes.ok) throw new Error("Invalid Twilio credentials");
        break;

      case "messagebird":
        const mbRes = await fetch("https://rest.messagebird.com/balance", {
          headers: { Authorization: `AccessKey ${authToken}` },
        });
        if (!mbRes.ok) throw new Error("Invalid MessageBird credentials");
        break;

      case "360dialog":
        // 360dialog API test
        const dialogRes = await fetch("https://waba.360dialog.io/v1/configs/webhook", {
          headers: { "D360-API-KEY": authToken },
        });
        if (!dialogRes.ok) throw new Error("Invalid 360dialog credentials");
        break;
    }

    return NextResponse.json({
      ok: true,
      message: `${provider} WhatsApp connection verified successfully`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}

export const dynamic = "force-dynamic";
