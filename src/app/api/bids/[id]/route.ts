import { itemRoute } from "@/server/crud";
import { bidsConfig } from "@/server/resources";

export const { PATCH, DELETE } = itemRoute(bidsConfig);
