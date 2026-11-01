import { collectionRoute } from "@/server/crud";
import { inventoryConfig } from "@/server/resources";

export const { GET, POST } = collectionRoute(inventoryConfig);
