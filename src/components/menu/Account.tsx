import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Modal, Spin, Tooltip } from "antd";
import { ExportOutlined, KeyOutlined, SaveOutlined, SettingOutlined } from "@ant-design/icons";
import { ethers } from "ethers";

import { SaveAccess } from "@components/menu/SaveAccess";
import { WalletExport } from "@components/menu/WalletExport";
import { useFunWallet } from "@contexts/FunWalletContext";

import { Address } from "../Address";
import { WalletImport } from "./WalletImport";

interface AccountProps {
  signer: ethers.Wallet;
}

enum Action {
  Save,
  Import,
  Export,
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
    <Button onClick={() => setAction(Action.Import)} icon={<SaveOutlined />}>
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
        footer={
          action === Action.Save || action === null ? (
            [showImportButton, privateKeyButton]
          ) : action === Action.Export ? (
            <Button onClick={() => setAction(Action.Save)} icon={<ExportOutlined />}>
              It&apos;s saved
            </Button>
          ) : null
        }
        title={address ? <Address copyable address={address} /> : <Spin />}
      >
        {action === Action.Import ? (
          <WalletImport onClose={() => setAction(null)} />
        ) : action === Action.Save ? (
          <SaveAccess
            address={address}
            privateKey={signer.privateKey}
            onHandleExport={() => setAction(Action.Export)}
          />
        ) : action === Action.Export ? (
          <WalletExport privateKey={signer.privateKey} />
        ) : null}
      </Modal>
    </>
  );
};

export default Account;
