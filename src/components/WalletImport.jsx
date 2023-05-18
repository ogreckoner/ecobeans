import React, { useState } from "react";
import { Button, Input, Space } from "antd";

export default function WalletImport({ setShowImport }) {
  const [importPrivatekey, setImportPrivatekey] = useState();

  const logIn = () => {
    const currentPrivateKey = window.localStorage.getItem("metaPrivateKey");
    if (currentPrivateKey) {
      window.localStorage.setItem("metaPrivateKey_backup" + Date.now(), currentPrivateKey);
    }

    try {
      window.localStorage.setItem("metaPrivateKey", importPrivatekey);
      window.location.reload();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div>
      <div style={{ marginTop: 16, width: 420 }}>
        <i>
          Log in to an existing wallet you have saved access to. When you do this, you will lose access to your current
          account — so save that first if you've used it.
        </i>
      </div>

      <br />

      <Space direction="vertical">
        <Input.Password
          size="large"
          name="password"
          placeholder="Use your saved passwords"
          autocomplete="current-password"
          value={importPrivatekey}
          onChange={e => setImportPrivatekey(e.target.value)}
        />
      </Space>
      <hr />

      <div style={{ float: "right" }}>
        <Button
          style={{ marginTop: 16 }}
          disabled={!importPrivatekey} //safety third!
          onClick={logIn}
        >
          Log In
        </Button>
      </div>

      <Button style={{ marginTop: 16 }} onClick={() => setShowImport(false)}>
        Cancel
      </Button>
    </div>
  );
}
