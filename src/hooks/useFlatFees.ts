import { ethers } from "ethers";
import { notification } from "antd";
import { useQuery } from "react-query";
import axios, { AxiosRequestConfig } from "axios";

import { RELAYER_GET_FEES_ENDPOINT } from "@constants";

interface FeeResponse {
  recipient: string;
  flat: {
    eco: string;
    usdc: string;
  };
}

export interface IFlatFees {
  recipient: string;
  eco: ethers.BigNumber;
  usdc: ethers.BigNumber;
}

export const useFlatFees = () => {
  return (
    (useQuery(
      "flat-fee",
      () => {
        return axios
          .get<FeeResponse>(RELAYER_GET_FEES_ENDPOINT, { retry: 999_999, retryTimeout: 2_000 } as AxiosRequestConfig)
          .then(response => {
            const { data } = response;
            return {
              recipient: data.recipient,
              eco: ethers.BigNumber.from(data.flat.eco),
              usdc: ethers.BigNumber.from(data.flat.usdc),
            };
          })
          .catch(err => {
            console.error("could not fetch fees", err);
            notification.error({ message: "Unable to determine fees" });
            return null;
          });
      },
      {
        initialData: null,
        refetchInterval: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchIntervalInBackground: false,
      } as never,
    ).data as IFlatFees) || {
      recipient: undefined,
      eco: undefined,
      usdc: undefined,
    }
  );
};
