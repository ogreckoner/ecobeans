import { SubVerifierDetails } from "@toruslabs/customauth";

import { NETWORK } from "@constants/network";

export enum AuthMethod {
  GOOGLE = "google",
  TWITTER = "twitter",
}

const isTestnet = NETWORK.chainId === 420;
const AUTH_DOMAIN = isTestnet ? "https://torus-test.auth0.com" : "https://torus.auth0.com";

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
    jwtParams: { domain: AUTH_DOMAIN },
  },
};
