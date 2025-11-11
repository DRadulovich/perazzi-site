import { getCliClient } from "sanity/cli";

const client = getCliClient({
  apiVersion: process.env.SANITY_API_VERSION || "2023-10-01",
});

async function run() {
  const ids = await client.fetch<string[]>(`*[_type == "models"]._id`);
  if (!ids.length) {
    console.log("No models documents found.");
    return;
  }

  console.log(`Deleting ${ids.length} documents...`);
  const chunkSize = 50;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const transaction = client.transaction();
    chunk.forEach((id) => transaction.delete(id));
    await transaction.commit();
    console.log(`Deleted ${Math.min(i + chunkSize, ids.length)} / ${ids.length}`);
  }
  console.log("Completed deletion of models documents.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
