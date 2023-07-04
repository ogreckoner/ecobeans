import { SubVerifierDetails } from "@toruslabs/customauth";

export enum AuthMethod {
  GOOGLE = "google",
  TWITTER = "twitter",
}

export const WEB3_AUTH_CLIENT_ID =
  "BAMSE3WYMeWEBj3AyELr0ZgFiFrJBGZ-mQcoLn8rvOo7L_lhR22kdkaaIyzyRgvGrZsDpxZt_2Sn-TjovFnbGGE";

export const VERIFIER_MAP: Record<AuthMethod, SubVerifierDetails> = {
  [AuthMethod.GOOGLE]: {
    typeOfLogin: "google",
    verifier: "beam-w3b-google-staging",
    clientId: "459790115639-969enqtjont6rl5tfb51sq9rn154hmq5.apps.googleusercontent.com",
  },
  [AuthMethod.TWITTER]: {
    typeOfLogin: "twitter",
    verifier: "beam-w3b-twitter-staging",
    clientId: "TEaopD1HrgvyoF7CpjwU6FpGXwtLdHhU",
    jwtParams: {
      domain: "https://dev-emmmw1b5dtpg7hdc.us.auth0.com",
    },
  },
};
