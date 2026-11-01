import { itemRoute } from "@/server/crud";
import { inventoryConfig } from "@/server/resources";

export const { PATCH, DELETE } = itemRoute(inventoryConfig);
