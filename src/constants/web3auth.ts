import { SubVerifierDetails } from "@toruslabs/customauth";

export enum AuthMethod {
  TWITTER = "twitter",
}

export const WEB3_AUTH_CLIENT_ID =
  process.env.REACT_APP_WEB3_AUTH_CLIENT_ID ||
  "BAMSE3WYMeWEBj3AyELr0ZgFiFrJBGZ-mQcoLn8rvOo7L_lhR22kdkaaIyzyRgvGrZsDpxZt_2Sn-TjovFnbGGE";

export const VERIFIER_MAP: Record<AuthMethod, SubVerifierDetails> = {
  [AuthMethod.TWITTER]: {
    typeOfLogin: "twitter",
    verifier: process.env.REACT_APP_WEB3_AUTH_TWITTER_VERIFIER || "beam-w3b-twitter-staging",
    clientId: process.env.REACT_APP_WEB3_AUTH_TWITTER_CLIENT_ID || "TEaopD1HrgvyoF7CpjwU6FpGXwtLdHhU",
    jwtParams: {
      domain: process.env.REACT_APP_WEB3_AUTH_TWITTER_DOMAIN || "https://dev-emmmw1b5dtpg7hdc.us.auth0.com",
    },
  },
};
