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

  // ownerEvents.forEach(event => {

  //     for (let i=0; i<event.args.owners.length; i++) {
  //         owners.add(event.args.owners[i]);
  //     }
  //     if (event.args.added) {
  //         owners.add(event.args.owner);
  //     } else {
  //         owners.delete(event.args.owner);
  //     }
  // });
  console.log("ownerEvents: ", ownerEvents);

  // ownerEvent === OwnerChanged
  // emits (address owner, bool added)
  return (
    <div>
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
