import { itemRoute } from "@/server/crud";
import { documentsConfig } from "@/server/resources";

export const { PATCH, DELETE } = itemRoute(documentsConfig);
