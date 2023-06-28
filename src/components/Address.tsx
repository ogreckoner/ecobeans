import React from "react";
import { Skeleton, Typography } from "antd";
import { LinkProps } from "antd/es/typography/Link";
import { useResolveEnsAddress } from "eth-hooks/dapps";

import { blockExplorerLink } from "@helpers";
import { MAINNET_PROVIDER } from "@modules/blockchain/providers";

const { Link } = Typography;

interface AddressProps extends LinkProps {
  address: string;
  copyable?: boolean;

  size?: "normal" | "long";
}

export const Address: React.FC<AddressProps> = ({ address, size, copyable, ...props }) => {
  const [ens] = useResolveEnsAddress(MAINNET_PROVIDER, address);

  const ensSplit = ens && ens.split(".");
  const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";

  const etherscanLink = blockExplorerLink(address);

  let displayAddress = address?.substr(0, 5) + "..." + address?.substr(-4);
  if (validEnsCheck) {
    displayAddress = ens!;
  } else if (size === "long") {
    displayAddress = address;
  }

  if (!address) {
    return (
      <span>
        <Skeleton avatar paragraph={{ rows: 1 }} />
      </span>
    );
  }

  return (
    <Link
      color="primary"
      target="_blank"
      rel="noopener noreferrer"
      href={etherscanLink}
      copyable={copyable ? { text: address } : undefined}
      {...props}
    >
      {displayAddress}
    </Link>
  );
};
