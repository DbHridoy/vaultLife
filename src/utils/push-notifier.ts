import { createSign } from "crypto";
import { env } from "../config/env";
import { logger } from "./logger";

type PushData = Record<string, unknown>;

type CachedAccessToken = {
  token: string;
  expiresAt: number;
};

export class PushNotifier {
  private cachedFcmAccessToken: CachedAccessToken | null = null;

  private isExpoToken(token: string) {
    return /^ExponentPushToken\[.+\]$/.test(token) || /^ExpoPushToken\[.+\]$/.test(token);
  }

  private serializeData(data?: PushData) {
    const serializedData: Record<string, string> = {};

    if (!data) {
      return serializedData;
    }

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined || value === null) {
        continue;
      }

      serializedData[key] = typeof value === "string" ? value : JSON.stringify(value);
    }

    return serializedData;
  }

  private toBase64Url(value: string | Buffer) {
    return Buffer.from(value)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  private getFirebasePrivateKey() {
    return env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  }

  private async getFcmAccessToken() {
    const now = Math.floor(Date.now() / 1000);

    if (
      this.cachedFcmAccessToken &&
      this.cachedFcmAccessToken.expiresAt > Date.now() + 60_000
    ) {
      return this.cachedFcmAccessToken.token;
    }

    if (
      !env.FIREBASE_PROJECT_ID ||
      !env.FIREBASE_CLIENT_EMAIL ||
      !this.getFirebasePrivateKey()
    ) {
      throw new Error(
        "Firebase push configuration is incomplete. FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are required."
      );
    }

    const jwtHeader = this.toBase64Url(
      JSON.stringify({ alg: "RS256", typ: "JWT" })
    );
    const jwtPayload = this.toBase64Url(
      JSON.stringify({
        iss: env.FIREBASE_CLIENT_EMAIL,
        sub: env.FIREBASE_CLIENT_EMAIL,
        aud: "https://oauth2.googleapis.com/token",
        scope: "https://www.googleapis.com/auth/firebase.messaging",
        iat: now,
        exp: now + 3600,
      })
    );
    const unsignedJwt = `${jwtHeader}.${jwtPayload}`;
    const signer = createSign("RSA-SHA256");
    signer.update(unsignedJwt);
    signer.end();
    const signature = signer.sign(this.getFirebasePrivateKey()!);
    const assertion = `${unsignedJwt}.${this.toBase64Url(signature)}`;

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    const payload = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
      error_description?: string;
    };

    if (!response.ok || !payload.access_token || !payload.expires_in) {
      throw new Error(
        payload.error_description ||
          payload.error ||
          "Failed to obtain Firebase access token"
      );
    }

    this.cachedFcmAccessToken = {
      token: payload.access_token,
      expiresAt: Date.now() + payload.expires_in * 1000,
    };

    return payload.access_token;
  }

  private async sendExpoPush(
    token: string,
    title: string,
    message: string,
    data?: PushData
  ) {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(env.EXPO_ACCESS_TOKEN
          ? { Authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        to: token,
        title,
        body: message,
        data,
        sound: "default",
      }),
    });

    const payload = (await response.json()) as {
      data?: { status?: string; message?: string; details?: Record<string, unknown> };
      errors?: Array<{ message?: string }>;
    };

    if (!response.ok || payload.data?.status === "error") {
      throw new Error(
        payload.data?.message ||
          payload.errors?.[0]?.message ||
          "Expo push notification failed"
      );
    }

    return payload;
  }

  private async sendFcmPush(
    token: string,
    title: string,
    message: string,
    data?: PushData
  ) {
    const accessToken = await this.getFcmAccessToken();

    if (!env.FIREBASE_PROJECT_ID) {
      throw new Error("FIREBASE_PROJECT_ID is required for FCM push notifications");
    }

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title,
              body: message,
            },
            data: this.serializeData(data),
            android: {
              priority: "high",
              notification: {
                sound: "default",
              },
            },
            apns: {
              headers: {
                "apns-priority": "10",
              },
              payload: {
                aps: {
                  sound: "default",
                },
              },
            },
          },
        }),
      }
    );

    const payload = (await response.json()) as {
      name?: string;
      error?: {
        message?: string;
      };
    };

    if (!response.ok) {
      throw new Error(payload.error?.message || "FCM push notification failed");
    }

    return payload;
  }

  async sendPush(
    token: string,
    title: string,
    message: string,
    data?: PushData
  ) {
    try {
      const result = this.isExpoToken(token)
        ? await this.sendExpoPush(token, title, message, data)
        : await this.sendFcmPush(token, title, message, data);

      logger.info(
        {
          token,
          title,
          provider: this.isExpoToken(token) ? "expo" : "fcm",
        },
        "Push notification dispatched"
      );

      return { success: true, result };
    } catch (error) {
      logger.error(
        {
          error,
          token,
          title,
        },
        "Push notification dispatch failed"
      );
      throw error;
    }
  }
}
