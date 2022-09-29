import { Button, List } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useEventListener } from "eth-hooks/events/useEventListener";

import { Address } from "../";

/* HOW TO USE:
    <DisplayOwners
        owners={owners}
        mainnetProvider={mainnetProvider}
        setOwners={setOwners}
    />
*/

export default function DisplayOwners({ mainnetProvider, signaturesRequired, ownerEvents, blockExplorer }) {
  const owners = new Set();
  let recentOwnerEvent = ownerEvents[ownerEvents.length - 1];
  let recentOwners = recentOwnerEvent.args.owners;
  for (let i = 0; i < recentOwners.length; i++) {
    owners.add(recentOwners[i]);
  }

  console.log("ownerEvents: ", ownerEvents);

  return (
    <div style={{ position: "left" }}>
      <List
        header={<h2>Owners</h2>}
        style={{ padding: 5, maxWidth: 400, margin: "auto" }}
        bordered
        dataSource={[...owners]}
        renderItem={ownerAddress => {
          return (
            <List.Item key={"owner_" + ownerAddress}>
              <Address
                address={ownerAddress}
                ensProvider={mainnetProvider}
                blockExplorer={blockExplorer}
                fontSize={24}
              />
            </List.Item>
          );
        }}
      />
    </div>
  );
}
