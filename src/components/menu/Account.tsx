import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ethers } from "ethers";
import { Button, Modal, Spin, Tooltip } from "antd";
import { KeyOutlined, SaveOutlined, SettingOutlined } from "@ant-design/icons";

import { SaveAccess } from "@components/menu/SaveAccess";
import { useFunWallet } from "@contexts/FunWalletContext";

import { Address } from "../Address";
import { RecoverAccess } from "./RecoverAccess";

interface AccountProps {
  signer: ethers.Wallet;
}

enum Action {
  Save,
  Login,
}

export const Account: React.FC<AccountProps> = ({ signer }) => {
  const navigate = useNavigate();
  const { address } = useFunWallet();

  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<Action | null>(null);

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const password = searchParams.get("password");
    if (password) {
      navigate("/");
    }
  }, [navigate, searchParams]);

  const showImportButton = (
    <Button onClick={() => setAction(Action.Login)} icon={<SaveOutlined />}>
      Log In
    </Button>
  );

  const privateKeyButton =
    action === Action.Save ? (
      <Button key="hide" onClick={() => setAction(null)} icon={<KeyOutlined />}>
        Hide
      </Button>
    ) : (
      <Button key="hide" onClick={() => setAction(Action.Save)} icon={<KeyOutlined />}>
        Save Access
      </Button>
    );

  return (
    <>
      <Tooltip title="Wallet">
        <SettingOutlined
          data-cy="header-config-btn"
          onClick={() => setOpen(!open)}
          style={{
            fontSize: 24,
            color: "#06153c",
            cursor: "pointer",
            verticalAlign: "middle",
          }}
        />
      </Tooltip>
      <Modal
        open={open}
        onOk={() => setOpen(!open)}
        onCancel={() => setOpen(!open)}
        afterClose={() => setAction(null)}
        footer={action === null ? [showImportButton, privateKeyButton] : null}
        title={address ? <Address copyable address={address} /> : <Spin />}
      >
        {action === Action.Login ? (
          <RecoverAccess signer={signer} onClose={() => setAction(null)} />
        ) : action === Action.Save ? (
          <SaveAccess signer={signer} onClose={() => setAction(null)} />
        ) : null}
      </Modal>
    </>
  );
};

export default Account;
