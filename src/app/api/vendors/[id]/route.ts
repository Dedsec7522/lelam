import { itemRoute } from "@/server/crud";
import { vendorsConfig } from "@/server/resources";

export const { PATCH, DELETE } = itemRoute(vendorsConfig);
