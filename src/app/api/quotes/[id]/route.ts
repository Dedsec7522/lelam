import { itemRoute } from "@/server/crud";
import { quotesConfig } from "@/server/resources";

export const { PATCH, DELETE } = itemRoute(quotesConfig);
